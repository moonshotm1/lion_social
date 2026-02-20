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
  const { useAuth } = require("@/components/providers/auth-provider");
  const { trpc } = require("@/lib/trpc");
  const { transformUser } = require("@/lib/transforms");

  const { user: supabaseUser, isLoading: authLoading } = useAuth();
  const dbUserQuery = trpc.user.bySupabaseId.useQuery(
    { supabaseId: supabaseUser?.id ?? "" },
    { enabled: !!supabaseUser?.id }
  );

  const user = dbUserQuery.data ? transformUser(dbUserQuery.data) : null;

  return {
    user,
    isSignedIn: !!supabaseUser,
    isLoading: authLoading || dbUserQuery.isLoading,
  };
}

export const useCurrentUser = isClientDemoMode
  ? useCurrentUserDemo
  : useCurrentUserReal;
