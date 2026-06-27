"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Live count of everyone currently on the site, via a Supabase Realtime presence
 * channel. Each tab tracks itself; the count is the number of tracked presences.
 * Ephemeral — no database table involved.
 */
export function useOnlineCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    // A per-tab key so two tabs from one person count as two presences, matching
    // "how many people/tabs are looking right now".
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const channel = supabase.channel("pimjai-online", {
      config: { presence: { key } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ at: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
