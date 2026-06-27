# Product

## Register

product

## Users

Anonymous, curious people anywhere in the world — no account, no profile, no
audience. They arrive alone, often on a phone, in a quiet moment. Two jobs bring
them here:

- **Leave something behind** — drop a message, a confession, or a password-locked
  secret at a place that means something to them (a hometown, a where-we-met, a
  grave, a window they once looked out of).
- **Find something left** — spin the globe, "warp to a stranger's mind," and read
  what someone else trusted to a coordinate. The pull is human, not utilitarian.

Context: solo, unhurried, emotionally open. The user is not managing tasks or
hitting a goal — they're reaching across distance to another person.

## Product Purpose

Pimjai (พิมพ์ใจ — "to imprint the heart") lets anyone pin a text message or a
locked secret to any point on a 3D globe, anonymously, and discover the messages
strangers have left. Locks (crypto-js) gate a secret behind a password and an
optional hint; moods color the pin; messages are deep-linkable and shareable as
cards.

Success is not engagement metrics. Success is the moment a stranger's pin makes
someone feel less alone — that the Earth is quietly covered in other people's
hearts, and you can press your ear to it.

## Brand Personality

Intimate, human, quietly wondrous. Three words: **tender, curious, vast.**

The globe is dark and enormous; the messages on it are small, warm, and personal —
that contrast IS the brand. Voice is soft and second-person, never hype ("Warp to
a stranger's mind," not "Discover trending pins"). The product should feel like
holding a single lit window in a dark city, not a billboard. Expressive touches
(the warp, mood color, the Thai wordmark) earn their place by deepening intimacy,
not by demanding attention.

## Anti-references

- **A cluttered social feed.** No timelines, no counts, no likes, follows,
  notifications, or engagement bait. Nothing that turns a confession into content.
  Discovery is one pin at a time, by chance — not an infinite scroll.
- By extension: no badges, no leaderboards, no "trending," no profiles. The value
  is anonymity and serendipity; any feature that accumulates social status breaks it.
- Watch the current neon-gradient surface (rainbow wordmark, glowing warp button):
  energetic playfulness can drift toward web3-hype loudness, which fights the
  intimacy goal. Keep expressive moments rare and warm, not maximal.

## Design Principles

- **The globe is the stage; the message is the actor.** Chrome stays minimal and
  recedes. Every UI element competes with a stranger's words for attention and
  should usually lose.
- **One heart at a time.** Reveal pins singly and deliberately. Serendipity beats
  density; resist any urge to show "all messages near you" as a list.
- **Earn every effect.** Motion, glow, and color are emotional tools, not
  decoration. The warp should feel like crossing distance; a lock should feel like
  a held breath. If an effect doesn't deepen the feeling, cut it.
- **Anonymous, never lonely.** The design carries warmth without identity — the
  product makes you feel accompanied by strangers, not surveilled or sold to.
- **Tender over slick.** When a choice is between polished-impersonal and
  rougher-but-human, choose human.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. Body text ≥4.5:1, large text ≥3:1 — verify glass cards
(translucent light surfaces over a dark globe) actually meet this, since
backdrop-blur can erode contrast over bright map regions. Full keyboard paths for
dropping, locking, searching, and warping; visible focus states over the canvas.

**Honor `prefers-reduced-motion`:** the camera fly/warp, pin pop, shake, and
fade-in all need reduced-motion alternatives (instant or simple crossfade) — the
warp is the highest-risk vestibular trigger and must degrade to a cut. Mood color
must never be the only signal (pair with shape/label/icon) for color-blind users.
