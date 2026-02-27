"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  Sparkles,
  Dumbbell,
  Salad,
  Quote,
  BookOpen,
  Heart,
  BadgeCheck,
  Crown,
  ArrowRight,
  X,
} from "lucide-react";
import { useExplore } from "@/hooks/use-explore";
import { formatCount } from "@/lib/types";
import type { PostType } from "@/lib/types";

type CategoryTab = "all" | PostType;

const categories: { id: CategoryTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "workout", label: "Workouts", icon: Dumbbell },
  { id: "meal", label: "Meals", icon: Salad },
  { id: "quote", label: "Quotes", icon: Quote },
  { id: "story", label: "Stories", icon: BookOpen },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { trendingPosts, featuredUsers, isLoading, filterByCategory } = useExplore();
  const filteredPosts = filterByCategory(activeCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-lion-white">Explore</h1>
        <p className="text-sm text-lion-gray-3 mt-1">
          Discover what inspires the community
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
            isSearchFocused ? "text-lion-gold" : "text-lion-gray-3"
          }`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search posts, people, tags..."
          className="input-dark pl-11 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                text-sm font-medium transition-all duration-200 flex-shrink-0
                ${
                  isActive
                    ? "bg-lion-gold text-lion-black"
                    : "bg-lion-dark-2 text-lion-gray-3 border border-lion-gold/10 hover:border-lion-gold/30 hover:text-lion-white"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Trending Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lion-gold" />
            <h2 className="text-lg font-bold text-lion-white">
              Trending Now
            </h2>
          </div>
          <button className="text-xs text-lion-gold hover:text-lion-gold-light transition-colors duration-200 flex items-center gap-1">
            See all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trending Post Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filteredPosts.slice(0, 4).map((post, index) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className={`
                relative overflow-hidden rounded-xl bg-lion-dark-2 cursor-pointer group block
                ${index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}
              `}
            >
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes={
                    index === 0
                      ? "(max-width: 640px) 100vw, 640px"
                      : "(max-width: 640px) 50vw, 320px"
                  }
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-lion-dark-2 to-lion-dark-3 flex items-center justify-center p-6">
                  <p className="text-sm text-lion-gray-4 text-center line-clamp-4 italic leading-relaxed">
                    &ldquo;{post.caption.substring(0, 120)}...&rdquo;
                  </p>
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-lion-black/80 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-lion-gold/30">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.displayName}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-semibold text-lion-white">
                    {post.author.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-lion-gray-4">
                    <Heart className="w-3 h-3" />
                    {formatCount(post.likes)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Creators */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-lion-gold" />
            <h2 className="text-lg font-bold text-lion-white">
              Featured Creators
            </h2>
          </div>
          <button className="text-xs text-lion-gold hover:text-lion-gold-light transition-colors duration-200 flex items-center gap-1">
            See all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {featuredUsers.map((creator) => (
            <Link
              key={creator.id}
              href={`/profile/${creator.username}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-lion-dark-2 border border-lion-gold/5 hover:border-lion-gold/15 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-lion-gold/20 group-hover:ring-lion-gold/40 transition-all duration-300">
                <Image
                  src={creator.avatar}
                  alt={creator.displayName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-lion-white truncate group-hover:text-lion-gold transition-colors duration-200">
                    {creator.displayName}
                  </p>
                  {creator.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-lion-gold fill-lion-gold/20 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-lion-gray-3 truncate">
                  {creator.bio.substring(0, 60)}...
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-semibold text-lion-gold">
                  {formatCount(creator.followers)}
                </span>
                <span className="text-[10px] text-lion-gray-3">followers</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Tags */}
      <section>
        <h2 className="text-lg font-bold text-lion-white mb-4">
          Trending Tags
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "morninggrind",
            "neversettle",
            "plantbased",
            "irontherapy",
            "mindset",
            "transformation",
            "discipline",
            "wellness",
            "preworkout",
            "marathon",
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full bg-lion-dark-2 border border-lion-gold/10 text-sm text-lion-gray-4 hover:text-lion-gold hover:border-lion-gold/30 transition-all duration-200 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
