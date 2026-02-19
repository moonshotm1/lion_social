export type PostType = "workout" | "meal" | "quote" | "story";

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
}

export interface MockPost {
  id: string;
  author: MockUser;
  type: PostType;
  caption: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  tags: string[];
}

export interface MockNotification {
  id: string;
  type: "like" | "comment" | "follow" | "mention";
  user: MockUser;
  message: string;
  createdAt: string;
  read: boolean;
  postId?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    username: "marcus_iron",
    displayName: "Marcus Iron",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=marcus&backgroundColor=b6e3f4",
    bio: "Discipline is the bridge between goals and accomplishment. Powerlifter. Coach. Relentless.",
    followers: 12400,
    following: 342,
    posts: 287,
    isVerified: true,
  },
  {
    id: "user-2",
    username: "elena_vitality",
    displayName: "Elena Vitality",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=elena&backgroundColor=ffd5dc",
    bio: "Plant-based nutrition coach. Yoga practitioner. Your body is your temple -- nourish it.",
    followers: 8900,
    following: 567,
    posts: 412,
    isVerified: true,
  },
  {
    id: "user-3",
    username: "king_mindset",
    displayName: "King Mindset",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=king&backgroundColor=c0aede",
    bio: "Mental wellness advocate. Author of 'The Crown Within'. Speaking truth to power daily.",
    followers: 45200,
    following: 89,
    posts: 1024,
    isVerified: true,
  },
  {
    id: "user-4",
    username: "ava_runs",
    displayName: "Ava Chen",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=ava&backgroundColor=d1d4f9",
    bio: "Marathon runner. 3:12 PR. Chasing sunrises and personal bests. Boston 2025 qualifier.",
    followers: 3200,
    following: 445,
    posts: 156,
    isVerified: false,
  },
];

export const mockPosts: MockPost[] = [
  {
    id: "post-1",
    author: mockUsers[0],
    type: "workout",
    caption:
      "New deadlift PR: 545 lbs. Six months of grinding, zero shortcuts. Remember -- the iron never lies. It will humble you and build you in equal measure. Keep showing up. #NeverSettle #IronTherapy",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
    likes: 847,
    comments: 92,
    shares: 34,
    isLiked: false,
    createdAt: "2024-08-15T10:30:00Z",
    tags: ["deadlift", "powerlifting", "pr"],
  },
  {
    id: "post-2",
    author: mockUsers[1],
    type: "meal",
    caption:
      "Rainbow buddha bowl to fuel the afternoon session. Quinoa base, roasted sweet potato, avocado, purple cabbage, edamame, and a turmeric tahini dressing. Eating clean is an act of self-respect.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
    likes: 623,
    comments: 45,
    shares: 78,
    isLiked: true,
    createdAt: "2024-08-15T08:15:00Z",
    tags: ["plantbased", "nutrition", "mealprep"],
  },
  {
    id: "post-3",
    author: mockUsers[2],
    type: "quote",
    caption:
      '"The lion does not turn around when a small dog barks." -- African Proverb\n\nStop letting distractions steal your focus. Your mission is bigger than their noise. Stay locked in. Stay dangerous. The world bends for those who refuse to break.',
    likes: 3241,
    comments: 287,
    shares: 512,
    isLiked: false,
    createdAt: "2024-08-14T22:00:00Z",
    tags: ["mindset", "motivation", "focus"],
  },
  {
    id: "post-4",
    author: mockUsers[3],
    type: "story",
    caption:
      "A year ago today I could barely run a mile without stopping. This morning I completed my first marathon in 3:42. Every early morning, every sore muscle, every moment of doubt was worth it. If you are at the beginning of your journey, hear me: you are closer than you think. Keep going.",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop",
    likes: 1892,
    comments: 234,
    shares: 156,
    isLiked: true,
    createdAt: "2024-08-14T16:45:00Z",
    tags: ["marathon", "transformation", "journey"],
  },
  {
    id: "post-5",
    author: mockUsers[0],
    type: "workout",
    caption:
      "Upper body hypertrophy day. Volume is king when you are chasing size. 5x12 bench, 4x15 rows, 3x20 lateral raises. Finished with 100 band pull-aparts. The pump is temporary, the discipline is permanent.",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop",
    likes: 567,
    comments: 43,
    shares: 21,
    isLiked: false,
    createdAt: "2024-08-13T14:20:00Z",
    tags: ["hypertrophy", "chest", "gains"],
  },
  {
    id: "post-6",
    author: mockUsers[1],
    type: "meal",
    caption:
      "Pre-workout fuel: overnight oats with blueberries, almond butter, chia seeds, and a drizzle of raw honey. Simple. Clean. Powerful. What you put in determines what you get out.",
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&h=600&fit=crop",
    likes: 412,
    comments: 38,
    shares: 45,
    isLiked: false,
    createdAt: "2024-08-13T07:00:00Z",
    tags: ["overnightoats", "preworkout", "fuel"],
  },
];

export const mockNotifications: MockNotification[] = [
  {
    id: "notif-1",
    type: "like",
    user: mockUsers[2],
    message: "liked your workout post",
    createdAt: "2024-08-15T11:00:00Z",
    read: false,
    postId: "post-1",
  },
  {
    id: "notif-2",
    type: "follow",
    user: mockUsers[3],
    message: "started following you",
    createdAt: "2024-08-15T09:30:00Z",
    read: false,
  },
  {
    id: "notif-3",
    type: "comment",
    user: mockUsers[1],
    message: 'commented on your post: "Amazing progress! Keep it up"',
    createdAt: "2024-08-14T20:15:00Z",
    read: true,
    postId: "post-1",
  },
  {
    id: "notif-4",
    type: "like",
    user: mockUsers[0],
    message: "liked your meal post",
    createdAt: "2024-08-14T18:45:00Z",
    read: true,
    postId: "post-2",
  },
  {
    id: "notif-5",
    type: "mention",
    user: mockUsers[2],
    message: "mentioned you in a comment",
    createdAt: "2024-08-14T14:20:00Z",
    read: true,
    postId: "post-3",
  },
];

export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export const postTypeConfig: Record<
  PostType,
  { label: string; color: string; bgColor: string; emoji: string }
> = {
  workout: {
    label: "Workout",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    emoji: "💪",
  },
  meal: {
    label: "Meal",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    emoji: "🥗",
  },
  quote: {
    label: "Quote",
    color: "text-lion-gold",
    bgColor: "bg-lion-gold/10",
    emoji: "💬",
  },
  story: {
    label: "Story",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    emoji: "📖",
  },
};
