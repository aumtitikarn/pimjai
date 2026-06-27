"use client";

import { useQuery } from "@tanstack/react-query";
import type { LineUser } from "@/utils/auth/session";

/** The session user plus the editable profile bio (merged in /api/auth/me). */
export type AuthUser = LineUser & { bio?: string | null };

const AUTH_KEY = ["auth", "me"] as const;

/**
 * Reads the current LINE session from `/api/auth/me`. Returns the user (or null)
 * plus the loading flag. Login/logout are full-page navigations to the OAuth
 * routes, so there's no mutation to manage here.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: AUTH_KEY,
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as { user: AuthUser | null };
      return data.user;
    },
    staleTime: 60_000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
  };
}

export function startLineLogin() {
  window.location.href = "/api/auth/line/login";
}

export function startLineLogout() {
  window.location.href = "/api/auth/line/logout";
}
