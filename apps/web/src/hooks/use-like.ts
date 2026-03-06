"use client";

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
  return {
    toggleLike: (postId: string) => {
      fetch(`/api/post/${postId}/like`, { method: "POST" }).catch(() => {});
    },
    isLoading: false,
  };
}

export const useLike = isClientDemoMode ? useLikeDemo : useLikeReal;
