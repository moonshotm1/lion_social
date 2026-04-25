"use client";

import { useState, useEffect, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function useUnreadMessagesReal() {
  const { user, isSignedIn } = useCurrentUser();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/messages/unread-count", { headers });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // silently fail
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Reset count when user opens the messages page
  useEffect(() => {
    const handler = () => setCount(0);
    window.addEventListener("lion:messages-opened", handler);
    return () => window.removeEventListener("lion:messages-opened", handler);
  }, []);

  // Real-time: bump count when a new message arrives
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `recipientId=eq.${user.id}`,
        },
        () => { fetchCount(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchCount]);

  return { count };
}

export const useUnreadMessages = isClientDemoMode
  ? () => ({ count: 0 })
  : useUnreadMessagesReal;
