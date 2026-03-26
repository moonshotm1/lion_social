"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface LikesContextValue {
  likedIds: Set<string>;
  savedIds: Set<string>;
  /** True once the liked/saved post ID fetches have completed (success or failure). */
  bootstrapped: boolean;
  setLikedId: (postId: string, liked: boolean) => void;
  setSavedId: (postId: string, saved: boolean) => void;
}

const LikesContext = createContext<LikesContextValue>({
  likedIds: new Set(),
  savedIds: new Set(),
  bootstrapped: false,
  setLikedId: () => {},
  setSavedId: () => {},
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
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (isClientDemoMode) {
      return new Set(mockPosts.filter((p) => p.isBookmarked).map((p) => p.id));
    }
    return new Set();
  });
  const [bootstrapped, setBootstrapped] = useState(isClientDemoMode);

  useEffect(() => {
    if (isClientDemoMode) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function bootstrap(token: string | undefined) {
      if (!token) {
        if (!cancelled) {
          setLikedIds(new Set());
          setSavedIds(new Set());
          setBootstrapped(true);
        }
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [likedRes, savedRes] = await Promise.all([
          fetch("/api/user/liked-post-ids", { headers }),
          fetch("/api/user/saved-post-ids", { headers }),
        ]);
        if (cancelled) return;
        if (likedRes.ok) {
          const data = await likedRes.json();
          if (!cancelled) setLikedIds(new Set(data.postIds ?? []));
        }
        if (savedRes.ok) {
          const data = await savedRes.json();
          if (!cancelled) setSavedIds(new Set(data.postIds ?? []));
        }
        if (!cancelled) setBootstrapped(true);
      } catch {
        if (!cancelled) setBootstrapped(true);
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

  const setSavedId = useCallback((postId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  return (
    <LikesContext.Provider value={{ likedIds, savedIds, bootstrapped, setLikedId, setSavedId }}>
      {children}
    </LikesContext.Provider>
  );
}
