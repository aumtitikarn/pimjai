import type { LineUser } from "./session";

const AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const PROFILE_URL = "https://api.line.me/v2/profile";

export const LINE_SCOPE = "profile openid";

function channelId(): string {
  const value = process.env.LINE_CHANNEL_ID;
  if (!value) throw new Error("LINE_CHANNEL_ID is not set.");
  return value;
}

function channelSecret(): string {
  const value = process.env.LINE_CHANNEL_SECRET;
  if (!value) throw new Error("LINE_CHANNEL_SECRET is not set.");
  return value;
}

/**
 * Resolve the public origin of the app for a request.
 *
 * Behind a reverse proxy / tunnel (e.g. cloudflared) `request.url` reflects the
 * internal target (often http://localhost:3000), which produces a redirect_uri
 * that doesn't match what the browser sees. Prefer an explicit override, then
 * the proxy's forwarded headers, then fall back to the request URL.
 */
export function resolveOrigin(request: Request): string {
  const override = process.env.LINE_REDIRECT_ORIGIN ?? process.env.APP_ORIGIN;
  if (override) return override.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

/** The OAuth callback URL, derived from the incoming request's origin. */
export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/line/callback`;
}

/** Build the LINE authorize URL the user is redirected to on login. */
export function authorizeUrl(params: {
  origin: string;
  state: string;
  nonce: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", channelId());
  url.searchParams.set("redirect_uri", callbackUrl(params.origin));
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", LINE_SCOPE);
  url.searchParams.set("nonce", params.nonce);
  return url.toString();
}

/** Exchange an authorization code for an access token. */
export async function exchangeCodeForToken(params: {
  code: string;
  origin: string;
}): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: callbackUrl(params.origin),
      client_id: channelId(),
      client_secret: channelSecret(),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LINE token exchange failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("LINE token response missing access_token.");
  return data.access_token;
}

/** Fetch the LINE profile for an access token. */
export async function fetchProfile(accessToken: string): Promise<LineUser> {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LINE profile fetch failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };

  return {
    userId: data.userId,
    displayName: data.displayName,
    pictureUrl: data.pictureUrl,
  };
}
