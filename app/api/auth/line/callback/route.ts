import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchProfile, resolveOrigin } from "@/utils/auth/line";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  STATE_COOKIE,
  createSessionToken,
} from "@/utils/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = resolveOrigin(request);
  const home = new URL("/", origin);

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  // User declined, or LINE returned an error.
  if (error || !code) {
    home.searchParams.set("login", "cancelled");
    return clearStateAndRedirect(home);
  }

  // CSRF: the state echoed back must match the one we set before redirecting.
  if (!state || !expectedState || state !== expectedState) {
    home.searchParams.set("login", "error");
    return clearStateAndRedirect(home);
  }

  try {
    const accessToken = await exchangeCodeForToken({ code, origin });
    const user = await fetchProfile(accessToken);

    home.searchParams.set("login", "success");
    const response = NextResponse.redirect(home);
    response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    home.searchParams.set("login", "error");
    return clearStateAndRedirect(home);
  }
}

function clearStateAndRedirect(to: URL) {
  const response = NextResponse.redirect(to);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
