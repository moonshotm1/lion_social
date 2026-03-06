"use client";

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
  return {
    toggleSave: (postId: string) => {
      fetch(`/api/post/${postId}/save`, { method: "POST" }).catch(() => {});
    },
    isLoading: false,
  };
}

export const useSave = isClientDemoMode ? useSaveDemo : useSaveReal;
