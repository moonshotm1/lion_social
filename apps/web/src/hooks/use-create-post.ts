"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isClientDemoMode } from "@/lib/env-client";

interface CreatePostInput {
  type: "workout" | "meal" | "quote" | "story";
  caption: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

interface UseCreatePostResult {
  createPost: (input: CreatePostInput) => void;
  isLoading: boolean;
  error: string | null;
}

function useCreatePostDemo(): UseCreatePostResult {
  const router = useRouter();

  return {
    createPost: (input: CreatePostInput) => {
      console.log("[Demo Mode] Post created:", input);
      alert(
        "Demo mode: Post would be created! Add Supabase keys to enable real posting."
      );
      router.push("/");
    },
    isLoading: false,
    error: null,
  };
}

function useCreatePostReal(): UseCreatePostResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (input: CreatePostInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.error ?? `Server error ${res.status}`;
        console.error("[use-create-post] Error:", msg, "full body:", body);
        setError(msg);
        return;
      }
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create post";
      console.error("[use-create-post] Unexpected error:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { createPost, isLoading, error };
}

export const useCreatePost = isClientDemoMode
  ? useCreatePostDemo
  : useCreatePostReal;
