"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { createSupabaseBrowserClient } from "@/lib/supabase"; // used only in bootstrap

interface LikesContextValue {
  likedIds: Set<string>;
  /** Updates the local likedIds Set only — no API call. PostCard owns all writes. */
  setLikedId: (postId: string, liked: boolean) => void;
}

const LikesContext = createContext<LikesContextValue>({
  likedIds: new Set(),
  setLikedId: () => {},
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

  const setLikedId = useCallback((postId: string, liked: boolean) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  return (
    <LikesContext.Provider value={{ likedIds, setLikedId }}>
      {children}
    </LikesContext.Provider>
  );
}
