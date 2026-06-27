import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPool } from "@/utils/db";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delete a letter. Only a signed-in member may delete, and only their own
 * letters (owner_id must match the LINE userId in the session). Anonymous
 * letters (owner_id null) cannot be deleted by anyone — they expire on their own.
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
      `delete from public.pins where id = $1 and owner_id = $2`,
      [id, user.userId],
    );

    // Nothing deleted: either the pin doesn't exist, or it isn't this user's.
    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Not found, or not yours to delete." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the letter." }, { status: 500 });
  }
}
