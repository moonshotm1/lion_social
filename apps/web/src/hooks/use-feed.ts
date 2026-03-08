"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { transformPost } from "@/lib/transforms";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { MockPost, PostType } from "@/lib/types";

interface UseFeedResult {
  posts: MockPost[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

function useFeedDemo(
  filter?: PostType | "all",
  _tab?: string
): UseFeedResult {
  const filtered =
    !filter || filter === "all"
      ? mockPosts
      : mockPosts.filter((p) => p.type === filter);

  return {
    posts: filtered,
    isLoading: false,
    error: null,
    fetchNextPage: () => {},
    hasNextPage: false,
  };
}

function useFeedReal(
  filter?: PostType | "all",
  tab?: string
): UseFeedResult {
  const [allPosts, setAllPosts] = useState<MockPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Get auth token for isLiked resolution and following-tab filtering
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const params = new URLSearchParams({ tab: tab ?? "explore" });
        if (filter && filter !== "all") params.set("type", filter);

        const res = await fetch(`/api/feed?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");

        const posts = (data.posts ?? []).map(transformPost);
        console.log("[useFeed] Fetched", posts.length, "posts (tab:", tab, ")");
        if (!cancelled) {
          setAllPosts(posts);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useFeed] Error:", err);
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tab, filter]);

  return {
    posts: allPosts,
    isLoading,
    error,
    fetchNextPage: () => {},
    hasNextPage: false,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
