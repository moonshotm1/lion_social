"use client";

import { trpc } from "@/lib/trpc";
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
  const trendingQuery = trpc.post.trending.useQuery({ limit: 20 });
  const trendingPosts = (Array.isArray(trendingQuery.data) ? trendingQuery.data : []).map(transformPost);

  // Extract unique authors from trending posts as featured users
  const featuredUsers = Array.from(
    new Map(trendingPosts.map((p) => [p.author.id, p.author])).values()
  );

  return {
    trendingPosts,
    featuredUsers,
    isLoading: trendingQuery.isLoading,
    filterByCategory: (cat) =>
      cat === "all"
        ? trendingPosts
        : trendingPosts.filter((p) => p.type === cat),
  };
}

export const useExplore = isClientDemoMode ? useExploreDemo : useExploreReal;
