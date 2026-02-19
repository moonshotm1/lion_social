"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Check,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { getTimeAgo } from "@/lib/types";
import type { MockNotification } from "@/lib/types";

const notificationIcons: Record<MockNotification["type"], React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

const notificationColors: Record<MockNotification["type"], string> = {
  like: "text-red-400 bg-red-400/10",
  comment: "text-blue-400 bg-blue-400/10",
  follow: "text-lion-gold bg-lion-gold/10",
  mention: "text-purple-400 bg-purple-400/10",
};

export default function NotificationsPage() {
  const { notifications, isLoading, markRead, markAllRead } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-lion-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-lion-gold text-lion-black text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-lion-gray-3 mt-1">
            Stay connected with your pride
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-lion-gold hover:bg-lion-gold/10 transition-all duration-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-1">
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type];
          const colorClass = notificationColors[notification.type];

          return (
            <div
              key={notification.id}
              onClick={() => markRead(notification.id)}
              className={`
                relative flex items-start gap-3 p-4 rounded-xl
                transition-all duration-200 cursor-pointer
                ${
                  notification.read
                    ? "bg-transparent hover:bg-lion-dark-2"
                    : "bg-lion-dark-2 border border-lion-gold/10 hover:border-lion-gold/20"
                }
              `}
            >
              {/* Unread indicator */}
              {!notification.read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-lion-gold animate-pulse-gold" />
              )}

              {/* User avatar with notification type icon */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-lion-gold/10">
                  <Image
                    src={notification.user.avatar}
                    alt={notification.user.displayName}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm leading-relaxed">
                  <Link
                    href={`/profile/${notification.user.username}`}
                    className="font-semibold text-lion-white hover:text-lion-gold transition-colors duration-200"
                  >
                    {notification.user.displayName}
                  </Link>{" "}
                  <span className="text-lion-gray-4">
                    {notification.message}
                  </span>
                </p>
                <p className="text-xs text-lion-gray-2 mt-1">
                  {getTimeAgo(notification.createdAt)}
                </p>
              </div>

              {/* Action indicator for follow notifications */}
              {notification.type === "follow" && (
                <button className="flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold bg-lion-gold text-lion-black hover:shadow-gold-sm transition-all duration-200 mt-1">
                  Follow back
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state (shown when all read) */}
      {notifications.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-lion-dark-2 flex items-center justify-center">
              <Bell className="w-8 h-8 text-lion-gray-2" />
            </div>
            <div>
              <p className="text-base font-semibold text-lion-gray-4">
                No notifications yet
              </p>
              <p className="text-sm text-lion-gray-2 mt-1">
                When someone interacts with your posts, you&apos;ll see it here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All caught up */}
      {notifications.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lion-dark-2 border border-lion-gold/10">
            <Check className="w-4 h-4 text-lion-gold" />
            <span className="text-xs text-lion-gray-3 font-medium">
              You&apos;re all caught up
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
