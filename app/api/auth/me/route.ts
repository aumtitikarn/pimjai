import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";
import { getProfile } from "@/utils/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }

  // Merge the editable profile so the custom name + bio surface everywhere the
  // session user does (Navbar, etc.). Falls back to the LINE name when unset.
  const profile = await getProfile(user.userId).catch(() => null);
  return NextResponse.json(
    {
      user: {
        ...user,
        displayName: profile?.displayName || user.displayName,
        bio: profile?.bio ?? null,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
