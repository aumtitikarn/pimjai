import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only LINE's profile CDN is allowed, so this can't be used to fetch arbitrary
// (e.g. internal) URLs.
const ALLOWED_HOST = /(^|\.)line-scdn\.net$/;

/**
 * Same-origin proxy for a LINE avatar. The share card is exported with
 * html-to-image, which must fetch every image and inline it as a data URL —
 * cross-origin LINE images have no CORS headers, so they'd come back blank.
 * Streaming them through our own origin makes them embeddable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("u");
  if (!raw) return new NextResponse("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOST.test(target.hostname)) {
    return new NextResponse("forbidden host", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
  if (!upstream.ok) return new NextResponse("upstream error", { status: 502 });

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
