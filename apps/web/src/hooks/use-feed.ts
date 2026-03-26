"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { transformPost } from "@/lib/transforms";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { MockPost, PostType } from "@/lib/types";

const PAGE_SIZE = 20;

interface UseFeedResult {
  posts: MockPost[];
  isLoading: boolean;
  isLoadingMore: boolean;
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
    isLoadingMore: false,
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  // undefined = not yet resolved, null = unauthenticated, string = supabase user id
  const [authUserId, setAuthUserId] = useState<string | null | undefined>(undefined);
  // Track the current filter/tab so fetchNextPage can reference stable values
  const filterRef = useRef(filter);
  const tabRef = useRef(tab);
  filterRef.current = filter;
  tabRef.current = tab;

  // Resolve auth state once and listen for changes.
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

  // Reset to page 0 when tab/filter changes
  useEffect(() => {
    setPage(0);
    setAllPosts([]);
    setHasNextPage(false);
  }, [tab, filter]);

  useEffect(() => {
    // Wait until auth state is resolved before fetching
    if (authUserId === undefined) return;

    let cancelled = false;
    const currentPage = page;

    async function load(background = false) {
      if (currentPage === 0) {
        if (!background) setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const params = new URLSearchParams({ tab: tabRef.current ?? "explore", page: String(currentPage) });
        if (filterRef.current && filterRef.current !== "all") params.set("type", filterRef.current);

        const res = await fetch(`/api/feed?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");

        const newPosts = (data.posts ?? []).map(transformPost);
        if (!cancelled) {
          if (currentPage === 0) {
            setAllPosts(newPosts);
          } else {
            setAllPosts((prev) => [...prev, ...newPosts]);
          }
          setHasNextPage(newPosts.length === PAGE_SIZE);
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      } catch (err) {
        console.error("[useFeed] Error:", err);
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    load(false);

    // Only add background polling/visibility for page 0
    if (currentPage > 0) {
      return () => { cancelled = true; };
    }

    // Refresh page 0 when tab regains focus
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
  }, [tab, filter, authUserId, page]);

  const fetchNextPage = useCallback(() => {
    if (!isLoadingMore && hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [isLoadingMore, hasNextPage]);

  return {
    posts: allPosts,
    isLoading,
    isLoadingMore,
    error,
    fetchNextPage,
    hasNextPage,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
