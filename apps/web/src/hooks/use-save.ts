"use client";

import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";

interface UseSaveResult {
  toggleSave: (postId: string) => void;
  isLoading: boolean;
}

function useSaveDemo(): UseSaveResult {
  return {
    toggleSave: (postId: string) => {
      console.log("[Demo Mode] Toggle save:", postId);
    },
    isLoading: false,
  };
}

function useSaveReal(): UseSaveResult {
  const utils = trpc.useUtils();
  const mutation = trpc.save.toggle.useMutation({
    onSuccess: () => {
      utils.post.feed.invalidate();
      utils.post.byUser.invalidate();
      utils.save.byUser.invalidate();
    },
  });

  return {
    toggleSave: (postId: string) => mutation.mutate({ postId }),
    isLoading: mutation.isPending,
  };
}

export const useSave = isClientDemoMode ? useSaveDemo : useSaveReal;
