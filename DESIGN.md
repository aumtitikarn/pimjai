---
name: Pimjai
description: Drop a message anywhere on Earth — anonymous geo-messaging on a 3D globe.
colors:
  globe-night: "#0b1220"
  ink: "#0f172a"
  glass-surface: "#ffffffd1"
  slate-800: "#1e293b"
  slate-700: "#334155"
  slate-500: "#64748b"
  slate-400: "#94a3b8"
  slate-300: "#cbd5e1"
  slate-200: "#e2e8f0"
  accent-fuchsia: "#d946ef"
  accent-fuchsia-soft: "#e879f9"
  draft-cyan: "#19d3c5"
  state-unlocked: "#059669"
  state-error: "#ef4444"
  mood-pink: "#ff2d9d"
  mood-pink-light: "#ff7ad9"
  mood-pink-ink: "#2b0020"
  mood-black: "#0d0a16"
  mood-black-deep: "#241a3d"
  mood-black-ink: "#f3f0ff"
  mood-yellow: "#ffe14d"
  mood-yellow-light: "#fff6c4"
  mood-yellow-ink: "#1a1300"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "normal"
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  brand:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.025em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  card-glass:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input-field:
    backgroundColor: "#ffffffb3"
    textColor: "{colors.slate-800}"
    rounded: "{rounded.md}"
    padding: "12px"
  input-field-focus:
    backgroundColor: "#ffffffb3"
    textColor: "{colors.slate-800}"
    rounded: "{rounded.md}"
    padding: "12px"
  button-submit:
    backgroundColor: "{colors.accent-fuchsia}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "#ffffff00"
    textColor: "{colors.slate-600}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  mood-tile:
    backgroundColor: "#ffffff99"
    textColor: "{colors.slate-500}"
    rounded: "{rounded.md}"
    padding: "8px"
---

# Design System: Pimjai

## 1. Overview

**Creative North Star: "Lit Windows in a Dark City"**

Pimjai is a single, full-bleed 3D globe rendered at night (`#0b1220`), and everything else is a small lit window glowing on its surface. The globe is the dark, enormous city; each message a stranger left is a warm rectangle of light you can press your face against. That contrast — vast cold dark against small warm intimate — *is* the design. The interface should always feel like you are alone with the Earth and the few hearts currently visible on it, never like you are browsing a product.

The system commits to **floating glass over real depth**. Chrome (search, brand, forms, popups) is built from translucent light-glass cards that lift off the canvas with soft blur and shadow; the live 3D scene supplies the actual parallax and depth, so glassmorphism here is structural, not decorative cliché. Saturation is rationed hard: the surface and all chrome are night-navy and cool slate neutrals, and the only fully saturated color in the entire product belongs to a message's **mood** (pink / black / yellow). The words carry the hue; the UI never competes for it.

This system explicitly rejects the **cluttered social feed**: no timelines, counts, likes, follows, badges, leaderboards, or notification noise. Discovery is one window at a time, by chance. It also stays watchful of its own expressive impulses — the neon brand gradient and glowing warp button are permitted as rare punctuation, never as an all-over web3 wash, because loudness fights the intimacy the product exists for.

**Key Characteristics:**
- One full-screen globe; UI floats over it and recedes.
- Night-navy + cool-slate neutral chrome; mood color is the only saturation.
- Light-glass cards (blur + soft shadow) as the universal chrome material.
- Soft, tender geometry: generous radii (12–24px), no hard corners.
- Expressive effects (warp glow, brand gradient) are rare punctuation, not wallpaper.

## 2. Colors

A cold, dark-navy stage and a cool-slate neutral ramp, against which three saturated mood palettes are the only true color — reserved for the message itself.

### Primary
- **Fuchsia Pulse** (`#d946ef`): The single interactive accent. Focus borders on inputs, the lock toggle's "on" state, the active map-search hover, the "Crack" / unlock action. It signals *"this responds to you."* Used sparingly on chrome, never as a fill across large areas.
- **Fuchsia Soft** (`#e879f9`): The lighter focus-border variant on glass inputs where full Fuchsia Pulse would be too heavy on a translucent surface.

### Secondary — Mood Palettes (the message's color, never the chrome's)
- **Romance Pink** (`#ff2d9d` → `#ff7ad9`, ink `#2b0020`): The "Romance" mood. Hot magenta gradient on share cards and globe markers.
- **Venting Black** (`#0d0a16` → `#241a3d`, halo `#c9b8ff`, ink `#f3f0ff`): The "Venting" mood. Near-black violet gradient; a soft lilac halo keeps its marker visible on the dark globe.
- **Memes Yellow** (`#ffe14d` → `#fff6c4`, ink `#1a1300`): The "Memes" mood. Warm buttercup; always pairs with near-black ink for contrast.

