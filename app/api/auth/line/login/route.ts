import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, resolveOrigin } from "@/utils/auth/line";
import { STATE_COOKIE } from "@/utils/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = resolveOrigin(request);
  const state = randomBytes(16).toString("hex");
  const nonce = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(authorizeUrl({ origin, state, nonce }));

  // Short-lived, httpOnly state cookie for CSRF protection on the callback.
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
