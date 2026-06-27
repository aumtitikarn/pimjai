import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/utils/auth/session";

export const runtime = "nodejs";

function logout(request: Request) {
  const home = new URL("/", new URL(request.url).origin);
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
