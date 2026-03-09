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

function useUserProfileDemo(username: string): UseUserProfileResult {
  const user =
    mockUsers.find((u) => u.username === username) ?? mockUsers[0];
  const posts = mockPosts.filter((p) => p.author.id === user.id);
  return { user, posts, isFollowing: false, isLoading: false, error: null };
}

function useUserProfileReal(username: string): UseUserProfileResult {
  const [user, setUser] = useState<MockUser | null>(null);
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!username) return;

    setIsLoading(true);
    setUser(null);
    setPosts([]);
    setIsFollowing(false);
    setError(null);

    // Send auth token so by-username can return isFollowing for the viewer
    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        return fetch(
          `/api/user/by-username?username=${encodeURIComponent(username)}`,
          { headers }
        );
      })
      .then(async (res) => {
        const userData = await res.json();
        if (!res.ok) throw new Error(userData.error ?? "User not found");

        setUser(transformUser(userData));
        setIsFollowing(!!userData.isFollowing);

        // Fetch user's posts
        return fetch(`/api/post/by-user?userId=${encodeURIComponent(userData.id)}`);
      })
      .then(async (res) => {
        if (!res) return;
        const postsData = await res.json();
        if (!res.ok) throw new Error(postsData.error ?? "Failed to fetch posts");
        setPosts((postsData.posts ?? []).map(transformPost));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useUserProfile] Error:", err);
        setError(err);
        setIsLoading(false);
      });
  }, [username]);

  return { user, posts, isFollowing, isLoading, error };
}

export const useUserProfile = isClientDemoMode
  ? useUserProfileDemo
  : useUserProfileReal;
