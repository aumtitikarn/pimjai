"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Reply } from "@/schemas/replySchema";

const repliesKey = (pinId: string) => ["replies", pinId] as const;

/**
 * Public replies on one letter, oldest first. Fetched lazily (only when a popup is
 * open). Each reply carries `is_mine` so the viewer can delete their own.
 */
export function useReplies(pinId: string | null) {
  return useQuery({
    queryKey: repliesKey(pinId ?? ""),
    enabled: !!pinId,
    staleTime: 30_000,
    queryFn: async (): Promise<Reply[]> => {
      const res = await fetch(`/api/pins/${pinId}/replies`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load replies.");
      const { replies } = (await res.json()) as { replies: Reply[] };
      return replies;
    },
  });
}

export interface NewReplyPayload {
  text: string;
  /** Reveal the replier's LINE name + avatar. */
  reveal_identity: boolean;
}

export function useCreateReply(pinId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NewReplyPayload): Promise<Reply> => {
      const res = await fetch(`/api/pins/${pinId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? "Failed to post reply.");
      }
      const { reply } = (await res.json()) as { reply: Reply };
      return reply;
    },
    onSuccess: (reply) => {
      queryClient.setQueryData<Reply[]>(repliesKey(pinId), (old) => [...(old ?? []), reply]);
    },
  });
}

export function useDeleteReply(pinId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/replies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? "Failed to delete reply.");
      }
    },
    onMutate: async (id) => {
      const key = repliesKey(pinId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Reply[]>(key);
      queryClient.setQueryData<Reply[]>(key, (old) => (old ?? []).filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(repliesKey(pinId), context.previous);
      }
    },
  });
}
