"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share2,
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
  Send,
  Trash2,
  Flag,
  Check,
} from "lucide-react";
import type { MockPost, WorkoutData, MealData, QuoteData, StoryData } from "@/lib/types";
import { getTimeAgo, formatCount, postTypeConfig } from "@/lib/types";
import { isClientDemoMode } from "@/lib/env-client";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useLikes } from "@/components/providers/likes-provider";
import { useViews } from "@/components/providers/views-provider";
import { useCurrentUser } from "@/hooks/use-current-user";

// ─── Comment types ──────────────────────────────────────────────────────────

interface InlineComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
}

// ─── Inline comment section ─────────────────────────────────────────────────

function InlineComments({
  postId,
  initialCount,
  onCountChange,
}: {
  postId: string;
  initialCount: number;
  onCountChange: (n: number) => void;
}) {
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (loaded || isClientDemoMode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/post/${postId}/comment`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }, [postId, loaded]);

  // Load on first render of this component (called when expanded)
  if (!loaded && !loading) {
    load();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting || isClientDemoMode) return;
    setSubmitting(true);
    const optimistic: InlineComment = {
      id: `opt-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      user: { id: "", username: "you", avatarUrl: null },
    };
    setComments((prev) => [...prev, optimistic]);
    onCountChange(initialCount + 1);
    setText("");
    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      const res = await fetch(`/api/post/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic with real comment (no user info returned, reload)
        const reload = await fetch(`/api/post/${postId}/comment`);
        if (reload.ok) {
          const data = await reload.json();
          setComments(data.comments ?? []);
        } else {
          setComments((prev) =>
            prev.map((c) => (c.id === optimistic.id ? { ...optimistic, id: saved.id } : c))
          );
        }
      } else {
        // Revert on error
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        onCountChange(initialCount);
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      onCountChange(initialCount);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-lion-gold/8 bg-lion-dark-2/30">
      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-lion-gray-2 text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-lion-gold/5 max-h-64 overflow-y-auto">
          {comments.map((c) => {
            const avatar =
              c.user.avatarUrl ??
              `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.user.username}`;
            return (
              <div key={c.id} className="flex gap-2.5 px-4 py-3">
                <Link href={`/profile/${c.user.username}`} className="shrink-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-lion-gold/20">
                    <Image src={avatar} alt={c.user.username} width={28} height={28} className="w-full h-full object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <Link
                      href={`/profile/${c.user.username}`}
                      className="text-xs font-semibold text-lion-white hover:text-lion-gold transition-colors"
                    >
                      {c.user.username}
                    </Link>
                    <span className="text-[10px] text-lion-gray-2" suppressHydrationWarning>
                      {getTimeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-lion-gray-4 leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3 border-t border-lion-gold/8"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment… (Enter to send)"
          rows={1}
          className="flex-1 resize-none bg-lion-dark-3 border border-lion-gold/10 rounded-xl px-3 py-2 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/30 focus:ring-1 focus:ring-lion-gold/20 transition-colors max-h-24 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting || isClientDemoMode}
          className="p-2 rounded-xl bg-gold-gradient text-lion-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-gold-sm flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

// ─── Helper: calculate total volume ────────────────────────────────────────

function calcTotalVolume(workout: WorkoutData): number {
  if (!Array.isArray(workout.exercises)) return 0;
  return workout.exercises.reduce((total, exercise) => {
    if (!Array.isArray(exercise.sets)) return total;
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
  if (!exercise.sets || exercise.sets.length === 0) return "";
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
          <Dumbbell className="w-4 h-4 text-lion-gold" />
          <h3 className="text-base font-bold text-lion-white">{data.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-lion-gold/10 text-lion-gold">
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
  const mealTypeLabel = data.mealType
    ? data.mealType.charAt(0).toUpperCase() + data.mealType.slice(1)
    : "Meal";

  return (
    <div className="px-4 pt-3 pb-2 space-y-3">
      {/* Title and meal type badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-gains-green" />
          <h3 className="text-base font-bold text-lion-white">{data.name}</h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gains-green/10 text-gains-green">
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
            className="text-xs px-2.5 py-1 rounded-full bg-gains-green/5 text-lion-gray-4 border border-gains-green/10 hover:border-gains-green/30 transition-colors duration-200"
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
      <div className="relative rounded-xl overflow-hidden border border-gains-purple/20 bg-gradient-to-br from-lion-dark-2 via-lion-dark-3 to-lion-dark-2" style={{ boxShadow: "0 4px 16px rgba(155, 143, 255, 0.1)" }}>
        {/* Subtle purple glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(155,143,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(155,143,255,0.06),transparent_60%)]" />

        <div className="relative px-6 py-8 text-center space-y-4">
          {/* Opening quotation mark */}
          <Quote className="w-8 h-8 text-gains-purple/40 mx-auto rotate-180" />

          {/* Quote text */}
          <p className="text-lg italic text-lion-white leading-relaxed font-light tracking-wide">
            {data.text}
          </p>

          {/* Author */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gains-purple/30" />
            <p className="text-sm font-semibold text-gains-purple">{data.author}</p>
            <div className="h-px w-8 bg-gains-purple/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Story Content ─────────────────────────────────────────────────────────

function StoryContent({ data, expanded }: { data: StoryData; expanded?: boolean }) {
  const previewLength = 200;
  const content = data.content ?? "";
  const isLong = content.length > previewLength;
  const preview = !expanded && isLong
    ? content.substring(0, previewLength).trim() + "..."
    : content;

  return (
    <div className="px-4 pt-3 pb-2 space-y-3">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gains-orange" />
        <h3 className="text-base font-bold text-lion-white">{data.title}</h3>
      </div>

      {/* Content preview */}
      <p className="text-sm text-lion-gray-4 leading-relaxed whitespace-pre-line">
        {preview || <span className="italic text-lion-gray-2">No content</span>}
        {!expanded && isLong && (
          <span className="ml-1 text-lion-gold font-medium">Read more</span>
        )}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full bg-gains-orange/10 text-gains-orange border border-gains-orange/15 hover:border-gains-orange/40 transition-colors duration-200 cursor-pointer"
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
  /** When true: show full story text, disable click-to-navigate (used on detail page) */
  expanded?: boolean;
}

export function PostCard({ post, onLike, expanded = false }: PostCardProps) {
  const router = useRouter();
  const { likedIds, setLikedId } = useLikes();
  const { trackView } = useViews();
  const { user: currentUser } = useCurrentUser();
  const isOwnPost = !!currentUser && currentUser.username === post.author.username;

  // ── Like state ────────────────────────────────────────────────────────────
  // post.isLiked comes from the feed route (server-computed) — no async delay.
  // likedIds.has() catches the case where context is already bootstrapped.
  const [liked, setLiked] = useState(post.isLiked || likedIds.has(post.id));
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);

  // ── Star/save state ───────────────────────────────────────────────────────
  const [starred, setStarred] = useState(post.isBookmarked ?? false);
  const [starCount, setStarCount] = useState(post.favorites ?? 0);

  // ── Other UI state ────────────────────────────────────────────────────────
  const [isCopied, setIsCopied] = useState(false);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [viewCount, setViewCount] = useState(post.views);
  // ── More menu state ───────────────────────────────────────────────────────
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [reported, setReported] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);
  const articleRef = useRef<HTMLElement>(null);
  // Guards to avoid overwriting optimistic counts during in-flight requests
  const pendingLikeRef = useRef(false);
  const pendingStarRef = useRef(false);

  // Sync liked state when LikesContext bootstraps or changes.
  // Only trust likedIds — not post.isLiked — so stale feed data doesn't
  // override a user's unlike before the next poll catches up.
  useEffect(() => {
    if (!pendingLikeRef.current) {
      setLiked(likedIds.has(post.id));
    }
  }, [likedIds, post.id]);
  // Sync counts only from feed polls — not tied to likedIds changes
  useEffect(() => {
    if (!pendingLikeRef.current) setLikeCount(post.likes ?? 0);
  }, [post.likes]);
  useEffect(() => {
    if (!pendingStarRef.current) {
      setStarred(post.isBookmarked ?? false);
      setStarCount(post.favorites ?? 0);
    }
  }, [post.isBookmarked, post.favorites]);
  useEffect(() => {
    setCommentCount(post.comments);
  }, [post.comments]);

  // Track view via IntersectionObserver — only fires when post is actually visible,
  // and ViewsProvider will queue the request if the auth token isn't ready yet.
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackView(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id, trackView]);

  // If post was deleted by the current user, hide it
  if (deleted) return null;

  const typeConfig = postTypeConfig[post.type];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      const res = await fetch(`/api/post/${post.id}`, {
        method: "DELETE",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.ok) {
        setDeleted(true);
        setShowMoreMenu(false);
        window.dispatchEvent(new CustomEvent('lion:post-deleted', { detail: { postId: post.id } }));
      }
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      await fetch(`/api/post/${post.id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
    } catch {
      // silently fail
    }
    setReported(true);
    setTimeout(() => setShowMoreMenu(false), 1500);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url, title: "Check this out on Gains" });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;
    const newLiked = !prevLiked;

    // Optimistic update
    pendingLikeRef.current = true;
    setLiked(newLiked);
    setLikeCount(newLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    setIsAnimatingLike(true);
    setTimeout(() => setIsAnimatingLike(false), 300);
    onLike?.(post.id);

    if (isClientDemoMode) {
      setLikedId(post.id, newLiked);
      pendingLikeRef.current = false;
      return;
    }

    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      const res = await fetch(`/api/post/${post.id}/like`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) throw new Error("Like request failed");
      const data = await res.json();
      const serverLiked = !!data.liked;
      // If server disagrees with optimistic, reconcile count
      if (serverLiked !== newLiked) {
        setLiked(serverLiked);
        setLikeCount(serverLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
      }
      // Sync context — single write, no double-trigger
      setLikedId(post.id, serverLiked);
    } catch {
      // Revert optimistic update
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      pendingLikeRef.current = false;
    }
  };

  const handleSave = async () => {
    const prevStarred = starred;
    const prevCount = starCount;
    const newStarred = !prevStarred;

    // Optimistic update
    pendingStarRef.current = true;
    setStarred(newStarred);
    setStarCount(newStarred ? prevCount + 1 : Math.max(0, prevCount - 1));

    if (isClientDemoMode) {
      pendingStarRef.current = false;
      return;
    }

    try {
      const { data: { session } } = await createSupabaseBrowserClient().auth.getSession();
      const res = await fetch(`/api/post/${post.id}/save`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      const serverSaved = !!data.saved;
      // If server disagrees with optimistic, reconcile count
      if (serverSaved !== newStarred) {
        setStarred(serverSaved);
        setStarCount(serverSaved ? prevCount + 1 : Math.max(0, prevCount - 1));
      }
    } catch {
      // Revert
      setStarred(prevStarred);
      setStarCount(prevCount);
    } finally {
      pendingStarRef.current = false;
    }
  };

  // Unified click handler for the image area.
  // Single click → navigate to post detail (unless expanded/detail page).
  // Double click → like animation.
  const handleImageClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      const count = clickCountRef.current;
      clickCountRef.current = 0;
      clickTimerRef.current = null;
      if (count >= 2) {
        if (!liked) handleLike();
      } else if (!expanded) {
        setViewCount((prev) => prev + 1);
        router.push(`/post/${post.id}`);
      }
    }, 230);
  };

  // Determine if we show the image above type-specific content
  // Quotes never show a regular image (they have their own styled card)
  const showImage = post.image && post.type !== "quote";

  return (
    <article ref={articleRef} className="card-premium p-0 overflow-hidden animate-fade-in">
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
              <span className="text-xs text-lion-gray-3" suppressHydrationWarning>
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

          {/* More button + dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowMoreMenu((v) => !v); setShowDeleteConfirm(false); setShowReportOptions(false); }}
              className="p-1.5 rounded-lg text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl bg-lion-dark-2 border border-lion-gold/15 shadow-xl overflow-hidden">
                  {isOwnPost ? (
                    showDeleteConfirm ? (
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-lion-gray-3 text-center">Delete this post?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/90 text-white font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-lion-dark-3 text-lion-white font-semibold hover:bg-lion-dark-1 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete post
                      </button>
                    )
                  ) : (
                    reported ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gains-green">
                        <Check className="w-4 h-4" />
                        Reported — thank you
                      </div>
                    ) : showReportOptions ? (
                      <div className="py-1">
                        <p className="px-4 py-2 text-xs text-lion-gray-2 font-semibold uppercase tracking-wider">Report reason</p>
                        {["Spam", "Inappropriate content", "Harassment", "Misinformation"].map((reason) => (
                          <button
                            key={reason}
                            onClick={() => handleReport(reason)}
                            className="w-full text-left px-4 py-2.5 text-sm text-lion-gray-5 hover:bg-lion-dark-3 transition-colors"
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReportOptions(true)}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-lion-gray-5 hover:bg-lion-dark-3 transition-colors"
                      >
                        <Flag className="w-4 h-4" />
                        Report post
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Image (for workout, meal, story -- not quote) ───────────────── */}
      {showImage && (
        <div
          className="relative aspect-[4/3] bg-lion-dark-2 cursor-pointer"
          onClick={handleImageClick}
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
        <StoryContent data={post.storyData} expanded={expanded} />
      )}

      {/* ── Caption ─────────────────────────────────────────────────────── */}
      <div
        className={`px-4 pt-2 pb-2 ${!expanded ? "cursor-pointer" : ""}`}
        onClick={!expanded ? () => { setViewCount((prev) => prev + 1); router.push(`/post/${post.id}`); } : undefined}
      >
        <p className="text-sm text-lion-gray-5 leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>

        {/* Tags */}
        {(post.tags ?? []).length > 0 && (
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
          {formatCount(viewCount)} views
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
                liked
                  ? "text-lion-gold fill-lion-gold scale-110"
                  : "text-lion-gray-3 group-hover:text-lion-gold"
              } ${isAnimatingLike ? "animate-scale-in" : ""}`}
            />
            <span
              className={`text-xs font-medium ${
                liked ? "text-lion-gold" : "text-lion-gray-3"
              }`}
            >
              {formatCount(likeCount)}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle
              className={`w-5 h-5 transition-colors duration-200 ${
                showComments
                  ? "text-lion-white"
                  : "text-lion-gray-3 group-hover:text-lion-white"
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                showComments ? "text-lion-white" : "text-lion-gray-3 group-hover:text-lion-white"
              }`}
            >
              {formatCount(commentCount)}
            </span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex items-center gap-1.5 group">
            <Share2
              className={`w-5 h-5 transition-colors duration-200 ${
                isCopied ? "text-lion-gold" : "text-lion-gray-3 group-hover:text-lion-white"
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                isCopied ? "text-lion-gold" : "text-lion-gray-3 group-hover:text-lion-white"
              }`}
            >
              {isCopied ? "Copied!" : formatCount(post.shares)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Favorite / Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 group"
          >
            <Star
              className={`w-5 h-5 transition-all duration-200 ${
                starred
                  ? "text-yellow-400 fill-yellow-400 scale-110"
                  : "text-lion-gray-3 group-hover:text-yellow-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                starred ? "text-yellow-400" : "text-lion-gray-3"
              }`}
            >
              {formatCount(starCount)}
            </span>
          </button>
        </div>
      </div>

      {/* ── Inline Comments ──────────────────────────────────────────────── */}
      {showComments && !expanded && (
        <InlineComments
          postId={post.id}
          initialCount={commentCount}
          onCountChange={setCommentCount}
        />
      )}
    </article>
  );
}
