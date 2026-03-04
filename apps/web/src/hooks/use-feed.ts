"use client";

import { useState, useEffect } from "react";
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
  const [allPosts, setAllPosts] = useState<MockPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/post/feed?limit=30")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
        const posts = (data.posts ?? []).map(transformPost);
        console.log("[useFeed] Fetched", posts.length, "posts");
        setAllPosts(posts);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[useFeed] Error:", err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const filtered =
    !filter || filter === "all"
      ? allPosts
      : allPosts.filter((p) => p.type === filter);

  return {
    posts: filtered,
    isLoading,
    error,
    fetchNextPage: () => {},
    hasNextPage: false,
  };
}

export const useFeed = isClientDemoMode ? useFeedDemo : useFeedReal;
