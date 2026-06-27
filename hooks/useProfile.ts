"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProfileValues {
  displayName: string;
  bio: string;
}

/** Save the member's custom display name + bio, then refresh the session user. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProfileValues): Promise<ProfileValues> => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update profile.");
      const { profile } = (await res.json()) as { profile: ProfileValues };
      return profile;
    },
    onSuccess: () => {
      // The merged name + bio live on /api/auth/me, so refresh that.
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // Letters now resolve the new name live via the public_pins view, so
      // refetch the map to show it on existing revealed letters right away.
      queryClient.invalidateQueries({ queryKey: ["pins"] });
    },
  });
}
