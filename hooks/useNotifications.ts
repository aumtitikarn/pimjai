"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AppNotification {
  id: string;
  pinId: string;
  actorName: string | null;
  reaction: "pat" | "hug" | "agree" | "reply";
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unread: number;
}

const NOTIFICATIONS_KEY = ["notifications"] as const;

/**
 * Poll the signed-in member's reaction notifications. Disabled (and returns an
 * empty set) for anonymous visitors — only members receive pings.
 */
export function useNotifications(enabled: boolean) {
  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    enabled,
    // Poll gently — every 60s, only while the tab is visible (the default
    // refetchIntervalInBackground is false) — to keep server load low.
    refetchInterval: enabled ? 60_000 : false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return { notifications: [], unread: 0 };
      return (await res.json()) as NotificationsResponse;
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unread: query.data?.unread ?? 0,
  };
}

/** Mark every notification read (called when the member opens the bell). */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
