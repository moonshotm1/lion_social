"use client";

import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";
import { mockUsers, mockPosts } from "@/lib/mock-data";
import { transformUser, transformPost } from "@/lib/transforms";
import type { MockUser, MockPost } from "@/lib/types";

interface UseUserProfileResult {
  user: MockUser | null;
  posts: MockPost[];
  isLoading: boolean;
  error: unknown;
}

function useUserProfileDemo(username: string): UseUserProfileResult {
  const user =
    mockUsers.find((u) => u.username === username) ?? mockUsers[0];
  const posts = mockPosts.filter((p) => p.author.id === user.id);
  return { user, posts, isLoading: false, error: null };
}

function useUserProfileReal(username: string): UseUserProfileResult {
  const userQuery = trpc.user.byUsername.useQuery({ username });
  const user = userQuery.data ? transformUser(userQuery.data) : null;

  const postsQuery = trpc.post.byUser.useQuery(
    { userId: userQuery.data?.id ?? "" },
    { enabled: !!userQuery.data?.id }
  );
  const posts = postsQuery.data?.posts.map(transformPost) ?? [];

  return {
    user,
    posts,
    isLoading: userQuery.isLoading || postsQuery.isLoading,
    error: userQuery.error || postsQuery.error,
  };
}

export const useUserProfile = isClientDemoMode
  ? useUserProfileDemo
  : useUserProfileReal;
