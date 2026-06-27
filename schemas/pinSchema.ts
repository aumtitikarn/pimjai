import { z } from "zod";

export const MOODS = ["pink", "black", "yellow"] as const;
export type Mood = (typeof MOODS)[number];

/**
 * Default emoji + colour for each mood category, used whenever a letter has no
 * custom emoji/color of its own. Single source of truth for the form presets,
 * the map pin, the popup and the share card.
 */
export const MOOD_DEFAULTS: Record<Mood, { emoji: string; color: string; label: string }> = {
  pink: { emoji: "💗", color: "#ff2d9d", label: "Romance" },
  black: { emoji: "🖤", color: "#1b1b24", label: "Venting" },
  yellow: { emoji: "💛", color: "#ffe14d", label: "Memes" },
};

/** Resolve the emoji to show for a letter (custom wins, else the mood default). */
export function pinEmoji(mood: Mood, emoji?: string | null): string {
  return emoji?.trim() ? emoji : MOOD_DEFAULTS[mood].emoji;
}

/** Resolve the background colour for a letter (custom wins, else mood default). */
export function pinColor(mood: Mood, color?: string | null): string {
  return color?.trim() ? color : MOOD_DEFAULTS[mood].color;
}

export const REACTION_TYPES = ["pat", "hug", "agree"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

/** Reaction counts for one letter, plus which types the current viewer has cast. */
export interface ReactionState {
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
}

export const pinFormSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "พิมพ์อะไรสักอย่างก่อนนะ")
      .max(150, "ไม่เกิน 150 ตัวอักษร"),
    mood: z.enum(MOODS),
    /** Free emoji chosen by the author (1–8 chars to allow multi-codepoint). */
    emoji: z.string().min(1).max(8).optional(),
    /** Free background colour as a #rrggbb hex. */
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "เลือกสีก่อนนะ")
      .optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    isLocked: z.boolean(),
    password: z.string().optional(),
    hint: z.string().max(80, "คำใบ้สั้นๆ พอนะ").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isLocked) return;

    if (!data.password || data.password.length !== 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "รหัสผ่านต้องมี 6 ตัวอักษรพอดี",
      });
    }

    if (!data.hint || data.hint.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["hint"],
        message: "ข้อความที่ล็อกต้องมีคำใบ้",
      });
    }
  });

export type PinFormValues = z.infer<typeof pinFormSchema>;

export const unlockSchema = z.object({
  password: z.string().length(6, "6 characters please."),
});

export interface Pin {
  id: string;
  text: string;
  lat: number;
  lng: number;
  mood: Mood;
  /** Author's custom emoji; null = use the mood's default. */
  emoji?: string | null;
  /** Author's custom #rrggbb background colour; null = use the mood's default. */
  color?: string | null;
  is_locked: boolean;
  hint: string | null;
  created_at: string;
  /** LINE userId of the author when signed in; null for anonymous letters. */
  owner_id?: string | null;
  /** When the letter disappears (now + 24h) if the author chose so; null = permanent. */
  expires_at?: string | null;
  /** Author's LINE display name, only when they opted to reveal identity; null = anonymous. */
  author_name?: string | null;
  /** Author's LINE avatar URL, only when they opted to reveal identity; null = anonymous. */
  author_avatar?: string | null;
  /** Author's current profile bio, resolved live; only on identity-revealed letters. */
  author_bio?: string | null;
  /** "ตบบ่า" tally. */
  pat_count?: number;
  /** "กอดปลอบ" tally. */
  hug_count?: number;
  /** "เห็นด้วย" tally — drives the map glow tier. */
  agree_count?: number;
}
