"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { Pin, ReactionState, ReactionType } from "@/schemas/pinSchema";

const PINS_KEY = ["pins"] as const;
const MY_PINS_KEY = ["pins", "mine"] as const;
export const MY_LETTERS_KEY = ["pins", "mine", "full"] as const;
const reactionsKey = (pinId: string) => ["reactions", pinId] as const;

/**
 * The signed-in member's own letters with full content (incl. locked ciphertext),
 * newest first — for the "my letters" manager. Disabled for anonymous visitors.
 */
export function useMyLetters(enabled: boolean) {
  return useQuery({
    queryKey: MY_LETTERS_KEY,
    enabled,
    queryFn: async (): Promise<Pin[]> => {
      const res = await fetch("/api/me/letters", { cache: "no-store" });
      if (!res.ok) return [];
      const { letters } = (await res.json()) as { letters: Pin[] };
      return letters;
    },
  });
}

// owner_id (a LINE userId) is deliberately NOT selected: it must never reach the
// public client. Ownership is resolved separately via useMyPinIds(), which reads
// the signed-in session server-side.
const PUBLIC_PIN_COLUMNS =
  "id, text, lat, lng, mood, emoji, color, is_locked, hint, created_at, expires_at, author_name, author_bio, author_avatar, pat_count, hug_count, agree_count";

export function usePins() {
  return useQuery({
    queryKey: PINS_KEY,
    // Re-run periodically so expired anonymous letters drop off the map even
    // without a reload.
    refetchInterval: 5 * 60 * 1000,
    queryFn: async (): Promise<Pin[]> => {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      // Read the view, not the table, so author_name resolves to the author's
      // CURRENT profile name instead of the snapshot baked in at creation.
      const { data, error } = await supabase
        .from("public_pins")
        .select(PUBLIC_PIN_COLUMNS)
        // Permanent letters (expires_at null) OR not-yet-expired anonymous ones.
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Pin[];
    },
  });
}

/**
 * The set of pin ids owned by the signed-in user, resolved server-side from the
 * LINE session. Empty when anonymous. PinPopup uses this to decide whether to
 * show the delete control, without ever exposing owner_id to the public client.
 */
export function useMyPinIds() {
  const query = useQuery({
    queryKey: MY_PINS_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<Set<string>> => {
      const res = await fetch("/api/pins/mine", { cache: "no-store" });
      if (!res.ok) return new Set();
      const { ids } = (await res.json()) as { ids: string[] };
      return new Set(ids);
    },
  });
  return query.data ?? new Set<string>();
}

export interface NewPinPayload {
  text: string;
  lat: number;
  lng: number;
  mood: Pin["mood"];
  /** Custom emoji, or null to use the mood default. */
  emoji: string | null;
  /** Custom #rrggbb colour, or null to use the mood default. */
  color: string | null;
  is_locked: boolean;
  hint: string | null;
  /** Reveal the author's LINE name + avatar (signed-in only). */
  reveal_identity: boolean;
  /** Let the letter self-destruct after 24h. Always true for anonymous guests. */
  ephemeral: boolean;
}

export function useCreatePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NewPinPayload): Promise<Pin> => {
      // Creation is server-side: the route reads the LINE session and sets
      // owner_id / expires_at (24h for anonymous). Direct anon inserts are
      // disabled at the RLS level, so this is the only write path.
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create pin.");
      const { pin } = (await res.json()) as { pin: Pin };
      return pin;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: PINS_KEY });
      const previous = queryClient.getQueryData<Pin[]>(PINS_KEY);

      const optimisticPin: Pin = {
        id: `optimistic-${Date.now()}`,
        text: payload.text,
        lat: payload.lat,
        lng: payload.lng,
        mood: payload.mood,
        emoji: payload.emoji,
        color: payload.color,
        is_locked: payload.is_locked,
        hint: payload.hint,
        created_at: new Date().toISOString(),
        pat_count: 0,
        hug_count: 0,
        agree_count: 0,
      };

      queryClient.setQueryData<Pin[]>(PINS_KEY, (old) => [optimisticPin, ...(old ?? [])]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PINS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PINS_KEY });
    },
  });
}

/**
 * Reaction tallies for one letter plus the viewer's own votes. Fetched lazily
 * (only when a popup is open) and kept authoritative for the numbers shown in the
 * popup; the map reads counts from the pins list instead.
 */
export function usePinReactions(pinId: string | null) {
  return useQuery({
    queryKey: reactionsKey(pinId ?? ""),
    enabled: !!pinId,
    staleTime: 30_000,
    queryFn: async (): Promise<ReactionState> => {
      const res = await fetch(`/api/pins/${pinId}/react`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load reactions.");
      return (await res.json()) as ReactionState;
    },
  });
}

export function useToggleReaction(pinId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: ReactionType): Promise<ReactionState> => {
      const res = await fetch(`/api/pins/${pinId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to react.");
      return (await res.json()) as ReactionState;
    },
    onMutate: async (type) => {
      const key = reactionsKey(pinId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReactionState>(key);

      // Optimistically apply single-select: clear any prior feeling, then add the
      // tapped one — unless it was already active, which toggles it off.
      if (previous) {
        const tappedSame = previous.mine.includes(type);
        const counts = { ...previous.counts };
        for (const t of previous.mine) counts[t] = Math.max(0, counts[t] - 1);
        if (!tappedSame) counts[type] = (counts[type] ?? 0) + 1;
        queryClient.setQueryData<ReactionState>(key, {
          counts,
          mine: tappedSame ? [] : [type],
        });
      }
      return { previous };
    },
    onError: (_err, _type, context) => {
      if (context?.previous) {
        queryClient.setQueryData(reactionsKey(pinId), context.previous);
      }
    },
    onSuccess: (state) => {
      queryClient.setQueryData(reactionsKey(pinId), state);
      // Reflect the new tally on the cached pin so the map glow updates without a
      // full refetch round-trip.
      queryClient.setQueryData<Pin[]>(PINS_KEY, (old) =>
        (old ?? []).map((p) =>
          p.id === pinId
            ? {
                ...p,
                pat_count: state.counts.pat,
                hug_count: state.counts.hug,
                agree_count: state.counts.agree,
              }
            : p,
        ),
      );
    },
  });
}

export function useDeletePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/pins/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? "Failed to delete letter.");
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PINS_KEY });
      const previous = queryClient.getQueryData<Pin[]>(PINS_KEY);
      queryClient.setQueryData<Pin[]>(PINS_KEY, (old) =>
        (old ?? []).filter((pin) => pin.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PINS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PINS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_LETTERS_KEY });
    },
  });
}
