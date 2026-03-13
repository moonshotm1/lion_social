"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface LikesContextValue {
  likedIds: Set<string>;
  /** Optimistically toggles like state, calls the API, and reconciles. Returns server-confirmed liked state. */
  toggleLike: (postId: string) => Promise<boolean>;
}

const LikesContext = createContext<LikesContextValue>({
  likedIds: new Set(),
  toggleLike: async () => false,
});

export function useLikes() {
  return useContext(LikesContext);
}

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    if (isClientDemoMode) {
      return new Set(mockPosts.filter((p) => p.isLiked).map((p) => p.id));
    }
    return new Set();
  });

  // Bootstrap: fetch all liked post IDs once auth resolves
  useEffect(() => {
    if (isClientDemoMode) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function bootstrap(token: string | undefined) {
      if (!token) {
        if (!cancelled) setLikedIds(new Set());
        return;
      }
      try {
        const res = await fetch("/api/user/liked-post-ids", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setLikedIds(new Set(data.postIds ?? []));
      } catch {
        // non-fatal — start with empty set
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      bootstrap(session?.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        bootstrap(session?.access_token);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const toggleLike = useCallback(async (postId: string): Promise<boolean> => {
    if (isClientDemoMode) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
      return !likedIds.has(postId);
    }

    const wasLiked = likedIds.has(postId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/post/${postId}/like`, {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (!res.ok) throw new Error("Like request failed");
      const data = await res.json();
      const serverLiked = !!data.liked;
      // Reconcile context with server truth
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (serverLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      return serverLiked;
    } catch {
      // Revert optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      throw new Error("Like failed");
    }
  }, [likedIds]);

  return (
    <LikesContext.Provider value={{ likedIds, toggleLike }}>
      {children}
    </LikesContext.Provider>
  );
}
