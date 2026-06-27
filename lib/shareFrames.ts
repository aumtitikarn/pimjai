/**
 * Free decorative frames for the share card. Each frame is purely cosmetic —
 * an emoji-based overlay drawn on top of the mood gradient. Add new frames here;
 * the share picker renders whatever this array contains.
 */
export interface ShareFrame {
  /** Stable id used as the selected value. */
  id: string;
  /** Thai label shown under the chip. */
  name: string;
  /** Emoji shown on the picker chip. */
  icon: string;
  /** Emoji dropped into each of the four corners. Empty = no corners. */
  corner: string;
  /** Emoji repeated as a thin band along the top & bottom edges. Empty = none. */
  band: string;
  /** Inner border colour (semi-transparent, sits inside the padding). */
  border: string;
}

export const SHARE_FRAMES: ShareFrame[] = [
  {
    id: "classic",
    name: "เรียบ",
    icon: "🌐",
    corner: "",
    band: "",
    border: "transparent",
  },
  {
    id: "hearts",
    name: "หัวใจ",
    icon: "💕",
    corner: "💖",
    band: "💗",
    border: "rgba(255,45,157,0.45)",
  },
  {
    id: "sparkle",
    name: "ประกาย",
    icon: "✨",
    corner: "✨",
    band: "⭐",
    border: "rgba(255,225,77,0.5)",
  },
  {
    id: "flower",
    name: "ดอกไม้",
    icon: "🌸",
    corner: "🌸",
    band: "🌼",
    border: "rgba(255,122,217,0.45)",
  },
  {
    id: "stars",
    name: "ดวงดาว",
    icon: "🌟",
    corner: "🌟",
    band: "💫",
    border: "rgba(120,180,255,0.5)",
  },
  {
    id: "ribbon",
    name: "โบว์",
    icon: "🎀",
    corner: "🎀",
    band: "🩷",
    border: "rgba(255,170,200,0.5)",
  },
];

export const DEFAULT_FRAME_ID = "classic";

export function getFrame(id: string): ShareFrame {
  return SHARE_FRAMES.find((f) => f.id === id) ?? SHARE_FRAMES[0];
}
