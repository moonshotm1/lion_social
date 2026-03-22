"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, UserPlus, UserCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type ConnectionType = "followers" | "following";

interface ConnectionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  isFollowing: boolean;
  isSelf: boolean;
}

interface ConnectionsModalProps {
  userId: string;
  initialTab: ConnectionType;
  followersCount: number;
  followingCount: number;
  onClose: () => void;
}

export function ConnectionsModal({
  userId,
  initialTab,
  followersCount,
  followingCount,
  onClose,
}: ConnectionsModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectionType>(initialTab);
  const [users, setUsers] = useState<ConnectionUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  const fetchConnections = useCallback(async (type: ConnectionType) => {
    setIsLoading(true);
    setUsers([]);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(
        `/api/user/connections?userId=${encodeURIComponent(userId)}&type=${type}`,
        { headers }
      );
      const data = await res.json();
      if (res.ok) setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConnections(activeTab);
  }, [activeTab, fetchConnections]);

  const handleFollowToggle = async (targetUser: ConnectionUser) => {
    if (followLoading.has(targetUser.id)) return;
    setFollowLoading((prev) => new Set(prev).add(targetUser.id));

    const willFollow = !targetUser.isFollowing;
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => u.id === targetUser.id ? { ...u, isFollowing: willFollow } : u)
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/user/follow", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const serverFollowing = !!data.following;
      setUsers((prev) =>
        prev.map((u) => u.id === targetUser.id ? { ...u, isFollowing: serverFollowing } : u)
      );
    } catch {
      // Revert
      setUsers((prev) =>
        prev.map((u) => u.id === targetUser.id ? { ...u, isFollowing: !willFollow } : u)
      );
    } finally {
      setFollowLoading((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-lion-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-lion-dark-1 rounded-t-2xl border-t border-lion-gold/15 max-h-[80vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-lion-gold/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-lion-gold/10">
          <h2 className="text-base font-bold text-lion-white">Connections</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-lion-gold/10">
          {(["followers", "following"] as const).map((tab) => {
            const count = tab === "followers" ? followersCount : followingCount;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative flex-1 py-3 text-sm font-semibold capitalize transition-colors
                  ${isActive ? "text-lion-gold" : "text-lion-gray-3 hover:text-lion-white"}
                `}
              >
                {tab} <span className="text-xs opacity-60">({count})</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gold-gradient rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* User List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm text-lion-gray-3">
                {activeTab === "followers" ? "No followers yet" : "Not following anyone yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-lion-gold/5">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Link
                    href={`/profile/${u.username}`}
                    onClick={onClose}
                    className="shrink-0"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-lion-dark-2 ring-1 ring-lion-gold/10">
                      <Image
                        src={
                          u.avatarUrl ??
                          `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`
                        }
                        alt={u.username}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  <Link
                    href={`/profile/${u.username}`}
                    onClick={onClose}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-lion-white truncate">
                      {u.displayName || u.username}
                    </p>
                    <p className="text-xs text-lion-gray-3 truncate">@{u.username}</p>
                  </Link>

                  {!u.isSelf && (
                    <button
                      onClick={() => handleFollowToggle(u)}
                      disabled={followLoading.has(u.id)}
                      className={`
                        shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        transition-all duration-200 disabled:opacity-50
                        ${
                          u.isFollowing
                            ? "bg-lion-dark-3 text-lion-white border border-lion-gold/20 hover:border-red-400/30 hover:text-red-400"
                            : "btn-gold"
                        }
                      `}
                    >
                      {u.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom safe area */}
        <div className="shrink-0 h-safe-bottom pb-4" />
      </div>
    </>
  );
}
