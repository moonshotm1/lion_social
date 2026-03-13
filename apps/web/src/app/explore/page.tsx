"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Dumbbell,
  Salad,
  Quote,
  BookOpen,
  X,
  UserPlus,
  Plus,
} from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { transformPost } from "@/lib/transforms";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts, mockUsers } from "@/lib/mock-data";
import type { MockPost, PostType } from "@/lib/types";
import { CreateStoryModal } from "@/components/stories/create-story-modal";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryItem } from "@/components/stories/story-viewer";

type CategoryTab = "all" | PostType;

const categories: { id: CategoryTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "workout", label: "Workouts", icon: Dumbbell },
  { id: "meal", label: "Meals", icon: Salad },
  { id: "quote", label: "Quotes", icon: Quote },
  { id: "story", label: "Stories", icon: BookOpen },
];

// ─── Stories Bar ────────────────────────────────────────────────────────────

interface FollowUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

function StoriesBar({ currentUserId, currentUsername, currentAvatarUrl }: {
  currentUserId?: string;
  currentUsername?: string;
  currentAvatarUrl?: string | null;
}) {
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerStories, setViewerStories] = useState<StoryItem[] | null>(null);
  const [storiesVersion, setStoriesVersion] = useState(0);

  // Fetch following users
  useEffect(() => {
    if (isClientDemoMode) {
      setFollowing(mockUsers.slice(0, 8).map((u) => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatar,
      })));
      return;
    }
    if (!currentUserId) return;
    fetch(`/api/user/connections?userId=${encodeURIComponent(currentUserId)}&type=following`)
      .then((r) => r.json())
      .then((data) => setFollowing(data.users ?? []))
      .catch(() => {});
  }, [currentUserId]);

  // Fetch active stories for following users (+ self)
  useEffect(() => {
    if (isClientDemoMode) return;
    const userIds = [
      ...(currentUserId ? [currentUserId] : []),
      ...following.map((u) => u.id),
    ];
    if (userIds.length === 0) return;
    fetch(`/api/stories?userIds=${encodeURIComponent(userIds.join(","))}`)
      .then((r) => r.json())
      .then((data) => setStories(data.stories ?? []))
      .catch(() => {});
  }, [following, currentUserId, storiesVersion]);

  // Group stories by userId
  const storiesByUser = new Map<string, StoryItem[]>();
  for (const s of stories) {
    const arr = storiesByUser.get(s.userId) ?? [];
    arr.push(s);
    storiesByUser.set(s.userId, arr);
  }

  const hasAnyContent = currentUserId || following.length > 0;
  if (!hasAnyContent) return null;

  const ownAvatar =
    currentAvatarUrl ??
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${currentUsername ?? "me"}`;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-4 -mx-4 px-4 scrollbar-none border-b border-lion-gold/8">
        {/* Own story slot */}
        {currentUserId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-lion-gold/20 group-hover:ring-lion-gold/50 transition-all duration-300">
                <Image
                  src={ownAvatar}
                  alt={currentUsername ?? "me"}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-lion-gold border-2 border-lion-black flex items-center justify-center">
                <Plus className="w-3 h-3 text-lion-black" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] text-lion-gray-3 max-w-[56px] truncate text-center group-hover:text-lion-gold transition-colors duration-200">
              Your story
            </span>
          </button>
        )}

        {/* Following users with stories */}
        {following.map((user) => {
          const userStories = storiesByUser.get(user.id);
          const hasStory = !!userStories && userStories.length > 0;
          const avatar =
            user.avatarUrl ??
            `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;

          if (!hasStory && !isClientDemoMode) return null;

          return (
            <button
              key={user.id}
              onClick={() => {
                if (userStories && userStories.length > 0) {
                  setViewerStories(userStories);
                }
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div
                className={`w-14 h-14 rounded-full overflow-hidden p-0.5 transition-all duration-300 ${
                  hasStory
                    ? "ring-2 ring-lion-gold animate-pulse-ring bg-gradient-to-br from-lion-gold to-lion-gold/50"
                    : "ring-2 ring-lion-gold/20 group-hover:ring-lion-gold/40 bg-gradient-to-br from-lion-dark-2 to-lion-dark-3"
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={avatar}
                    alt={user.username}
                    width={52}
                    height={52}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] text-lion-gray-3 max-w-[56px] truncate text-center group-hover:text-lion-gold transition-colors duration-200">
                {user.username}
              </span>
            </button>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setStoriesVersion((v) => v + 1)}
        />
      )}

      {viewerStories && (
        <StoryViewer
          stories={viewerStories}
          onClose={() => setViewerStories(null)}
        />
      )}
    </>
  );
}

// ─── Search Results ──────────────────────────────────────────────────────────

interface SearchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

function SearchResults({ query }: { query: string }) {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      if (isClientDemoMode) {
        const filtered = mockUsers
          .filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
          .map((u) => ({ id: u.id, username: u.username, avatarUrl: u.avatar, bio: u.bio }));
        if (!cancelled) { setUsers(filtered); setLoading(false); }
        return;
      }
      fetch(`/api/user/search?q=${encodeURIComponent(query)}&limit=8`)
        .then((r) => r.json())
        .then((data) => { if (!cancelled) { setUsers(data.users ?? []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }, 280);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
      </div>
    );
  }

  if (users.length === 0 && query.trim()) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-sm font-semibold text-lion-white">No users found</p>
        <p className="text-xs text-lion-gray-3">Try a different username</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      <p className="text-xs text-lion-gray-3 font-medium uppercase tracking-wider px-1 mb-3">
        People
      </p>
      {users.map((user) => {
        const avatar =
          user.avatarUrl ??
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;
        return (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-lion-dark-2 border border-lion-gold/5 hover:border-lion-gold/20 transition-all duration-200 group"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-lion-gold/15 group-hover:ring-lion-gold/35 transition-all duration-300 shrink-0">
              <Image
                src={avatar}
                alt={user.username}
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-lion-white group-hover:text-lion-gold transition-colors duration-200 truncate">
                @{user.username}
              </p>
              {user.bio && (
                <p className="text-xs text-lion-gray-3 truncate mt-0.5">{user.bio}</p>
              )}
            </div>
            <UserPlus className="w-4 h-4 text-lion-gray-3 group-hover:text-lion-gold transition-colors duration-200 shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const { user: currentUser } = useCurrentUser();

  const loadPosts = useCallback(
    async (pageNum: number, resetList: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setIsLoading(true);
      try {
        if (isClientDemoMode) {
          const filtered =
            activeCategory === "all"
              ? mockPosts
              : mockPosts.filter((p) => p.type === activeCategory);
          setPosts(filtered);
          setHasMore(false);
          return;
        }
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const params = new URLSearchParams({ tab: "explore", page: String(pageNum) });
        if (activeCategory !== "all") params.set("type", activeCategory);
        const res = await fetch(`/api/feed?${params}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const data = await res.json();
        const newPosts = (data.posts ?? []).map(transformPost);
        setPosts((prev) => (resetList ? newPosts : [...prev, ...newPosts]));
        setHasMore(newPosts.length === 20);
      } catch (err) {
        console.error("[explore] loadPosts error:", err);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [activeCategory]
  );

  // Initial load + reload on category change
  useEffect(() => {
    setPage(0);
    loadPosts(0, true);
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load next page when page number increments (not on first render)
  const isFirstPage = useRef(true);
  useEffect(() => {
    if (isFirstPage.current) { isFirstPage.current = false; return; }
    if (page > 0) loadPosts(page, false);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const showSearch = searchQuery.trim().length > 0;

  return (
    <div className="animate-fade-in">
      {/* ── Sticky Header: Search + Pills ─────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-lion-black/90 backdrop-blur-xl pt-4 pb-3 -mx-4 px-4 border-b border-lion-gold/8">
        {/* Search bar */}
        <div className="relative mb-3">
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
            placeholder="Search people..."
            className="w-full bg-lion-dark-2 border border-lion-gold/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 focus:ring-1 focus:ring-lion-gold/20 transition-all duration-200"
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

        {/* Category pills */}
        {!showSearch && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap shrink-0
                    text-xs font-semibold border transition-all duration-200
                    ${
                      isActive
                        ? "bg-lion-gold text-lion-black border-lion-gold"
                        : "bg-lion-dark-2 text-lion-gray-3 border-lion-gold/10 hover:border-lion-gold/30 hover:text-lion-white"
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="space-y-0">
        {showSearch ? (
          /* Search mode */
          <div className="pt-4">
            <SearchResults query={searchQuery} />
          </div>
        ) : (
          <>
            {/* Stories bar */}
            <StoriesBar
              currentUserId={currentUser?.id}
              currentUsername={currentUser?.username}
              currentAvatarUrl={currentUser?.avatar}
            />

            {/* Post feed */}
            <div className="space-y-5 pt-5">
              {posts.length === 0 && !isLoading ? (
                <div className="text-center py-20">
                  <p className="text-sm text-lion-gray-3">No posts yet in this category</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />

              {/* End of feed */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-lion-gray-2 font-medium">
                    You&apos;re all caught up
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
