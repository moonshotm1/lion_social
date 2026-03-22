"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockUsers, mockPosts } from "@/lib/mock-data";
import { transformUser, transformPost } from "@/lib/transforms";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { MockUser, MockPost } from "@/lib/types";

interface UseUserProfileResult {
  user: MockUser | null;
  posts: MockPost[];
  isFollowing: boolean;
  isLoading: boolean;
  error: unknown;
}

function useUserProfileDemo(username: string, _refreshKey?: number): UseUserProfileResult {
  const user =
    mockUsers.find((u) => u.username === username) ?? mockUsers[0];
  const posts = mockPosts.filter((p) => p.author.id === user.id);
  return { user, posts, isFollowing: false, isLoading: false, error: null };
}

function useUserProfileReal(username: string, refreshKey?: number): UseUserProfileResult {
  const [user, setUser] = useState<MockUser | null>(null);
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function load(background = false) {
      if (!background) {
        setIsLoading(true);
        setUser(null);
        setPosts([]);
        setIsFollowing(false);
        setError(null);
      }

      try {
        const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

        // 1. Fetch user profile
        const userRes = await fetch(
          `/api/user/by-username?username=${encodeURIComponent(username)}`,
          { headers }
        );
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error ?? "User not found");
        if (cancelled) return;

        setUser(transformUser(userData));
        setIsFollowing(!!userData.isFollowing);

        // 2. Fetch user's posts (skip on background refresh — counts update, posts rarely change)
        if (!background) {
          const postsRes = await fetch(
            `/api/post/by-user?userId=${encodeURIComponent(userData.id)}`,
            { headers }
          );
          const postsData = await postsRes.json();
          if (!postsRes.ok) throw new Error(postsData.error ?? "Failed to fetch posts");
          if (cancelled) return;

          const transformed: MockPost[] = [];
          for (const p of postsData.posts ?? []) {
            try {
              transformed.push(transformPost(p));
            } catch (e) {
              console.warn("[useUserProfile] skipping malformed post:", p?.id, e);
            }
          }
          setPosts(transformed);
        }

        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[useUserProfile] Error:", err);
        setError(err);
        setIsLoading(false);
      }
    }

    load(false);

    // Poll follower/following counts every 30s silently
    const interval = setInterval(() => { if (!cancelled) load(true); }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [username, refreshKey]); // refreshKey triggers a full re-fetch

  return { user, posts, isFollowing, isLoading, error };
}

export const useUserProfile = isClientDemoMode
  ? useUserProfileDemo
  : useUserProfileReal;
