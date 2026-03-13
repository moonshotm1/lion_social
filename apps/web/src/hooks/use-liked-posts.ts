"use client";

import { useState, useEffect } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { createSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Returns a Set of post IDs liked by the current authenticated user.
 * Fetched once on mount and refreshed on auth state change.
 * Pass likedIds.has(post.id) as the isLiked prop to PostCard.
 */
export function useLikedPosts(): Set<string> {
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => {
    if (isClientDemoMode) {
      return new Set(mockPosts.filter((p) => p.isLiked).map((p) => p.id));
    }
    return new Set();
  });

  useEffect(() => {
    if (isClientDemoMode) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function load(token: string | undefined) {
      if (!token) {
        if (!cancelled) setLikedPostIds(new Set());
        return;
      }
      try {
        const res = await fetch("/api/user/liked-post-ids", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setLikedPostIds(new Set(data.postIds ?? []));
      } catch {
        // non-fatal
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      load(session?.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        load(session?.access_token);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return likedPostIds;
}
