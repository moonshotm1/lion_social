"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, getTrpcClient } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: isClientDemoMode ? false : 3,
            staleTime: isClientDemoMode ? Infinity : 1000 * 60,
          },
        },
      })
  );
  const [trpcClient] = useState(() => getTrpcClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
