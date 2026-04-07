"use client";

import { useState } from "react";
import {
  Crown,
  Flame,
  Sparkles,
  Dumbbell,
  Salad,
  Quote,
  BookOpen,
  Users,
} from "lucide-react";
import { PostCard } from "./post-card";
import { useFeed } from "@/hooks/use-feed";
import type { PostType } from "@/lib/types";

type CategoryFilter = "all" | PostType;

const categories: {
  id: CategoryFilter;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  activeBg: string;
}[] = [
  { id: "all", label: "All", icon: Sparkles, activeColor: "text-lion-gold", activeBg: "bg-lion-gold/15 border-lion-gold/40" },
  { id: "workout", label: "Workouts", icon: Dumbbell, activeColor: "text-lion-gold", activeBg: "bg-lion-gold/15 border-lion-gold/40" },
  { id: "meal", label: "Meals", icon: Salad, activeColor: "text-gains-green", activeBg: "bg-gains-green/15 border-gains-green/40" },
  { id: "quote", label: "Quotes", icon: Quote, activeColor: "text-gains-purple", activeBg: "bg-gains-purple/15 border-gains-purple/40" },
  { id: "story", label: "Journal", icon: BookOpen, activeColor: "text-gains-orange", activeBg: "bg-gains-orange/15 border-gains-orange/40" },
];

export function Feed() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Home feed always shows the "following" tab — people you follow
  const { posts, isLoading, isLoadingMore, hasNextPage, fetchNextPage } = useFeed(activeCategory, "following");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-4 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lion-gold/10 border border-lion-gold/20 mb-4">
          <Flame className="w-4 h-4 text-lion-gold" />
          <span className="text-xs font-semibold text-lion-gold uppercase tracking-wider">
            Rise and Conquer
          </span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="sticky top-0 z-30 bg-lion-black/80 backdrop-blur-xl border-b border-lion-gold/10 -mx-4 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold
                  border transition-all duration-200 whitespace-nowrap shrink-0
                  ${
                    isActive
                      ? `${cat.activeBg} ${cat.activeColor}`
                      : "bg-lion-dark-2 border-lion-gold/10 text-lion-gray-3 hover:border-lion-gold/25 hover:text-lion-gray-4"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-5">
        {isLoading ? null : posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={post.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-lion-gold/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-lion-gold/60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-lion-white">No posts yet</p>
              <p className="text-xs text-lion-gray-3">
                Follow people to see their posts here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Load More / End of Feed */}
      {!isLoading && posts.length > 0 && (
        <div className="text-center py-8">
          {hasNextPage ? (
            <button
              onClick={fetchNextPage}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold btn-gold disabled:opacity-50"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          ) : (
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-lion-gold/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-lion-gold" />
              </div>
              <p className="text-sm text-lion-gray-3 font-medium">
                You&apos;re all caught up
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
