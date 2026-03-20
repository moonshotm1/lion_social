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
  // undefined = not yet resolved, null = unauthenticated, string = supabase user id
  const [authUserId, setAuthUserId] = useState<string | null | undefined>(undefined);

  // Resolve auth state once and listen for changes.
  // Including authUserId in the load effect ensures the feed re-fetches
  // with the correct Bearer token once the session is available —
  // this fixes both the isLiked inconsistency and the empty following tab.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUserId(session?.user?.id ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until auth state is resolved before fetching
    if (authUserId === undefined) return;

    let cancelled = false;

    async function load(background = false) {
      if (!background) setIsLoading(true);
      try {
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

    load(false);

    // Refresh when tab regains focus
    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) load(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    // Poll every 30s to keep counts fresh
    const interval = setInterval(() => { if (!cancelled) load(true); }, 30000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [tab, filter, authUserId]);

  return {
    posts: allPosts,
    isLoading,
    error,
    fetchNextPage: () => {},
    hasNextPage: false,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
