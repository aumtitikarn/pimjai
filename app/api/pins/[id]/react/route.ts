import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";
import { REACTION_TYPES, type ReactionState, type ReactionType } from "@/schemas/pinSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stable per-browser id for anonymous voters, so a tap can't be spammed. */
const VOTER_COOKIE = "pimjai_voter";
const VOTER_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const reactSchema = z.object({ type: z.enum(REACTION_TYPES) });

const COUNT_COLUMN: Record<ReactionType, string> = {
  pat: "pat_count",
  hug: "hug_count",
  agree: "agree_count",
};

/**
 * Resolve the voter id: the LINE userId when signed in (so the same person can't
 * double-vote across devices), otherwise a random per-browser cookie. Returns the
 * id plus a flag for whether a freshly minted cookie needs to be set on the
 * response. `mint` is false for reads (we don't hand out cookies just for looking).
 */
async function resolveVoter(mint: boolean): Promise<{ id: string | null; setCookie: string | null }> {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (user) return { id: `line:${user.userId}`, setCookie: null };

  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing) return { id: `anon:${existing}`, setCookie: null };
  if (!mint) return { id: null, setCookie: null };

  const fresh = randomUUID();
  return { id: `anon:${fresh}`, setCookie: fresh };
}

function withVoterCookie(res: NextResponse, value: string | null): NextResponse {
  if (value) {
    res.cookies.set(VOTER_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VOTER_MAX_AGE,
    });
  }
  return res;
}

async function readState(id: string, voterId: string | null): Promise<ReactionState | null> {
  const pool = getPool();
  const counts = await pool.query<{ pat_count: number; hug_count: number; agree_count: number }>(
    `select pat_count, hug_count, agree_count from public.pins where id = $1`,
    [id],
  );
  if (counts.rowCount === 0) return null;
  const row = counts.rows[0];

  let mine: ReactionType[] = [];
  if (voterId) {
    const { rows } = await pool.query<{ type: ReactionType }>(
      `select type from public.pin_reactions where pin_id = $1 and voter_id = $2`,
      [id, voterId],
    );
    mine = rows.map((r) => r.type);
  }

  return {
    counts: { pat: row.pat_count, hug: row.hug_count, agree: row.agree_count },
    mine,
  };
}

/** Current tallies for a letter, and which reactions this viewer has already cast. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { id: voterId } = await resolveVoter(false);

  const state = await readState(id, voterId);
  if (!state) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}

/** Toggle one reaction for the current voter and return the updated state. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = reactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 422 });
  }
  const { type } = parsed.data;
  const column = COUNT_COLUMN[type];

  const { id: voterId, setCookie } = await resolveVoter(true);
  if (!voterId) {
    return NextResponse.json({ error: "Could not identify voter." }, { status: 500 });
  }

  // The reactor's identity, for the notification's "actor" label.
  const store = await cookies();
  const reactor = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  const pool = getPool();
  const client = await pool.connect();
  let ownerId: string | null = null;
  let addedReaction = false;
  try {
    // Guard the FK up front so a missing/expired letter is a clean 404, not a 500.
    // Grab owner_id too so we can ping a member when their letter gets a reaction.
    const exists = await client.query<{ owner_id: string | null }>(
      `select owner_id from public.pins where id = $1`,
      [id],
    );
    if (exists.rowCount === 0) {
      return withVoterCookie(NextResponse.json({ error: "Not found." }, { status: 404 }), setCookie);
    }
    ownerId = exists.rows[0].owner_id;

    await client.query("begin");

    // One feeling per voter per letter: clear whatever this voter previously cast
    // (decrementing each), then add the tapped one — unless they tapped the same
    // type they already had, which toggles it off.
    const existing = await client.query<{ type: ReactionType }>(
      `select type from public.pin_reactions where pin_id = $1 and voter_id = $2`,
      [id, voterId],
    );
    const existingTypes = existing.rows.map((r) => r.type);
    const tappedSame = existingTypes.includes(type);
    addedReaction = !tappedSame;

    if (existingTypes.length > 0) {
      await client.query(
        `delete from public.pin_reactions where pin_id = $1 and voter_id = $2`,
        [id, voterId],
      );
      for (const t of existingTypes) {
        const col = COUNT_COLUMN[t];
        await client.query(
          `update public.pins set ${col} = greatest(${col} - 1, 0) where id = $1`,
          [id],
        );
      }
    }

    if (!tappedSame) {
      await client.query(
        `insert into public.pin_reactions (pin_id, voter_id, type) values ($1, $2, $3)`,
        [id, voterId, type],
      );
      await client.query(`update public.pins set ${column} = ${column} + 1 where id = $1`, [id]);
    }

    await client.query("commit");
  } catch {
    await client.query("rollback").catch(() => {});
    client.release();
    return NextResponse.json({ error: "Could not react." }, { status: 500 });
  }

  client.release();

  // Notify the letter owner — members only (owner_id is set just for signed-in
  // authors) — when a *new* reaction lands and they didn't react to themselves.
  // Best-effort: a failed ping must never fail the reaction.
  if (addedReaction && ownerId && ownerId !== reactor?.userId) {
    pool
      .query(
        `insert into public.notifications (recipient_id, pin_id, actor_name, reaction)
         values ($1, $2, $3, $4)`,
        [ownerId, id, reactor?.displayName ?? null, type],
      )
      .catch(() => {});
  }

  const state = await readState(id, voterId);
  if (!state) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return withVoterCookie(
    NextResponse.json(state, { headers: { "Cache-Control": "no-store" } }),
    setCookie,
  );
}
