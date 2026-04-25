"use client";

import { useState, useEffect, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function useUnreadCountDemo() {
  return { count: 3 };
}

function useUnreadCountReal() {
  const { user, isSignedIn } = useCurrentUser();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
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

  // Reset badge immediately when the notifications page marks all as read
  useEffect(() => {
    const handler = () => setCount(0);
    window.addEventListener("lion:notifications-read-all", handler);
    return () => window.removeEventListener("lion:notifications-read-all", handler);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCount]);

  return { count };
}

export const useUnreadCount = isClientDemoMode
  ? useUnreadCountDemo
  : useUnreadCountReal;
