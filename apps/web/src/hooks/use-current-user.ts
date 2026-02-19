"use client";

import { isClientDemoMode } from "@/lib/env-client";
import { mockUsers } from "@/lib/mock-data";
import type { MockUser } from "@/lib/types";

interface UseCurrentUserResult {
  user: MockUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
}

function useCurrentUserDemo(): UseCurrentUserResult {
  return {
    user: mockUsers[0],
    isSignedIn: true,
    isLoading: false,
  };
}

function useCurrentUserReal(): UseCurrentUserResult {
  // Dynamic imports to avoid calling Clerk hooks in demo mode
  const { useUser } = require("@clerk/nextjs");
  const { trpc } = require("@/lib/trpc");
  const { transformUser } = require("@/lib/transforms");

  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const dbUserQuery = trpc.user.byClerkId.useQuery(
    { clerkId: clerkUser?.id ?? "" },
    { enabled: !!clerkUser?.id }
  );

  const user = dbUserQuery.data ? transformUser(dbUserQuery.data) : null;

  return {
    user,
    isSignedIn: isSignedIn ?? false,
    isLoading: !isLoaded || dbUserQuery.isLoading,
  };
}

export const useCurrentUser = isClientDemoMode
  ? useCurrentUserDemo
  : useCurrentUserReal;
