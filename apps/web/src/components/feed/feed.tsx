"use client";

import { useState } from "react";
import {
  Crown,
  Flame,
  TrendingUp,
  Sparkles,
  Dumbbell,
  Salad,
  Quote,
  BookOpen,
} from "lucide-react";
import { PostCard } from "./post-card";
import { mockPosts, type PostType } from "@/lib/mock-data";

type FeedTab = "following" | "explore";
type CategoryFilter = "all" | PostType;

const categories: {
  id: CategoryFilter;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  activeBg: string;
}[] = [
  { id: "all", label: "All", icon: Sparkles, activeColor: "text-lion-gold", activeBg: "bg-lion-gold/15 border-lion-gold/40" },
  { id: "workout", label: "Workouts", icon: Dumbbell, activeColor: "text-orange-400", activeBg: "bg-orange-400/15 border-orange-400/40" },
  { id: "meal", label: "Meals", icon: Salad, activeColor: "text-green-400", activeBg: "bg-green-400/15 border-green-400/40" },
  { id: "quote", label: "Quotes", icon: Quote, activeColor: "text-lion-gold", activeBg: "bg-lion-gold/15 border-lion-gold/40" },
  { id: "story", label: "Stories", icon: BookOpen, activeColor: "text-purple-400", activeBg: "bg-purple-400/15 border-purple-400/40" },
];

export function Feed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredPosts =
    activeCategory === "all"
      ? mockPosts
      : mockPosts.filter((p) => p.type === activeCategory);

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

      {/* Tab Bar */}
      <div className="sticky top-0 z-30 bg-lion-black/80 backdrop-blur-xl border-b border-lion-gold/10 -mx-4 px-4">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setActiveTab("following")}
            className={`
              relative flex-1 py-4 text-sm font-semibold text-center
              transition-colors duration-200
              ${
                activeTab === "following"
                  ? "text-lion-gold"
                  : "text-lion-gray-3 hover:text-lion-white"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />
              Following
            </div>
            {activeTab === "following" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gold-gradient rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("explore")}
            className={`
              relative flex-1 py-4 text-sm font-semibold text-center
              transition-colors duration-200
              ${
                activeTab === "explore"
                  ? "text-lion-gold"
                  : "text-lion-gray-3 hover:text-lion-white"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Explore
            </div>
            {activeTab === "explore" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gold-gradient rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
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
              {isActive && activeCategory !== "all" && (
                <span className="ml-0.5 opacity-70">
                  ({filteredPosts.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Posts Feed */}
      <div className="space-y-5">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-lion-gray-3">
              No posts in this category yet
            </p>
          </div>
        )}
      </div>

      {/* End of Feed */}
      <div className="text-center py-12">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-lion-gold/10 flex items-center justify-center">
            <Crown className="w-6 h-6 text-lion-gold" />
          </div>
          <p className="text-sm text-lion-gray-3 font-medium">
            You&apos;re all caught up
          </p>
          <p className="text-xs text-lion-gray-2">
            Follow more people to fill your feed
          </p>
        </div>
      </div>
    </div>
  );
}
