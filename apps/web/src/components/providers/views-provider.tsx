"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface ViewsContextValue {
  /** Track a view for a post. Deduplicates client-side so each post is only sent once per session. */
  trackView: (postId: string) => void;
}

const ViewsContext = createContext<ViewsContextValue>({
  trackView: () => {},
});

export function useViews() {
  return useContext(ViewsContext);
}

export function ViewsProvider({ children }: { children: React.ReactNode }) {
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const tokenRef = useRef<string | undefined>(undefined);

  // Get and cache the auth token, refresh on auth state change
  useEffect(() => {
    if (isClientDemoMode) return;

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        tokenRef.current = session?.access_token;
        // Clear viewed set on sign-out so new user gets fresh views
        if (!session) viewedIdsRef.current = new Set();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const trackView = useCallback((postId: string) => {
    if (isClientDemoMode || viewedIdsRef.current.has(postId)) return;
    viewedIdsRef.current.add(postId);

    // Fire-and-forget — non-fatal
    fetch(`/api/post/${postId}/view`, {
      method: "POST",
      headers: tokenRef.current
        ? { Authorization: `Bearer ${tokenRef.current}` }
        : {},
    }).catch(() => {});
  }, []);

  return (
    <ViewsContext.Provider value={{ trackView }}>
      {children}
    </ViewsContext.Provider>
  );
}
