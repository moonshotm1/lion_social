"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockUsers } from "@/lib/mock-data";
import { transformUser } from "@/lib/transforms";
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
  const { user: supabaseUser, isLoading: authLoading } = useAuth();

  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!supabaseUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    fetch("/api/user/me")
      .then(async (res) => {
        if (res.status === 404) {
          // Profile missing — try to create it then retry
          await fetch("/api/auth/ensure-profile", { method: "POST" }).catch(() => {});
          const retry = await fetch("/api/user/me");
          if (!retry.ok) throw new Error("Profile not found after creation");
          return retry.json();
        }
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setUser(transformUser(data));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useCurrentUser] Error:", err);
        setUser(null);
        setIsLoading(false);
      });
  }, [supabaseUser?.id, authLoading]);

  return {
    user,
    isSignedIn: !!supabaseUser,
    isLoading: authLoading || isLoading,
  };
}

export const useCurrentUser = isClientDemoMode
  ? useCurrentUserDemo
  : useCurrentUserReal;
