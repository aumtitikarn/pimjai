import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, verifySessionToken } from "@/utils/auth/session";
import { getProfile, upsertProfile } from "@/utils/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  displayName: z.string().trim().min(1, "ใส่ชื่อก่อนนะ").max(40, "ชื่อยาวเกินไป"),
  bio: z.string().trim().max(200, "Bio ยาวเกินไป").optional().default(""),
});

/** The signed-in member's editable overrides. */
export async function GET() {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await getProfile(user.userId);
  return NextResponse.json(
    {
      profile: {
        displayName: profile?.displayName ?? user.displayName,
        bio: profile?.bio ?? "",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Save the member's custom display name + bio. Avatar is not editable. */
export async function PATCH(request: Request) {
  const store = await cookies();
  const user = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const bio = parsed.data.bio.trim();
  const saved = await upsertProfile(user.userId, parsed.data.displayName, bio || null);

  return NextResponse.json({
    profile: { displayName: saved.displayName, bio: saved.bio ?? "" },
  });
}
