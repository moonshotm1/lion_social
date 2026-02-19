"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";
import { mockNotifications } from "@/lib/mock-data";
import type { MockNotification } from "@/lib/types";

interface UseNotificationsResult {
  notifications: MockNotification[];
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

function useNotificationsDemo(): UseNotificationsResult {
  const [notifications, setNotifications] =
    useState<MockNotification[]>(mockNotifications);

  return {
    notifications,
    isLoading: false,
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
  const query = trpc.notification.list.useQuery({});
  const markReadMutation = trpc.notification.markRead.useMutation();
  const markAllReadMutation = trpc.notification.markAllRead.useMutation();
  const utils = trpc.useUtils();

  const notifications: MockNotification[] = (
    query.data?.notifications ?? []
  ).map((n: any) => ({
    id: n.id,
    type: n.type as MockNotification["type"],
    user: {
      id: "",
      username: "",
      displayName: "",
      avatar: "",
      bio: "",
      followers: 0,
      following: 0,
      posts: 0,
      isVerified: false,
    },
    message: `${n.type} notification`,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    read: n.read,
    postId: n.referenceId,
  }));

  return {
    notifications,
    isLoading: query.isLoading,
    markRead: (id: string) => {
      markReadMutation.mutate(
        { id },
        { onSuccess: () => utils.notification.list.invalidate() }
      );
    },
    markAllRead: () => {
      markAllReadMutation.mutate(undefined, {
        onSuccess: () => utils.notification.list.invalidate(),
      });
    },
  };
}

export const useNotifications = isClientDemoMode
  ? useNotificationsDemo
  : useNotificationsReal;
