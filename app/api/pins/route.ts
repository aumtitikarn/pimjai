import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/utils/db";
import { MOODS } from "@/schemas/pinSchema";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";
import { getProfile } from "@/utils/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A self-destructing letter lives for 24 hours. */
const EPHEMERAL_TTL_MS = 24 * 60 * 60 * 1000;

// The text here may be AES ciphertext for locked pins, so it can exceed the
// 150-char plaintext limit the form enforces. The DB CHECK caps it at 4000.
const createPinSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mood: z.enum(MOODS),
  emoji: z.string().min(1).max(8).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  is_locked: z.boolean(),
  hint: z.string().max(80).nullable().optional(),
  // Author choices. Only honored for signed-in users — see below.
  reveal_identity: z.boolean().optional(),
  ephemeral: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pin.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  const { text, lat, lng, mood, emoji, color, is_locked, hint, reveal_identity, ephemeral } =
    parsed.data;

  // owner_id is always set for signed-in users (it drives delete control) and
  // stays private regardless of the identity choice below.
  const ownerId = user?.userId ?? null;

  // Identity is opt-in and only possible when signed in (an anonymous guest has
  // no LINE profile to reveal). These columns are publicly readable. The author
  // name honours the member's edited profile name, falling back to their LINE
  // name; the avatar always stays the LINE picture (not editable).
  const revealing = !!user && reveal_identity === true;
  const profileName = revealing
    ? (await getProfile(user.userId).catch(() => null))?.displayName
    : null;
  const authorName = revealing ? profileName || user.displayName : null;
  const authorAvatar = revealing ? user.pictureUrl ?? null : null;

  // Lifetime: anonymous guests are always ephemeral (they can't manage letters);
  // signed-in users choose permanent (default) or a 24h self-destruct.
  const isEphemeral = user ? ephemeral === true : true;
  const expiresAt = isEphemeral
    ? new Date(Date.now() + EPHEMERAL_TTL_MS).toISOString()
    : null;

  const pool = getPool();

  try {
    const { rows } = await pool.query(
      `insert into public.pins (text, lat, lng, mood, emoji, color, is_locked, hint, owner_id, expires_at, author_name, author_avatar)
       values ($1, $2, $3, $4::mood_type, $5, $6, $7, $8, $9, $10, $11, $12)
       returning id, text, lat, lng, mood, emoji, color, is_locked, hint, owner_id, created_at, expires_at, author_name, author_avatar`,
      [text, lat, lng, mood, emoji ?? null, color ?? null, is_locked, hint ?? null, ownerId, expiresAt, authorName, authorAvatar],
    );

    // Opportunistic janitor: sweep expired letters on write. Best-effort.
    pool
      .query(`delete from public.pins where expires_at is not null and expires_at < now()`)
      .catch(() => {});

    return NextResponse.json({ pin: rows[0] }, { status: 201 });
  } catch (error) {
    // Surface the real DB error in the server logs so production 500s are
    // diagnosable (the client still gets a generic message).
    console.error("[POST /api/pins] insert failed:", error);
    return NextResponse.json({ error: "Could not drop the pin." }, { status: 500 });
  }
}
