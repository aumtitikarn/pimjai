import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The ids of letters owned by the signed-in user. Used by the client to decide
 * whether to offer a delete control, so owner_id never has to be exposed to the
 * public anon API.
 */
export async function GET() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ ids: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query<{ id: string }>(
      `select id from public.pins where owner_id = $1`,
      [user.userId],
    );
    return NextResponse.json(
      { ids: rows.map((r) => r.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ids: [] }, { status: 500 });
  }
}
