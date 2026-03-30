"use client";

import { useState, useEffect, useCallback } from "react";
import { isClientDemoMode } from "@/lib/env-client";
import { mockNotifications } from "@/lib/mock-data";
import type { MockNotification } from "@/lib/types";

interface UseNotificationsResult {
  notifications: MockNotification[];
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Set of actor user IDs that the current user is already following */
  initialFollowingIds: Set<string>;
}

function useNotificationsDemo(): UseNotificationsResult {
  const [notifications, setNotifications] =
    useState<MockNotification[]>(mockNotifications);

  return {
    notifications,
    isLoading: false,
    initialFollowingIds: new Set(),
    markRead: (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    markAllRead: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    },
  };
}

function useNotificationsReal(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFollowingIds, setInitialFollowingIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: MockNotification[] = (data.notifications ?? []).map(
        (n: any) => ({
          id: n.id,
          type: n.type as MockNotification["type"],
          user: {
            id: n.actor?.id ?? "",
            username: n.actor?.username ?? "unknown",
            displayName: n.actor?.username ?? "unknown",
            avatar: n.actor?.avatarUrl ?? "",
            bio: "",
            followers: 0,
            following: 0,
            posts: 0,
            isVerified: false,
          },
          message: n.message ?? `${n.type} notification`,
          createdAt: n.createdAt,
          read: n.read,
          postId: n.postId ?? undefined,
        })
      );
      setNotifications(items);
      // Seed the following set from server-resolved isFollowingActor
      const alreadyFollowing = new Set<string>(
        (data.notifications ?? [])
          .filter((n: any) => n.isFollowingActor && n.actor?.id)
          .map((n: any) => n.actor.id as string)
      );
      setInitialFollowingIds(alreadyFollowing);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
    // Let the unread-count badge reset immediately without waiting for the poll
    window.dispatchEvent(new CustomEvent("lion:notifications-read-all"));
  }, []);

  return { notifications, isLoading, markRead, markAllRead, initialFollowingIds };
}

export const useNotifications = isClientDemoMode
  ? useNotificationsDemo
  : useNotificationsReal;
