import { create } from "zustand";
import {
  MOCK_POSTS,
  MOCK_USERS,
  MOCK_NOTIFICATIONS,
  type MockPost,
  type MockUser,
  type MockNotification,
} from "../constants/mock-data";

// ── Auth State ──────────────────────────────────────────────────────────

interface AuthState {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: MockUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USERS[0], // Default to first mock user for dev
  isAuthenticated: true,
  isLoading: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ── Feed State ──────────────────────────────────────────────────────────

interface FeedState {
  posts: MockPost[];
  isRefreshing: boolean;
  feedTab: "following" | "explore";
  setPosts: (posts: MockPost[]) => void;
  addPost: (post: MockPost) => void;
  toggleLike: (postId: string) => void;
  setFeedTab: (tab: "following" | "explore") => void;
  setRefreshing: (refreshing: boolean) => void;
  refreshFeed: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: MOCK_POSTS,
  isRefreshing: false,
  feedTab: "following",
  setPosts: (posts) => set({ posts }),
  addPost: (post) =>
    set((state) => ({ posts: [post, ...state.posts] })),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked
                ? p.likesCount - 1
                : p.likesCount + 1,
            }
          : p
      ),
    })),
  setFeedTab: (feedTab) => set({ feedTab }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  refreshFeed: () =>
    set({ posts: [...MOCK_POSTS], isRefreshing: false }),
}));

// ── Notifications State ─────────────────────────────────────────────────

interface NotificationsState {
  notifications: MockNotification[];
  unreadCount: number;
  setNotifications: (notifications: MockNotification[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>(
  (set) => ({
    notifications: MOCK_NOTIFICATIONS,
    unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length,
    setNotifications: (notifications) =>
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      }),
    markAllRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      })),
    markRead: (id) =>
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      }),
  })
);

// ── Create Post State ───────────────────────────────────────────────────

interface CreatePostState {
  selectedType: "workout" | "meal" | "quote" | "story" | null;
  caption: string;
  imageUri: string | null;
  isSubmitting: boolean;
  setSelectedType: (
    type: "workout" | "meal" | "quote" | "story" | null
  ) => void;
  setCaption: (caption: string) => void;
  setImageUri: (uri: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
  selectedType: null,
  caption: "",
  imageUri: null,
  isSubmitting: false,
  setSelectedType: (selectedType) => set({ selectedType }),
  setCaption: (caption) => set({ caption }),
  setImageUri: (imageUri) => set({ imageUri }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () =>
    set({
      selectedType: null,
      caption: "",
      imageUri: null,
      isSubmitting: false,
    }),
}));
