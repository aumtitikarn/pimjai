import { createHmac, timingSafeEqual } from "crypto";

/**
 * A logged-in LINE user. This is the minimum we keep client-side so the Navbar
 * can greet someone by name and, later, attribute pins to an owner.
 */
export interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface SessionPayload extends LineUser {
  /** issued-at (seconds) so we can expire stale cookies */
  iat: number;
}

export const SESSION_COOKIE = "pimjai_session";
export const STATE_COOKIE = "pimjai_oauth_state";

/** 30 days, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.LINE_CHANNEL_SECRET;
  if (!value) {
    throw new Error("LINE_CHANNEL_SECRET is not set; cannot sign sessions.");
  }
  return value;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", secret()).update(data).digest());
}

/** Encode the user into a tamper-proof `payload.signature` token. */
export function createSessionToken(user: LineUser): string {
  const payload: SessionPayload = { ...user, iat: Math.floor(Date.now() / 1000) };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Verify the signature + freshness and return the user, or null if invalid. */
export function verifySessionToken(token: string | undefined): LineUser | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(body);
  const a = fromBase64url(signature);
  const b = fromBase64url(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body).toString("utf8")) as SessionPayload;
    if (typeof payload.iat !== "number") return null;
    if (Date.now() / 1000 - payload.iat > SESSION_MAX_AGE) return null;
    return {
      userId: payload.userId,
      displayName: payload.displayName,
      pictureUrl: payload.pictureUrl,
    };
  } catch {
    return null;
  }
}
