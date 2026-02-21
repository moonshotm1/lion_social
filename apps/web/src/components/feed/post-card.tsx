"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Star,
  Eye,
  MoreHorizontal,
  BadgeCheck,
  Clock,
  Flame,
  Dumbbell,
  Quote,
  BookOpen,
  UtensilsCrossed,
} from "lucide-react";
import type { MockPost, WorkoutData, MealData, QuoteData, StoryData } from "@/lib/types";
import { getTimeAgo, formatCount, postTypeConfig } from "@/lib/types";
import { useLike } from "@/hooks/use-like";

// ─── Helper: calculate total volume ────────────────────────────────────────

function calcTotalVolume(workout: WorkoutData): number {
  return workout.exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((exTotal, set) => {
        return exTotal + set.reps * set.weight;
      }, 0)
    );
  }, 0);
}

// ─── Helper: format set summary ────────────────────────────────────────────

function formatSetSummary(exercise: { name: string; sets: { reps: number; weight: number; unit: "lbs" | "kg" }[] }): string {
  const setCount = exercise.sets.length;
  const reps = exercise.sets[0].reps;
  const weight = exercise.sets[0].weight;
  const unit = exercise.sets[0].unit;
  // Check if all sets are the same
  const allSame = exercise.sets.every(
    (s) => s.reps === reps && s.weight === weight
  );
  if (allSame) {
    return `${setCount}x${reps} @ ${weight} ${unit}`;
  }
  // Show range
  const minReps = Math.min(...exercise.sets.map((s) => s.reps));
  const maxReps = Math.max(...exercise.sets.map((s) => s.reps));
  const maxWeight = Math.max(...exercise.sets.map((s) => s.weight));
  return `${setCount}x${minReps}-${maxReps} @ ${maxWeight} ${unit}`;
}

// ─── Workout Content ───────────────────────────────────────────────────────

function WorkoutContent({ data }: { data: WorkoutData }) {
  const totalVolume = calcTotalVolume(data);

  return (
    <div className="px-4 pt-3 pb-2 space-y-3">
      {/* Title and badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-orange-400" />
          <h3 className="text-base font-bold text-lion-white">{data.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-400/10 text-orange-400">
            <Clock className="w-3 h-3" />
            {data.duration} min
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-1.5">
        {data.exercises.map((exercise, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-lion-dark-2/60 hover:bg-lion-dark-3/60 transition-colors duration-150"
          >
            <span className="text-sm text-lion-gray-5 font-medium">
              {exercise.name}
            </span>
            <span className="text-xs text-lion-gray-3 font-mono">
              {formatSetSummary(exercise)}
            </span>
          </div>
        ))}
      </div>

      {/* Total volume */}
      <div className="flex items-center gap-2 pt-1">
        <Flame className="w-3.5 h-3.5 text-lion-gold" />
        <span className="text-xs font-semibold text-lion-gold">
          Total Volume: {formatCount(totalVolume)} lbs
        </span>
      </div>
    </div>
  );
}

// ─── Meal Content ──────────────────────────────────────────────────────────

