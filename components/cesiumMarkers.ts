/** Black or white text, whichever stays readable on the bubble colour. */
function inkFor(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length < 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1300" : "#ffffff";
}

function bubbleSvg(bg: string, border: string, text: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <defs>
      <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.45)"/>
      </filter>
    </defs>
    <g filter="url(#s)">
      <rect x="4" y="4" width="40" height="34" rx="13" fill="${bg}" stroke="${border}" stroke-width="2.5"/>
      <path d="M17 37 L31 37 L24 49 Z" fill="${bg}"/>
    </g>
    <text x="24" y="27" font-size="19" text-anchor="middle" fill="${text}" font-family="sans-serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Gold, glowing variant for well-loved letters. Drawn on a slightly larger canvas
 * (so the pin also reads as bigger) with a blurred golden halo behind the bubble.
 * `glow` is 1 or 2 — the higher tier is larger and brighter.
 */
function glowBubbleSvg(emoji: string, glow: number): string {
  const big = glow >= 2;
  const W = big ? 66 : 58;
  const H = big ? 72 : 62;
  const cx = W / 2;
  const bw = 40;
  const bh = 34;
  const bx = (W - bw) / 2;
  const by = big ? 10 : 8;
  const tailTipY = by + bh + 12;
  const haloR = big ? 26 : 22;
  const blur = big ? 6 : 4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#ffe9ad"/>
        <stop offset="100%" stop-color="#ffab00"/>
      </radialGradient>
      <filter id="halo" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="${blur}"/>
      </filter>
    </defs>
    <ellipse cx="${cx}" cy="${by + bh / 2}" rx="${haloR}" ry="${haloR}" fill="#ffcc3d" opacity="${big ? 0.95 : 0.8}" filter="url(#halo)"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="13" fill="url(#g)" stroke="#fffdf5" stroke-width="2.5"/>
    <path d="M${cx - 7} ${by + bh} L${cx + 7} ${by + bh} L${cx} ${tailTipY} Z" fill="#ffb91e"/>
    <text x="${cx}" y="${by + 23}" font-size="19" text-anchor="middle" fill="#3a2600" font-family="sans-serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const cache = new Map<string, string>();

/**
 * Letters with this many "เห็นด้วย" reactions glow gold. Returns the tier 0–2
 * that drives both the billboard variant and its size.
 */
export function glowTier(agreeCount: number): number {
  if (agreeCount >= 10) return 2;
  if (agreeCount >= 3) return 1;
  return 0;
}

export function pinBillboard(
  color: string,
  emoji: string,
  locked: boolean,
  glow = 0,
): string {
  // Locked letters always show the padlock so the lock affordance survives the
  // author's custom emoji; everything else shows the chosen emoji.
  const shownEmoji = locked ? "🔒" : emoji;
  const key = `${color}-${shownEmoji}-${glow}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url =
    glow > 0
      ? glowBubbleSvg(shownEmoji, glow)
      : bubbleSvg(color, "#ffffff", inkFor(color), shownEmoji);
  cache.set(key, url);
  return url;
}

export function draftBillboard(): string {
  const key = "draft";
  const cached = cache.get(key);
  if (cached) return cached;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <rect x="4" y="4" width="40" height="34" rx="13" fill="rgba(77,255,242,0.22)" stroke="#19d3c5" stroke-width="2.5" stroke-dasharray="5 4"/>
    <path d="M17 37 L31 37 L24 49 Z" fill="rgba(77,255,242,0.6)"/>
    <text x="24" y="27" font-size="18" text-anchor="middle" font-family="sans-serif">✏️</text>
  </svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}
