"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts, mockUsers } from "@/lib/mock-data";
import { transformPost } from "@/lib/transforms";
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
    fetch("/api/post/feed?limit=30")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
        const posts = (data.posts ?? []).map(transformPost);
        setTrendingPosts(posts);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useExplore] Error:", err);
        setIsLoading(false);
      });
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