### Tertiary
- **Draft Cyan** (`#19d3c5`, fill `rgba(77,255,242,0.22)`): Reserved exclusively for the *draft* marker — the dashed, not-yet-saved pin you're placing. Cyan = provisional; never used for committed pins.
- **Unlocked Green** (`#059669`): The "unlocked" status chip after a correct password. Quiet success, not celebration.
- **Error Red** (`#ef4444`): Form validation and wrong-password text only.

### Neutral
- **Globe Night** (`#0b1220`): The body and globe backdrop. The dark city. Everything sits on this.
- **Ink** (`#0f172a`): Default text color *inside* glass cards (slate-900). Heavy enough to clear 4.5:1 on the light glass.
- **Glass Surface** (`rgba(255,255,255,0.82)`): The universal chrome material — every card, popup, search bar, and pill.
- **Slate ramp** (`#1e293b` 800 → `#cbd5e1` 300): Body text, secondary labels, muted captions, input borders, dividers. Cooler-than-warm, matching the night.

### Named Rules
**The Message Owns The Color Rule.** Saturated mood color belongs to the message and its share card — full stop. Chrome (search, brand bar, forms, popups, toggles) stays night-navy + slate neutral, accented only by Fuchsia Pulse. If a button, panel, or background is carrying a mood gradient, it is wrong: the strangers' words must be the most colorful thing on screen.

**The Rationed Neon Rule.** The cyan→fuchsia→amber brand gradient and the warp button's purple glow are the *only* sanctioned uses of multi-stop neon, and each appears exactly once (the wordmark; the warp CTA). Neon gradient anywhere else reads as web3 hype and is forbidden.

## 3. Typography

**Display / Body / Label Font:** Geist Sans (with `system-ui, sans-serif` fallback)
**Mono Font:** Geist Mono — available for coordinates and technical labels (lat/lng), used sparingly.

**Character:** One family, many weights. Geist is a clean, neutral, slightly technical grotesque — it gets out of the way so a stranger's sentence is the voice in the room, not the typeface. Personality comes from *weight contrast* (400 body against 800 display), never from a second face. The Thai wordmark พิมพ์ใจ carries the cultural warmth the Latin type deliberately withholds.

### Hierarchy
- **Display** (800, 28px, line-height 1.35): The message text on a share card — the single most important words in the product. Drops to 22px past 80 characters so long confessions still fit.
- **Headline** (700, 1.125rem / 18px, line-height 1.3): Card titles — "Drop a message ✨". One per panel.
- **Body** (400, 0.875rem / 14px, line-height 1.45): Pin popup text, hints, helper copy. Keep reading measures short; popups cap ~260px wide by design.
- **Label** (600, 0.75rem / 12px, +0.06em tracking): Status chips (locked / unlocked), mood labels, counters, the share-card eyebrow.
- **Brand** (800, 0.875rem / 14px, +0.025em): The พิมพ์ใจ · Pimjai wordmark only.

### Named Rules
**The One Family Rule.** Geist Sans does all the work; Geist Mono is permitted only for raw coordinates. Never introduce a third typeface or a display serif — the restraint is what lets the message feel personal rather than packaged.

## 4. Elevation

This is a **depth-real, glass-floating** system. The 3D globe provides genuine perspective depth; the UI layer floats above it as translucent glass with backdrop blur and a single soft drop shadow. Depth is conveyed by blur + translucency + shadow together — a card reads as glass held in front of the scene, not as a flat panel pasted on top. There is no flat-paper layer anywhere.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 10px 30px rgba(0,0,0,0.25)` ≈ Tailwind `shadow-2xl`): The standard float for popups, the drop form, and search results. Soft, wide, low-opacity — a held object, not a hard cutout.
- **Search rest** (`shadow-lg`): A lighter lift for the always-present search bar and brand pill, which sit closer to the surface.
- **Warp glow** (`box-shadow: 0 0 25px rgba(157,77,255,0.6)`): The single colored glow in the system, on the warp CTA only. Signals "this crosses distance." Forbidden elsewhere.

### Named Rules
**The Glass-Or-Nothing Rule.** Chrome is either floating glass (blur ≥14px, translucency 0.82, soft shadow) or it does not exist. No opaque white panels, no hard-edged solid cards. If backdrop-filter is unavailable, fall back to `rgba(255,255,255,0.92)` — never a flat opaque fill that breaks the floating illusion.

## 5. Components

### Buttons
- **Shape:** Soft. Pills (`rounded-full`) for floating chrome (brand, search, warp); 12px (`rounded-xl`) for in-card actions.
- **Submit ("Drop it here", "Crack"):** Fuchsia Pulse fill (`#d946ef`) — or its fuchsia→purple gradient for the high-commitment "drop"/"crack" moment — white text, 12px radius, soft fuchsia-tinted shadow. This is the only filled-accent button.
- **Warp (signature):** Pill with the cyan→fuchsia→purple gradient and the `rgba(157,77,255,0.6)` glow, fixed bottom-right. `active:scale-95` on press. Disabled (no pins) drops to 40% opacity. The one permitted neon object.
- **Ghost / icon (close, copy-link):** No fill, slate-400 text, hover to slate-700. Used for dismissals and secondary actions so they recede.

