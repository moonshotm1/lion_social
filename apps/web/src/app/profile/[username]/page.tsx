"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Grid3X3,
  Heart,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatCount } from "@/lib/types";

type ProfileTab = "posts" | "likes" | "saved";

export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  // Resolve the "me" alias to the current user's real username
  const { user: currentUser, isLoading: currentUserLoading } = useCurrentUser();
  useEffect(() => {
    if (params.username === "me" && currentUser?.username) {
      router.replace(`/profile/${currentUser.username}`);
    }
  }, [params.username, currentUser?.username]);

  const { user: profileUser, posts: userPosts, isLoading } = useUserProfile(
    params.username === "me" ? "" : params.username
  );

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
        <button className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200">
          <MoreHorizontal className="w-5 h-5" />
        </button>
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
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-lion-black bg-lion-dark-2">
            <Image
              src={user.avatar}
              alt={user.displayName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
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
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`
                px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                ${
                  isFollowing
                    ? "bg-lion-dark-3 text-lion-white border border-lion-gold/20 hover:border-red-400/30 hover:text-red-400"
                    : "btn-gold"
                }
              `}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
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
          <div className="text-center">
            <p className="text-lg font-bold text-lion-white">
              {formatCount(user.followers)}
            </p>
            <p className="text-xs text-lion-gray-3">Followers</p>
          </div>
          <div className="h-8 w-px bg-lion-gold/10" />
          <div className="text-center">
            <p className="text-lg font-bold text-lion-white">
              {formatCount(user.following)}
            </p>
            <p className="text-xs text-lion-gray-3">Following</p>
          </div>
        </div>

      </div>

      {/* Tab Bar */}
      <div className="flex items-center border-b border-lion-gold/10 mt-4">
        {[
          { id: "posts" as ProfileTab, label: "Posts", icon: Grid3X3 },
          { id: "likes" as ProfileTab, label: "Likes", icon: Heart },
          { id: "saved" as ProfileTab, label: "Saved", icon: Bookmark },
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
      {userPosts.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-lion-gray-3 gap-3">
          <Grid3X3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">No posts yet</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-0.5 px-0">
        {userPosts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-lion-dark-2 cursor-pointer group overflow-hidden"
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
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
