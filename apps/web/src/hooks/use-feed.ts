"use client";

import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { transformPost } from "@/lib/transforms";
import type { MockPost, PostType } from "@/lib/types";

interface UseFeedResult {
  posts: MockPost[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

function useFeedDemo(filter?: PostType | "all"): UseFeedResult {
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

function useFeedReal(filter?: PostType | "all"): UseFeedResult {
  const query = trpc.post.feed.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const pages: any[] = query.data?.pages ?? [];
  const allPosts: MockPost[] = pages.flatMap((p: any) =>
    Array.isArray(p.posts) ? (p.posts as any[]).map(transformPost) : []
  );
  const filtered =
    !filter || filter === "all"
      ? allPosts
      : allPosts.filter((p) => p.type === filter);

  return {
    posts: filtered,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
