import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delete a reply. Only a signed-in member may delete, and only their own replies
 * (owner_id must match the LINE userId in the session).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const pool = getPool();
  try {
    const { rowCount } = await pool.query(
      `delete from public.pin_replies where id = $1 and owner_id = $2`,
      [id, user.userId],
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Not found, or not yours to delete." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the reply." }, { status: 500 });
  }
}
