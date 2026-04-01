"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts, mockUsers } from "@/lib/mock-data";
import { transformPost } from "@/lib/transforms";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { MockPost, MockUser, PostType } from "@/lib/types";

interface UseExploreResult {
  trendingPosts: MockPost[];
  featuredUsers: MockUser[];
  isLoading: boolean;
  filterByCategory: (category: PostType | "all") => MockPost[];
}

function useExploreDemo(): UseExploreResult {
  return {
    trendingPosts: mockPosts,
    featuredUsers: mockUsers,
    isLoading: false,
    filterByCategory: (cat) =>
      cat === "all" ? mockPosts : mockPosts.filter((p) => p.type === cat),
  };
}

function useExploreReal(): UseExploreResult {
  const [trendingPosts, setTrendingPosts] = useState<MockPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/post/feed?limit=30", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
        if (!cancelled) {
          const posts = (data.posts ?? []).map(transformPost);
          setTrendingPosts(posts);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useExplore] Error:", err);
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Extract unique authors as featured users
  const featuredUsers = Array.from(
    new Map(trendingPosts.map((p) => [p.author.id, p.author])).values()
  );

  return {
    trendingPosts,
    featuredUsers,
    isLoading,
    filterByCategory: (cat) =>
      cat === "all"
        ? trendingPosts
        : trendingPosts.filter((p) => p.type === cat),
  };
}

export const useExplore = isClientDemoMode ? useExploreDemo : useExploreReal;
