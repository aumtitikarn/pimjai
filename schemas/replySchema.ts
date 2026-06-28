import { z } from "zod";

/** Max characters in a single reply (mirrors the DB CHECK). */
export const REPLY_MAX_LEN = 2000;

/** Validates the body posted to POST /api/pins/[id]/replies. */
export const createReplySchema = z.object({
  text: z.string().trim().min(1).max(REPLY_MAX_LEN),
  /** Reveal the replier's LINE name + avatar. Only honored when signed in. */
  reveal_identity: z.boolean().optional(),
});

/** A public reply on a letter, as returned to the client (no owner_id). */
export interface Reply {
  id: string;
  pin_id: string;
  text: string;
  /** Replier's display name when they revealed identity; null = anonymous. */
  author_name: string | null;
  /** Replier's LINE avatar URL when revealed; null = anonymous. */
  author_avatar: string | null;
  created_at: string;
  /** True when this reply belongs to the current viewer (drives the delete control). */
  is_mine?: boolean;
}
