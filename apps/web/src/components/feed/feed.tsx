"use client";

import { useState } from "react";
import { Crown, Flame, TrendingUp } from "lucide-react";
import { PostCard } from "./post-card";
import { mockPosts } from "@/lib/mock-data";

type FeedTab = "following" | "explore";

export function Feed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");

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

      {/* Stories / Highlights Row */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {[
          { label: "Your Story", isAdd: true },
          { label: "Marcus", avatar: "marcus" },
          { label: "Elena", avatar: "elena" },
          { label: "King", avatar: "king" },
          { label: "Ava", avatar: "ava" },
        ].map((story, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                ${
                  story.isAdd
                    ? "bg-lion-dark-3 border-2 border-dashed border-lion-gold/30 hover:border-lion-gold/60"
                    : "bg-gradient-to-br from-lion-gold via-lion-gold-light to-lion-gold-dark p-[2px]"
                }
                transition-all duration-300 cursor-pointer
              `}
            >
              {story.isAdd ? (
                <span className="text-2xl text-lion-gold">+</span>
              ) : (
                <div className="w-full h-full rounded-full bg-lion-dark-2 flex items-center justify-center">
                  <span className="text-sm font-bold text-lion-gray-4">
                    {story.label[0]}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-lion-gray-3 font-medium">
              {story.label}
            </span>
          </div>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-5">
        {mockPosts.map((post, index) => (
          <div
            key={post.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <PostCard post={post} />
          </div>
        ))}
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
