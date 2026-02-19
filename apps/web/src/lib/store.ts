import { create } from "zustand";
import type { MockUser, MockPost, PostType } from "./mock-data";

// ─── User Store ─────────────────────────────────────────────────────────────

interface UserState {
  user: MockUser | null;
  isAuthenticated: boolean;
  setUser: (user: MockUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));

// ─── Feed Store ─────────────────────────────────────────────────────────────

interface FeedState {
  posts: MockPost[];
  isLoading: boolean;
  cursor: string | null;
  hasMore: boolean;
  activeFilter: PostType | "all";
  setPosts: (posts: MockPost[]) => void;
  addPosts: (posts: MockPost[]) => void;
  setLoading: (loading: boolean) => void;
  setCursor: (cursor: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setActiveFilter: (filter: PostType | "all") => void;
  toggleLike: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  cursor: null,
  hasMore: true,
  activeFilter: "all",
  setPosts: (posts) => set({ posts }),
  addPosts: (newPosts) =>
    set((state) => ({ posts: [...state.posts, ...newPosts] })),
  setLoading: (isLoading) => set({ isLoading }),
  setCursor: (cursor) => set({ cursor }),
  setHasMore: (hasMore) => set({ hasMore }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      ),
    })),
}));

// ─── UI Store ───────────────────────────────────────────────────────────────

type FeedTab = "following" | "explore";

interface UIState {
  activeTab: FeedTab;
  isSidebarOpen: boolean;
  isCreateModalOpen: boolean;
  setActiveTab: (tab: FeedTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCreateModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "following",
  isSidebarOpen: false,
  isCreateModalOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
}));
