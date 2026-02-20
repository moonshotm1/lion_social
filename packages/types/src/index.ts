// ── Post Types ──
export type PostType = "workout" | "meal" | "quote" | "story";

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  caption: string;
  imageUrl: string | null;
  createdAt: Date;
  user: UserProfile;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

// ── User Types ──
export interface UserProfile {
  id: string;
  supabaseId: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface UserStats {
  totalWorkouts: number;
  streakDays: number;
  totalPosts: number;
}

// ── Comment Types ──
export interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
  user: Pick<UserProfile, "id" | "username" | "avatarUrl">;
}

// ── Notification Types ──
export type NotificationType = "follow" | "like" | "comment";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  referenceId: string;
  read: boolean;
  createdAt: Date;
  actor?: Pick<UserProfile, "id" | "username" | "avatarUrl">;
}

// ── API Input Types ──
export interface CreatePostInput {
  type: PostType;
  caption: string;
  imageUrl?: string;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface FeedQuery {
  cursor?: string;
  limit?: number;
}
