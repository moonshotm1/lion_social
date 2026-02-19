"use client";

import { isClientDemoMode } from "@/lib/env-client";

function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { ClerkProvider } = require("@clerk/nextjs");

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#D4A843",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export const AuthProvider = isClientDemoMode
  ? DemoAuthProvider
  : ClerkAuthProvider;
