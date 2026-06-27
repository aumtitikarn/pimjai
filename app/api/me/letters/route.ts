import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Every letter owned by the signed-in member, newest first — for the "my letters"
 * manager. Owner-authenticated and server-only, so owner_id never reaches the
 * public client. Locked letters still come back as ciphertext (the text is only
 * decryptable with the password), so the UI shows the hint for those.
 */
export async function GET() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `select id, text, lat, lng, mood, emoji, color, is_locked, hint,
              created_at, expires_at, pat_count, hug_count, agree_count
         from public.pins
        where owner_id = $1
        order by created_at desc`,
      [user.userId],
    );
    return NextResponse.json({ letters: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load letters." }, { status: 500 });
  }
}
