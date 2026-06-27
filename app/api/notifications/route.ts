import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string;
  pin_id: string;
  actor_name: string | null;
  reaction: string;
  read: boolean;
  created_at: string;
}

/** Recent reaction notifications for the signed-in member, plus the unread count. */
export async function GET() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pool = getPool();
  const { rows } = await pool.query<NotificationRow>(
    `select id, pin_id, actor_name, reaction, read, created_at
       from public.notifications
      where recipient_id = $1
      order by created_at desc
      limit 30`,
    [user.userId],
  );

  const unread = rows.reduce((n, r) => n + (r.read ? 0 : 1), 0);

  return NextResponse.json(
    {
      notifications: rows.map((r) => ({
        id: r.id,
        pinId: r.pin_id,
        actorName: r.actor_name,
        reaction: r.reaction,
        read: r.read,
        createdAt: r.created_at,
      })),
      unread,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
