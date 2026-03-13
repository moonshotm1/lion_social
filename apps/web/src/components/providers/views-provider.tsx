"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface ViewsContextValue {
  /** Record a view for a post. Deduplicates per session and queues until auth token is ready. */
  trackView: (postId: string) => void;
}

const ViewsContext = createContext<ViewsContextValue>({ trackView: () => {} });

export function useViews() {
  return useContext(ViewsContext);
}

export function ViewsProvider({ children }: { children: React.ReactNode }) {
  // Client-side dedup: post IDs already viewed this session
  const viewedIdsRef = useRef<Set<string>>(new Set());
  // Auth token — set once Supabase session resolves
  const tokenRef = useRef<string | undefined>(undefined);
  // Posts viewed before token was available — flushed once token loads
  const pendingRef = useRef<Set<string>>(new Set());

  function sendView(postId: string, token: string) {
    fetch(`/api/post/${postId}/view`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  function flushPending(token: string) {
    pendingRef.current.forEach((postId) => sendView(postId, token));
    pendingRef.current.clear();
  }

  useEffect(() => {
    if (isClientDemoMode) return;

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token;
      if (session?.access_token) flushPending(session.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        tokenRef.current = session?.access_token;
        if (session?.access_token) {
          flushPending(session.access_token);
        } else {
          // Signed out — reset so new user gets fresh view session
          viewedIdsRef.current = new Set();
          pendingRef.current.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trackView = useCallback((postId: string) => {
    if (isClientDemoMode || viewedIdsRef.current.has(postId)) return;
    viewedIdsRef.current.add(postId);

    if (tokenRef.current) {
      sendView(postId, tokenRef.current);
    } else {
      // Token not ready yet — queue; will be sent when session resolves
      pendingRef.current.add(postId);
    }
  }, []);

  return (
    <ViewsContext.Provider value={{ trackView }}>
      {children}
    </ViewsContext.Provider>
  );
}
