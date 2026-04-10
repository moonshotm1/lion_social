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
  refresh: () => void;
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
    refresh: () => {},
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
  const [refreshKey, setRefreshKey] = useState(0);
  // undefined = not yet resolved, null = unauthenticated, string = supabase user id
  const [authUserId, setAuthUserId] = useState<string | null | undefined>(undefined);
  // DB-level user id (not supabase auth id) — used to exclude own likes from realtime
  const [myDbId, setMyDbId] = useState<string | null>(null);
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
      // Fetch DB user id for realtime like dedup
      if (session?.access_token) {
        fetch("/api/user/me", { headers: { Authorization: `Bearer ${session.access_token}` } })
          .then(r => r.json())
          .then(d => { if (d?.id) setMyDbId(d.id); })
          .catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUserId(session?.user?.id ?? null);
        if (session?.access_token) {
          fetch("/api/user/me", { headers: { Authorization: `Bearer ${session.access_token}` } })
            .then(r => r.json())
            .then(d => { if (d?.id) setMyDbId(d.id); })
            .catch(() => {});
        } else {
          setMyDbId(null);
        }
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

  // Real-time like count updates from other users
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const myDbIdSnapshot = myDbId;
    const channel = supabase
      .channel("feed-likes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Like" }, (payload) => {
        const row = payload.new as { postId: string; userId: string };
        if (row.userId === myDbIdSnapshot) return; // own like — optimistic already handled it
        setAllPosts((prev) =>
          prev.map((p) => p.id === row.postId ? { ...p, likes: (p.likes ?? 0) + 1 } : p)
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Like" }, (payload) => {
        const row = payload.old as { postId: string; userId: string };
        if (row.userId === myDbIdSnapshot) return; // own unlike — optimistic already handled it
        setAllPosts((prev) =>
          prev.map((p) => p.id === row.postId ? { ...p, likes: Math.max(0, (p.likes ?? 0) - 1) } : p)
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myDbId]);

  useEffect(() => {
    // Wait until auth state is resolved before fetching
    if (authUserId === undefined) return;
    void refreshKey; // consumed so effect reruns on manual refresh

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
  }, [tab, filter, authUserId, page, refreshKey]);

  const fetchNextPage = useCallback(() => {
    if (!isLoadingMore && hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [isLoadingMore, hasNextPage]);

  const refresh = useCallback(() => {
    setPage(0);
    setAllPosts([]);
    setHasNextPage(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    posts: allPosts,
    isLoading,
    isLoadingMore,
    error,
    fetchNextPage,
    hasNextPage,
    refresh,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
