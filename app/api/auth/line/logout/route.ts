import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/utils/auth/session";
import { resolveOrigin } from "@/utils/auth/line";

export const runtime = "nodejs";

function logout(request: Request) {
  // Use the public origin (proxy headers / LINE_REDIRECT_ORIGIN), not the raw
  // request URL — behind a proxy the latter is the internal 0.0.0.0:3000.
  const home = new URL("/", resolveOrigin(request));
  const response = NextResponse.redirect(home);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

// GET supports a plain <a href> logout link; POST supports a form submit.
export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
