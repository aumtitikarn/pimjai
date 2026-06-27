"use client";

import { forwardRef } from "react";
import { Lock } from "lucide-react";
import type { ReactionType } from "@/schemas/pinSchema";
import { getFrame } from "@/lib/shareFrames";

const REACTION_EMOJI: Record<ReactionType, string> = {
  pat: "🫶",
  hug: "🤗",
  agree: "👍",
};

/** Pick black or white text so it stays readable on the chosen card colour. */
function readableInk(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length < 6) return "#1e1733";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#1e1733" : "#ffffff";
}

interface ShareCardProps {
  text: string;
  /** Card background colour, chosen via the picker. */
  bgColor: string;
  locationLabel: string;
  isLocked: boolean;
  isDecrypted: boolean;
  hint: string | null;
  /** Decorative frame id from lib/shareFrames. */
  frameId: string;
  /** Author display name, or null for anonymous letters. */
  authorName?: string | null;
  /** Author avatar URL (ideally a data URL so html-to-image can embed it). */
  authorAvatar?: string | null;
  /** Brand logo source — a data URL during export so it embeds reliably. */
  logoSrc?: string;
  /** Reaction tallies to print on the card. */
  counts: Record<ReactionType, number>;
  /** Whether to print the reaction tallies. Default true. */
  showReactions?: boolean;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  (
    {
      text,
      bgColor,
      locationLabel,
      isLocked,
      isDecrypted,
      hint,
      frameId,
      authorName,
      authorAvatar,
      logoSrc = "/logo.png",
      counts,
      showReactions = true,
    },
    ref,
  ) => {
    const showCensored = isLocked && !isDecrypted;
    const frame = getFrame(frameId);
    const ink = readableInk(bgColor);
    const totalReactions = counts.pat + counts.hug + counts.agree;

    const cornerBase = {
      position: "absolute" as const,
      fontSize: 28,
      lineHeight: 1,
      pointerEvents: "none" as const,
      userSelect: "none" as const,
    };

    return (
      // Outer canvas — 360×640 (9:16). White margins frame the card.
      <div
        ref={ref}
        style={{
          width: 360,
          height: 640,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 26,
          boxSizing: "border-box",
          fontFamily: "var(--font-sans), sans-serif",
        }}
      >
        {/* Inner card — sized to its content, centred in the white canvas. */}
        <div
          style={{
            width: "100%",
            maxHeight: "100%",
            background: bgColor,
            color: ink,
            borderRadius: 24,
            padding: 26,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            border:
              frame.border === "transparent"
                ? "none"
                : `2px solid ${frame.border}`,
          }}
        >
          {/* Frame decoration — corners + edge bands */}
          {frame.corner && (
            <>
              <span style={{ ...cornerBase, top: 8, left: 10 }}>{frame.corner}</span>
              <span style={{ ...cornerBase, top: 8, right: 10 }}>{frame.corner}</span>
              <span style={{ ...cornerBase, bottom: 8, left: 10 }}>{frame.corner}</span>
              <span style={{ ...cornerBase, bottom: 8, right: 10 }}>{frame.corner}</span>
            </>
          )}
          {frame.band && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 46,
                  right: 46,
                  textAlign: "center",
                  fontSize: 13,
                  letterSpacing: 5,
                  opacity: 0.85,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {frame.band.repeat(8)}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 46,
                  right: 46,
                  textAlign: "center",
                  fontSize: 13,
                  letterSpacing: 5,
                  opacity: 0.85,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {frame.band.repeat(8)}
              </div>
            </>
          )}

          {/* Header — author identity (or brand fallback) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              zIndex: 1,
              marginTop: frame.band ? 14 : 0,
            }}
          >
            {authorName ? (
              <>
                {authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorAvatar}
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      objectFit: "cover",
                      border: `2px solid ${ink}33`,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${ink}1f`,
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    {authorName.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <span style={{ fontSize: 15, fontWeight: 700 }}>{authorName}</span>
              </>
            ) : (
              <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.85 }}>
                💌 ใครบางคน
              </span>
            )}
          </div>

          {/* Body — the message (or censored block) */}
          <div style={{ marginTop: 16, zIndex: 1 }}>
            {showCensored ? (
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    height: 80,
                    borderRadius: 16,
                    background:
                      "repeating-linear-gradient(45deg, rgba(0,0,0,0.85), rgba(0,0,0,0.85) 10px, rgba(0,0,0,0.7) 10px, rgba(0,0,0,0.7) 20px)",
                    filter: "blur(2px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={30} color="#fff" />
                </div>
                <div style={{ marginTop: 14, fontSize: 14, opacity: 0.85 }}>
                  🔓 Hint: <strong>{hint}</strong>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: text.length > 80 ? 22 : 28,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  wordBreak: "break-word",
                }}
              >
                “{text}”
              </div>
            )}
          </div>

          {/* Footer — reactions, location, website credit */}
          <div style={{ marginTop: 18, zIndex: 1 }}>
            {showReactions && totalReactions > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 10,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <span>
                  {REACTION_EMOJI.pat} {counts.pat}
                </span>
                <span>
                  {REACTION_EMOJI.hug} {counts.hug}
                </span>
                <span>
                  {REACTION_EMOJI.agree} {counts.agree}
                </span>
              </div>
            )}

            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
              📍 {locationLabel}
            </div>

            <div
              className="flex  gap-2"
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${ink}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt=""
                width={20}
                height={20}
                style={{ borderRadius: 5 }}
              />
              <span className="text-sm font-bold tracking-wide">pimjai</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
