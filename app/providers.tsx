"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // Keep request volume low: the default of 3 retries turns one failing
            // endpoint into a request storm (and on shared hosting that maxes out
            // the entry-process limit → 503). One retry is plenty.
            retry: 1,
            retryDelay: 2_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
