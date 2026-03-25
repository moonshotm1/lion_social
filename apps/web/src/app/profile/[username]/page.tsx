"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Grid3X3,
  Heart,
  Star,
  MoreHorizontal,
  Pencil,
  Users,
  Copy,
  Check,
  Ticket,
  LogOut,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatCount } from "@/lib/types";
import { transformPost } from "@/lib/transforms";
import type { MockPost } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { ConnectionsModal } from "@/components/profile/connections-modal";

type ProfileTab = "posts" | "likes" | "saved";

export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showConnections, setShowConnections] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState<"followers" | "following">("followers");
  const [showMenu, setShowMenu] = useState(false);

  // Resolve the "me" alias to the current user's real username
  const { user: currentUser, isLoading: currentUserLoading } = useCurrentUser();
  useEffect(() => {
    if (params.username === "me" && currentUser?.username) {
      router.replace(`/profile/${currentUser.username}`);
    }
  }, [params.username, currentUser?.username]);

  // When accessing /profile/me, resolve to the real username right away so
  // the queries fire immediately (the URL redirect still happens in parallel).
  const resolvedUsername =
    params.username === "me" ? (currentUser?.username ?? "") : params.username;

  // refreshKey increments when the page regains visibility, forcing counts to re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefreshKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener('lion:post-deleted', handler);
    return () => window.removeEventListener('lion:post-deleted', handler);
  }, []);

  const { user: profileUser, posts: userPosts, isFollowing: profileIsFollowing, isLoading, refreshCounts } = useUserProfile(resolvedUsername, refreshKey);

  const isOwnProfile =
    !!currentUser &&
    (params.username === "me" || currentUser.username === params.username);

  // ── Liked posts (fetched when "likes" tab is active) ──
  const [likedPosts, setLikedPosts] = useState<MockPost[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  useEffect(() => {
    if (activeTab !== "likes" || !profileUser?.id) return;
    setLikedLoading(true);
    createSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      return fetch(`/api/post/liked?userId=${encodeURIComponent(profileUser.id)}`, { headers });
    })
      .then((r) => r.json())
      .then((data) => { setLikedPosts((data.posts ?? []).map(transformPost)); setLikedLoading(false); })
      .catch(() => setLikedLoading(false));
  }, [activeTab, profileUser?.id, refreshKey]);

  // ── Saved posts (fetched when "saved" tab is active) ──
  const [savedPosts, setSavedPosts] = useState<MockPost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  useEffect(() => {
    if (activeTab !== "saved" || !profileUser?.id) return;
    setSavedLoading(true);
    createSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      return fetch(`/api/post/saved?userId=${encodeURIComponent(profileUser.id)}`, { headers });
    })
      .then((r) => r.json())
      .then((data) => { setSavedPosts((data.posts ?? []).map(transformPost)); setSavedLoading(false); })
      .catch(() => setSavedLoading(false));
  }, [activeTab, profileUser?.id, refreshKey]);

  // ── Invite data (fetched for own profile) ──
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(5);
  const [invitesUsed, setInvitesUsed] = useState(0);
  const [inviteList, setInviteList] = useState<{ usedByUsername: string | null; usedAt: string | null }[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  useEffect(() => {
    if (!isOwnProfile) return;
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        setInviteCode(data.inviteCode ?? null);
        setInviteCount(data.inviteCount ?? 5);
        setInvitesUsed(data.invitesUsed ?? 0);
      })
      .catch(() => {});
    fetch("/api/invite/list")
      .then((r) => r.json())
      .then((data) => { setInviteList(data.invites ?? []); })
      .catch(() => {});
  }, [isOwnProfile]);

  // Sync follow state and follower/following counts from profile data (resolved server-side)
  useEffect(() => {
    if (profileUser?.followers !== undefined) {
      setFollowersCount(profileUser.followers);
    }
    if (profileUser?.following !== undefined) {
      setFollowingCount(profileUser.following);
    }
    if (!isOwnProfile) {
      setIsFollowing(profileIsFollowing);
      // Reset to posts tab — likes/favorites are private and not shown for other profiles
      setActiveTab("posts");
    }
  }, [profileUser?.followers, profileUser?.following, profileIsFollowing, isOwnProfile]);

  const handleFollow = async () => {
    if (!profileUser?.id || followLoading) return;
    setFollowLoading(true);
    const willFollow = !isFollowing;
    // Optimistic update
    setIsFollowing(willFollow);
    setFollowersCount((prev) => (willFollow ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/user/follow", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetUserId: profileUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Reconcile with server response
      const serverFollowing = !!data.following;
      if (serverFollowing !== willFollow) {
        setIsFollowing(serverFollowing);
        setFollowersCount((prev) => (serverFollowing ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {
      // Revert optimistic update
      setIsFollowing(!willFollow);
      setFollowersCount((prev) => (willFollow ? Math.max(0, prev - 1) : prev + 1));
    } finally {
      setFollowLoading(false);
      // Background-refresh counts from server without clearing posts or showing a spinner
      setTimeout(() => refreshCounts(), 800);
    }
  };

  const handleSignOut = async () => {
    setShowMenu(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  // Which posts to show in the grid
  const gridPosts =
    activeTab === "likes" ? likedPosts
    : activeTab === "saved" ? savedPosts
    : userPosts;
  const gridLoading =
    activeTab === "likes" ? likedLoading
    : activeTab === "saved" ? savedLoading
    : isLoading;
  const gridEmpty: Record<ProfileTab, string> = {
    posts: "No posts yet",
    likes: "No liked posts yet",
    saved: "No favorites yet",
  };

  // While resolving "me" alias, show loading
  if (params.username === "me" && currentUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-lion-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = profileUser ?? {
    id: "",
    username: params.username,
    displayName: params.username,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${params.username}`,
    bio: "",
    followers: 0,
    following: 0,
    posts: 0,
    isVerified: false,
  };

  return (
    <div className="space-y-0 animate-fade-in -mx-4 -mt-6">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-lion-black/80 backdrop-blur-xl border-b border-lion-gold/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-lion-white">
                {user.displayName}
              </h1>
              {user.isVerified && (
                <BadgeCheck className="w-4 h-4 text-lion-gold fill-lion-gold/20" />
              )}
            </div>
            <p className="text-xs text-lion-gray-3">
              {formatCount(user.posts)} posts
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl bg-lion-dark-2 border border-lion-gold/15 shadow-xl overflow-hidden">
                {isOwnProfile && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-lion-dark-2 via-lion-gold/10 to-lion-dark-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,168,67,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,168,67,0.1),transparent_50%)]" />
        </div>

        {/* Avatar */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="relative w-24 h-24 inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-lion-black bg-lion-dark-2">
              <Image
                src={user.avatar}
                alt={user.displayName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200"
              >
                <Camera className="w-6 h-6 text-white" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-3 space-y-4">
        {/* Name and actions */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-lion-white">
                {user.displayName}
              </h2>
              {user.isVerified && (
                <BadgeCheck className="w-5 h-5 text-lion-gold fill-lion-gold/20" />
              )}
            </div>
            <p className="text-sm text-lion-gray-3">@{user.username}</p>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Link
                  href="/invite"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-lion-dark-3 text-lion-gold border border-lion-gold/20 hover:border-lion-gold/40 transition-all duration-200"
                  title="Invite Friends"
                >
                  <Users className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-lion-dark-3 text-lion-white border border-lion-gold/20 hover:border-lion-gold/40 transition-all duration-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Profile
                </Link>
              </>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`
                  px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-60
                  ${
                    isFollowing
                      ? "bg-lion-dark-3 text-lion-white border border-lion-gold/20 hover:border-red-400/30 hover:text-red-400"
                      : "btn-gold"
                  }
                `}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-lion-gray-5 leading-relaxed">{user.bio}</p>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-lg font-bold text-lion-white">
              {formatCount(user.posts)}
            </p>
            <p className="text-xs text-lion-gray-3">Posts</p>
          </div>
          <div className="h-8 w-px bg-lion-gold/10" />
          <button
            className="text-center hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
            disabled={!profileUser}
            onClick={() => { setConnectionsTab("followers"); setShowConnections(true); }}
          >
            <p className="text-lg font-bold text-lion-white">
              {formatCount(followersCount)}
            </p>
            <p className="text-xs text-lion-gray-3">Followers</p>
          </button>
          <div className="h-8 w-px bg-lion-gold/10" />
          <button
            className="text-center hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
            disabled={!profileUser}
            onClick={() => { setConnectionsTab("following"); setShowConnections(true); }}
          >
            <p className="text-lg font-bold text-lion-white">
              {formatCount(followingCount)}
            </p>
            <p className="text-xs text-lion-gray-3">Following</p>
          </button>
        </div>

        {/* Invite section — own profile only */}
        {isOwnProfile && inviteCode && (
          <div className="rounded-xl border border-lion-gold/15 bg-lion-dark-2/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-lion-gold" />
              <span className="text-xs font-semibold text-lion-gold uppercase tracking-wider">
                Your Invite Code
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-lion-dark-3 rounded-lg px-3 py-2 border border-lion-gold/15">
                <span className="font-mono text-sm font-bold text-lion-gold tracking-widest flex-1">
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-lion-gray-3 hover:text-lion-gold transition-colors shrink-0"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-gains-green" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-lion-gray-3">
              <span>{inviteCount - invitesUsed} of {inviteCount} invites remaining</span>
              <Link
                href="/profile/edit"
                className="text-lion-gold hover:text-lion-gold-light transition-colors"
              >
                Customize
              </Link>
            </div>
            {inviteList.filter((i) => i.usedByUsername).length > 0 && (
              <div className="space-y-1 pt-1 border-t border-lion-gold/10">
                <p className="text-xs text-lion-gray-3 mb-2">Invited members:</p>
                {inviteList.filter((i) => i.usedByUsername).map((invite, idx) => (
                  <Link
                    key={idx}
                    href={`/profile/${invite.usedByUsername}`}
                    className="flex items-center gap-2 text-xs text-lion-gray-4 hover:text-lion-white transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-lion-gold/40 shrink-0" />
                    @{invite.usedByUsername}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center border-b border-lion-gold/10 mt-4">
        {[
          { id: "posts" as ProfileTab, label: "Posts", icon: Grid3X3 },
          ...(isOwnProfile ? [
            { id: "likes" as ProfileTab, label: "Likes", icon: Heart },
            { id: "saved" as ProfileTab, label: "Favorites", icon: Star },
          ] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-3.5
                text-sm font-medium transition-colors duration-200
                ${isActive ? "text-lion-gold" : "text-lion-gray-3 hover:text-lion-white"}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gold-gradient rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Post Grid */}
      {gridLoading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
        </div>
      )}
      {!gridLoading && gridPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-lion-gray-3 gap-3">
          <Grid3X3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">{gridEmpty[activeTab]}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-0.5 px-0">
        {gridPosts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square bg-lion-dark-2 cursor-pointer group overflow-hidden block"
          >
            {post.image ? (
              <Image
                src={post.image}
                alt={post.caption}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, 200px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-lion-dark-2 to-lion-dark-3 flex items-center justify-center p-3">
                <p className="text-xs text-lion-gray-3 text-center line-clamp-4 leading-relaxed">
                  {post.caption.substring(0, 80)}...
                </p>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-lion-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-lion-white fill-lion-white" />
                <span className="text-sm font-semibold text-lion-white">
                  {formatCount(post.likes)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />

      {/* Followers / Following modal */}
      {showConnections && profileUser && (
        <ConnectionsModal
          userId={profileUser.id}
          initialTab={connectionsTab}
          followersCount={followersCount}
          followingCount={followingCount}
          onClose={() => {
            setShowConnections(false);
            // Background-refresh counts after follow/unfollow in modal
            setTimeout(() => refreshCounts(), 500);
          }}
        />
      )}
    </div>
  );
}
