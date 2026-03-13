"use client";

import { AuthProvider } from "./auth-provider";
import { LikesProvider } from "./likes-provider";
import { ViewsProvider } from "./views-provider";
import { TRPCProvider } from "./trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LikesProvider>
        <ViewsProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ViewsProvider>
      </LikesProvider>
    </AuthProvider>
  );
}
