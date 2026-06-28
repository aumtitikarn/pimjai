import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";
import { getProfile } from "@/utils/profile";
import { createReplySchema, type Reply } from "@/schemas/replySchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public replies on a letter, oldest first. Names resolve live from profiles (like
 * public_pins). owner_id never leaves the server: we only surface `is_mine` so the
 * client can show a delete control on the viewer's own replies.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  const pool = getPool();
  const { rows } = await pool.query<Reply & { owner_id: string | null }>(
    `select
        r.id,
        r.pin_id,
        r.text,
        case
          when r.author_name is not null
            then coalesce(nullif(pr.display_name, ''), r.author_name)
          else null
        end as author_name,
        r.author_avatar,
        r.created_at,
        r.owner_id
       from public.pin_replies r
       left join public.profiles pr on pr.line_user_id = r.owner_id
      where r.pin_id = $1
      order by r.created_at asc`,
    [id],
  );

  const replies = rows.map(({ owner_id, ...rest }) => ({
    ...rest,
    is_mine: !!user && owner_id === user.userId,
  }));

  return NextResponse.json(
    { replies, count: replies.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Post a public reply on a letter. Members only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reply.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { text, reveal_identity } = parsed.data;

  // Identity is opt-in, mirroring pins: owner_id stays private; author_name/avatar
  // are public and only set when revealing. The name honours the member's edited
  // profile name, falling back to their LINE name; the avatar is the LINE picture.
  const revealing = reveal_identity === true;
  const profileName = revealing
    ? (await getProfile(user.userId).catch(() => null))?.displayName
    : null;
  const authorName = revealing ? profileName || user.displayName : null;
  const authorAvatar = revealing ? user.pictureUrl ?? null : null;

  const pool = getPool();

  // Guard the FK up front so a missing/expired letter is a clean 404, not a 500.
  // Grab owner_id too so we can ping the letter owner about the reply.
  const exists = await pool.query<{ owner_id: string | null }>(
    `select owner_id from public.pins where id = $1`,
    [id],
  );
  if (exists.rowCount === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const pinOwnerId = exists.rows[0].owner_id;

  let reply: Reply;
  try {
    const { rows } = await pool.query<Reply>(
      `insert into public.pin_replies (pin_id, text, owner_id, author_name, author_avatar)
       values ($1, $2, $3, $4, $5)
       returning id, pin_id, text, author_name, author_avatar, created_at`,
      [id, text, user.userId, authorName, authorAvatar],
    );
    reply = { ...rows[0], is_mine: true };
  } catch (error) {
    console.error("[POST /api/pins/[id]/replies] insert failed:", error);
    return NextResponse.json({ error: "Could not post the reply." }, { status: 500 });
  }

  // Notify the letter owner — members only — when someone other than themselves
  // replies. The actor label uses the revealed name, else "นิรนาม". Best-effort:
  // a failed ping must never fail the reply.
  if (pinOwnerId && pinOwnerId !== user.userId) {
    pool
      .query(
        `insert into public.notifications (recipient_id, pin_id, actor_name, reaction)
         values ($1, $2, $3, 'reply')`,
        [pinOwnerId, id, authorName ?? "นิรนาม"],
      )
      .catch(() => {});
  }

  return NextResponse.json({ reply }, { status: 201 });
}