function MealContent({ data }: { data: MealData }) {
  const mealTypeLabel =
    data.mealType.charAt(0).toUpperCase() + data.mealType.slice(1);

  return (
    <div className="px-4 pt-3 pb-2 space-y-3">
      {/* Title and meal type badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-green-400" />
          <h3 className="text-base font-bold text-lion-white">{data.name}</h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-400/10 text-green-400">
          {mealTypeLabel}
        </span>
      </div>

      {/* Macros row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Calories", value: `${data.macros.calories}`, unit: "kcal", color: "text-lion-gold" },
          { label: "Protein", value: `${data.macros.protein}g`, unit: "", color: "text-red-400" },
          { label: "Carbs", value: `${data.macros.carbs}g`, unit: "", color: "text-blue-400" },
          { label: "Fat", value: `${data.macros.fat}g`, unit: "", color: "text-yellow-400" },
        ].map((macro) => (
          <div
            key={macro.label}
            className="text-center py-2 px-1 rounded-lg bg-lion-dark-2/60"
          >
            <p className={`text-sm font-bold ${macro.color}`}>
              {macro.value}
              {macro.unit && (
                <span className="text-[10px] font-normal ml-0.5 opacity-70">
                  {macro.unit}
                </span>
              )}
            </p>
            <p className="text-[10px] text-lion-gray-3 mt-0.5 uppercase tracking-wider">
              {macro.label}
            </p>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div className="flex flex-wrap gap-1.5">
        {data.ingredients.map((ingredient) => (
          <span
            key={ingredient.name}
            className="text-xs px-2.5 py-1 rounded-full bg-green-400/5 text-lion-gray-4 border border-green-400/10 hover:border-green-400/30 transition-colors duration-200"
          >
            {ingredient.name}{" "}
            <span className="text-lion-gray-2">({ingredient.amount})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Quote Content ─────────────────────────────────────────────────────────

function QuoteContent({ data }: { data: QuoteData }) {
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="relative rounded-xl overflow-hidden border border-lion-gold/20 shadow-gold-md bg-gradient-to-br from-lion-dark-2 via-lion-dark-3 to-lion-dark-2">
        {/* Subtle gold glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,168,67,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,168,67,0.06),transparent_60%)]" />

        <div className="relative px-6 py-8 text-center space-y-4">
          {/* Opening quotation mark */}
          <Quote className="w-8 h-8 text-lion-gold/40 mx-auto rotate-180" />

          {/* Quote text */}
          <p className="text-lg italic text-lion-white leading-relaxed font-light tracking-wide">
            {data.text}
          </p>

          {/* Author */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-lion-gold/30" />
            <p className="text-sm font-semibold text-lion-gold">{data.author}</p>
            <div className="h-px w-8 bg-lion-gold/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Story Content ─────────────────────────────────────────────────────────

function StoryContent({ data }: { data: StoryData }) {
  const previewLength = 200;
  const isLong = data.content.length > previewLength;
  const preview = isLong
    ? data.content.substring(0, previewLength).trim() + "..."
    : data.content;

  return (
    <div className="px-4 pt-3 pb-2 space-y-3">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-400" />
        <h3 className="text-base font-bold text-lion-white">{data.title}</h3>
      </div>

      {/* Content preview */}
      <p className="text-sm text-lion-gray-4 leading-relaxed">
        {preview}
        {isLong && (
          <button className="ml-1 text-lion-gold hover:text-lion-gold-light font-medium transition-colors duration-200">
            Read more
          </button>
        )}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/15 hover:border-purple-400/40 transition-colors duration-200 cursor-pointer"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Post Card ────────────────────────────────────────────────────────

interface PostCardProps {
  post: MockPost;
  onLike?: (postId: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(post.isFavorited);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const { toggleLike } = useLike();

  const typeConfig = postTypeConfig[post.type];

  const handleLike = () => {
    setIsAnimatingLike(true);
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    toggleLike(post.id);
    onLike?.(post.id);
    setTimeout(() => setIsAnimatingLike(false), 300);
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  // Determine if we show the image above type-specific content
  // Quotes never show a regular image (they have their own styled card)
  const showImage = post.image && post.type !== "quote";

  return (
    <article className="card-premium p-0 overflow-hidden animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Link
            href={`/profile/${post.author.username}`}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-lion-gold/20 group-hover:ring-lion-gold/50 transition-all duration-300">
              <Image
                src={post.author.avatar}
                alt={post.author.displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* Author info */}
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.author.username}`}
                className="text-sm font-semibold text-lion-white hover:text-lion-gold transition-colors duration-200"
              >
                {post.author.displayName}
              </Link>
              {post.author.isVerified && (
                <BadgeCheck className="w-4 h-4 text-lion-gold fill-lion-gold/20" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lion-gray-3">
                @{post.author.username}
              </span>
              <span className="text-lion-gray-2 text-xs">&middot;</span>
              <span className="text-xs text-lion-gray-3">
                {getTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Post type badge */}
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}
          >
            {typeConfig.emoji} {typeConfig.label}
          </span>

          {/* More button */}
          <button className="p-1.5 rounded-lg text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Image (for workout, meal, story -- not quote) ───────────────── */}
      {showImage && (
        <div
          className="relative aspect-[4/3] bg-lion-dark-2 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          <Image
            src={post.image!}
            alt={post.caption}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />

          {/* Double-tap like animation overlay */}
          {isAnimatingLike && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-20 h-20 text-lion-gold fill-lion-gold animate-scale-in opacity-90" />
            </div>
          )}
        </div>
      )}

      {/* ── Type-Specific Content ───────────────────────────────────────── */}
      {post.type === "workout" && post.workoutData && (
        <WorkoutContent data={post.workoutData} />
      )}
      {post.type === "meal" && post.mealData && (
        <MealContent data={post.mealData} />
      )}
      {post.type === "quote" && post.quoteData && (
        <QuoteContent data={post.quoteData} />
      )}
      {post.type === "story" && post.storyData && (
        <StoryContent data={post.storyData} />
      )}

      {/* ── Caption ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-2">
        <p className="text-sm text-lion-gray-5 leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-lion-gold/70 hover:text-lion-gold cursor-pointer transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Views ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 pb-2">
        <Eye className="w-3.5 h-3.5 text-lion-gray-2" />
        <span className="text-xs text-lion-gray-2">
          {formatCount(post.views)} views
        </span>
      </div>

      {/* ── Action Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-lion-gold/5">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isLiked
                  ? "text-lion-gold fill-lion-gold scale-110"
                  : "text-lion-gray-3 group-hover:text-lion-gold"
              } ${isAnimatingLike ? "animate-scale-in" : ""}`}
            />
            <span
              className={`text-xs font-medium ${
                isLiked ? "text-lion-gold" : "text-lion-gray-3"
              }`}
            >
              {formatCount(likeCount)}
            </span>
          </button>

          {/* Comment */}
          <button className="flex items-center gap-1.5 group">
            <MessageCircle className="w-5 h-5 text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200" />
            <span className="text-xs font-medium text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200">
              {formatCount(post.comments)}
            </span>
          </button>

          {/* Share */}
          <button className="flex items-center gap-1.5 group">
            <Share2 className="w-5 h-5 text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200" />
            <span className="text-xs font-medium text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200">
              {formatCount(post.shares)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Favorite */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="group"
          >
            <Star
              className={`w-5 h-5 transition-all duration-200 ${
                isFavorited
                  ? "text-yellow-400 fill-yellow-400 scale-110"
                  : "text-lion-gray-3 group-hover:text-yellow-400"
              }`}
            />
          </button>

          {/* Bookmark */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="group"
          >
            <Bookmark
              className={`w-5 h-5 transition-all duration-200 ${
                isBookmarked
                  ? "text-lion-gold fill-lion-gold"
                  : "text-lion-gray-3 group-hover:text-lion-gold"
              }`}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
