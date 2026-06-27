import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark all of the signed-in member's notifications as read. */
export async function POST() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pool = getPool();
  await pool.query(
    `update public.notifications set read = true
      where recipient_id = $1 and read = false`,
    [user.userId],
  );

  return NextResponse.json({ ok: true });
}