### Chips (status)
- **Style:** Tiny label-weight text with a 12px leading icon, no background — color *is* the chip. Locked = Fuchsia Pulse + lock icon; Unlocked = Unlocked Green + open-lock icon.
- **State:** Read-only status indicators, not interactive filters. They report the pin's lock state, nothing more.

### Cards / Containers
- **Corner Style:** 24px (`rounded-xl`) for the drop form and result lists; the form's mobile sheet uses `rounded-t-3xl` (rounded top only, flush bottom).
- **Background:** Glass Surface — `rgba(255,255,255,0.82)` with `backdrop-filter: blur(14px) saturate(140%)` and a `rgba(255,255,255,0.6)` hairline border.
- **Shadow Strategy:** Card lift (`shadow-2xl`); see Elevation.
- **Internal Padding:** 20px (`p-5`) for forms; tighter for popups (~260px fixed width).
- **Signature detail:** the **popup tail** — a 10px CSS triangle in the glass color pointing down to the exact pin on the globe, with a faint drop-shadow. It ties floating UI to a real coordinate.

### Inputs / Fields
- **Style:** Translucent white (`bg-white/70`), 1px slate-300 border, 12px radius, slate-800 text. Placeholder is slate-400 — **verify it still clears 4.5:1 over the bright/translucent surface; bump toward slate-500 if it doesn't.**
- **Focus:** Border shifts to Fuchsia Soft (`#e879f9`); no heavy glow. Quiet, precise feedback.
- **Error:** Inline Error Red helper text below the field; wrong-password triggers the `pimjai-shake` animation on the popup.

### Navigation
- There is no nav bar. "Navigation" is the globe itself plus three floating affordances: the centered brand pill + **SearchBox** (top), and the **WarpButton** (bottom-right). All `pointer-events` are scoped so the globe stays draggable between them. On mobile the warp label collapses to "Warp"; the drop form becomes a bottom sheet.

### ShareCard (signature)
- A 360×450 export-only card (rendered off-screen, captured via html-to-image at 2× for sharing). Full-bleed mood gradient, mood-ink text, an uppercase tracked พิมพ์ใจ · pimjai eyebrow, the message in 800-weight quotes, and a 📍 reverse-geocoded location label. Locked secrets render a censored hatch-blur bar with a lock icon and the hint — a *tease*, never the plaintext.

## 6. Do's and Don'ts

### Do:
- **Do** keep the globe the loudest thing on screen. Chrome recedes; a stranger's words win.
- **Do** reserve all saturated color for the message and its mood — pink `#ff2d9d`, black `#0d0a16`, yellow `#ffe14d`. Chrome stays night-navy + slate.
- **Do** build every piece of chrome as floating glass (blur ≥14px, `rgba(255,255,255,0.82)`, soft shadow) — the Glass-Or-Nothing Rule.
- **Do** keep accent to Fuchsia Pulse on interactive chrome, used sparingly.
- **Do** reveal pins one at a time, by chance. Serendipity over density.
- **Do** give every animation a `prefers-reduced-motion` fallback — the warp camera-fly especially must degrade to an instant cut (highest vestibular risk).
- **Do** pair mood with an icon/label, never color alone, for color-blind users.
- **Do** verify glass-card body text and placeholders clear 4.5:1 over bright globe regions; bump slate-400 → slate-500 if a measure fails.

### Don't:
- **Don't** build anything resembling a **cluttered social feed** — no timelines, counts, likes, follows, badges, leaderboards, "trending," profiles, or notification noise. Discovery is one pin, by chance.
- **Don't** let the neon brand gradient or warp glow spread beyond their two sanctioned homes (the wordmark; the warp CTA). Neon-everywhere is web3-hype loudness and fights the intimacy goal.
- **Don't** put mood color on chrome — no mood-gradient buttons, panels, or backgrounds. The Message Owns The Color.
- **Don't** ship opaque flat panels or hard-edged solid cards; it breaks the floating-glass illusion.
- **Don't** introduce a second typeface or a display serif. Geist in many weights only.
- **Don't** use light-gray body text "for elegance" on the bright glass — it fails contrast and reads as AI default.
- **Don't** gate content visibility behind a class-triggered reveal; the fade-in animations must enhance already-visible content, never hide it.
