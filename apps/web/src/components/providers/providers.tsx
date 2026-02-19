"use client";

import { AuthProvider } from "./auth-provider";
import { TRPCProvider } from "./trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </AuthProvider>
  );
}
