"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function useUnreadCountDemo() {
  return { count: 3 };
}

function useUnreadCountReal() {
  const { user, isSignedIn } = useCurrentUser();
  const utils = trpc.useUtils();

  const { data } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: isSignedIn,
    refetchInterval: 30000, // 30-second polling fallback
  });

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
          utils.notification.unreadCount.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, utils]);

  return { count: data?.count ?? 0 };
}

export const useUnreadCount = isClientDemoMode
  ? useUnreadCountDemo
  : useUnreadCountReal;
