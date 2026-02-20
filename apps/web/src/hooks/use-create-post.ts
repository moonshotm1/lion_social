"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
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
  error: unknown;
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
  const utils = trpc.useUtils();

  const mutation = trpc.post.create.useMutation({
    onSuccess: () => {
      utils.post.feed.invalidate();
      router.push("/");
    },
  });

  return {
    createPost: (input: CreatePostInput) => mutation.mutate(input),
    isLoading: mutation.isLoading,
    error: mutation.error,
  };
}

export const useCreatePost = isClientDemoMode
  ? useCreatePostDemo
  : useCreatePostReal;
