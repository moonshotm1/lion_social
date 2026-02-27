"use client";

import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";

interface UseLikeResult {
  toggleLike: (postId: string) => void;
  isLoading: boolean;
}

function useLikeDemo(): UseLikeResult {
  return {
    toggleLike: (postId: string) => {
      console.log("[Demo Mode] Toggle like:", postId);
    },
    isLoading: false,
  };
}

function useLikeReal(): UseLikeResult {
  const utils = trpc.useUtils();
  const mutation = trpc.like.toggle.useMutation({
    onSuccess: () => {
      utils.post.feed.invalidate();
      utils.post.byUser.invalidate();
      utils.post.byId.invalidate();
      utils.like.byUser.invalidate();
    },
  });

  return {
    toggleLike: (postId: string) => mutation.mutate({ postId }),
    isLoading: mutation.isPending,
  };
}

export const useLike = isClientDemoMode ? useLikeDemo : useLikeReal;
