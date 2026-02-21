export type PostType = "workout" | "meal" | "quote" | "story";

// ─── User Types ────────────────────────────────────────────────────────────

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

// ─── Structured Post Data Types ────────────────────────────────────────────

export interface Exercise {
  name: string;
  sets: { reps: number; weight: number; unit: "lbs" | "kg" }[];
}

export interface WorkoutData {
  title: string;
  exercises: Exercise[];
  duration: number; // minutes
}

export interface MealData {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients: { name: string; amount: string }[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

export interface QuoteData {
  text: string;
  author: string;
}

export interface StoryData {
  title: string;
  content: string;
  tags: string[];
}

// ─── Post Type ─────────────────────────────────────────────────────────────

export interface MockPost {
  id: string;
  type: PostType;
  caption: string;
  image?: string;
  createdAt: string;
  author: MockUser;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isFavorited: boolean;
  tags: string[];
  // Type-specific data
  workoutData?: WorkoutData;
  mealData?: MealData;
  quoteData?: QuoteData;
  storyData?: StoryData;
}

// ─── Notification Type ─────────────────────────────────────────────────────

export interface MockNotification {
  id: string;
  type: "like" | "comment" | "follow" | "mention";
  user: MockUser;
  message: string;
  createdAt: string;
  read: boolean;
  postId?: string;
}

// ─── Mock Users ────────────────────────────────────────────────────────────

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    username: "marcus_iron",
    displayName: "Marcus Iron",
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=marcus&backgroundColor=b6e3f4",
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
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=elena&backgroundColor=ffd5dc",
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
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=king&backgroundColor=c0aede",
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
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=ava&backgroundColor=d1d4f9",
    bio: "Marathon runner. 3:12 PR. Chasing sunrises and personal bests. Boston 2025 qualifier.",
    followers: 3200,
    following: 445,
    posts: 156,
    isVerified: false,
  },
];

// ─── Mock Posts (8 total, 2 per type) ──────────────────────────────────────

export const mockPosts: MockPost[] = [
  // ── Workout 1: Leg Day ───────────────────────────────────────────────────
  {
    id: "post-1",
    author: mockUsers[0],
    type: "workout",
    caption:
      "Absolutely destroyed legs today. That last set of squats had me questioning life choices but we do not quit. The grind continues. #LegDay #NeverSkip",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
    likes: 847,
    comments: 92,
    shares: 34,
    views: 5240,
    isLiked: false,
    isFavorited: false,
    createdAt: "2024-08-15T10:30:00Z",
    tags: ["legday", "squats", "powerlifting"],
    workoutData: {
      title: "Leg Day",
      exercises: [
        {
          name: "Barbell Squat",
          sets: [
            { reps: 12, weight: 185, unit: "lbs" },
            { reps: 10, weight: 205, unit: "lbs" },
            { reps: 8, weight: 225, unit: "lbs" },
            { reps: 6, weight: 245, unit: "lbs" },
          ],
        },
        {
          name: "Romanian Deadlift",
          sets: [
            { reps: 12, weight: 155, unit: "lbs" },
            { reps: 10, weight: 175, unit: "lbs" },
            { reps: 10, weight: 175, unit: "lbs" },
          ],
        },
        {
          name: "Leg Press",
          sets: [
            { reps: 15, weight: 360, unit: "lbs" },
            { reps: 12, weight: 400, unit: "lbs" },
            { reps: 10, weight: 450, unit: "lbs" },
          ],
        },
      ],
      duration: 65,
    },
  },

  // ── Meal 1: Post-Workout Protein Bowl ────────────────────────────────────
  {
    id: "post-2",
    author: mockUsers[1],
    type: "meal",
    caption:
      "Refueling after a solid session. This bowl hits every macro target and tastes incredible. Eating clean is an act of self-respect.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
    likes: 623,
    comments: 45,
    shares: 78,
    views: 3891,
    isLiked: true,
    isFavorited: true,
    createdAt: "2024-08-15T08:15:00Z",
    tags: ["mealprep", "nutrition", "postworkout"],
    mealData: {
      name: "Post-Workout Protein Bowl",
      mealType: "lunch",
      ingredients: [
        { name: "Grilled Chicken Breast", amount: "6 oz" },
        { name: "Brown Rice", amount: "1 cup" },
        { name: "Steamed Broccoli", amount: "1 cup" },
        { name: "Avocado", amount: "1/2" },
      ],
      macros: { calories: 650, protein: 45, carbs: 60, fat: 22 },
    },
  },

  // ── Quote 1: Ralph Waldo Emerson ─────────────────────────────────────────
  {
    id: "post-3",
    author: mockUsers[2],
    type: "quote",
    caption:
      "Let this one sit with you today. You are not a victim of circumstance -- you are the architect of your destiny. Every single day is a new chance to build the life you envision.",
    likes: 3241,
    comments: 287,
    shares: 512,
    views: 18700,
    isLiked: false,
    isFavorited: false,
    createdAt: "2024-08-14T22:00:00Z",
    tags: ["mindset", "motivation", "emerson"],
    quoteData: {
      text: "The only person you are destined to become is the person you decide to be.",
      author: "Ralph Waldo Emerson",
    },
  },

  // ── Story 1: 6-Month Transformation ──────────────────────────────────────
  {
    id: "post-4",
    author: mockUsers[3],
    type: "story",
    caption:
      "Sharing my journey because someone out there needs to hear this today. If you are at the beginning, keep going.",
    image:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop",
    likes: 1892,
    comments: 234,
    shares: 156,
    views: 9430,
    isLiked: true,
    isFavorited: false,
    createdAt: "2024-08-14T16:45:00Z",
    tags: ["transformation", "discipline", "progress"],
    storyData: {
      title: "My 6-Month Transformation",
      content:
        "Six months ago I could barely climb a flight of stairs without losing my breath. I weighed 240 pounds, my confidence was at rock bottom, and I had convinced myself that getting fit was something other people did -- not me. Then one morning something clicked. I laced up a pair of old sneakers, walked into a gym for the first time in years, and made a deal with myself: just show up. That was it. No crazy diet, no impossible plan -- just show up every single day. Fast forward to today: I have lost 45 pounds, I deadlift 315 for reps, and I ran my first 5K last weekend. The weight on the scale changed, sure, but what really transformed was my mind. Discipline replaced doubt. Consistency beat motivation. And every day I wake up knowing I am capable of more than I ever imagined.",
      tags: ["transformation", "discipline", "progress"],
    },
  },

  // ── Workout 2: Push Day ──────────────────────────────────────────────────
  {
    id: "post-5",
    author: mockUsers[0],
    type: "workout",
    caption:
      "Push day volume work. Chasing the pump today -- chest and shoulders are screaming. The pump is temporary, the discipline is permanent. #PushDay #ChestDay",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop",
    likes: 567,
    comments: 43,
    shares: 21,
    views: 2810,
    isLiked: false,
    isFavorited: false,
    createdAt: "2024-08-13T14:20:00Z",
    tags: ["pushday", "chest", "shoulders"],
    workoutData: {
      title: "Push Day",
      exercises: [
        {
          name: "Bench Press",
          sets: [
            { reps: 10, weight: 185, unit: "lbs" },
            { reps: 8, weight: 205, unit: "lbs" },
            { reps: 6, weight: 225, unit: "lbs" },
            { reps: 6, weight: 225, unit: "lbs" },
          ],
        },
        {
          name: "Overhead Press",
          sets: [
            { reps: 10, weight: 95, unit: "lbs" },
            { reps: 8, weight: 105, unit: "lbs" },
            { reps: 8, weight: 105, unit: "lbs" },
          ],
        },
        {
          name: "Dips",
          sets: [
            { reps: 12, weight: 45, unit: "lbs" },
            { reps: 10, weight: 45, unit: "lbs" },
            { reps: 10, weight: 45, unit: "lbs" },
          ],
        },
      ],
      duration: 55,
    },
  },

  // ── Meal 2: Morning Fuel Smoothie ────────────────────────────────────────
  {
    id: "post-6",
    author: mockUsers[1],
    type: "meal",
    caption:
      "Morning ritual that never gets old. Blend, pour, conquer the day. What you put in determines what you get out.",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&h=600&fit=crop",
    likes: 412,
    comments: 38,
    shares: 45,
    views: 2190,
    isLiked: false,
    isFavorited: true,
    createdAt: "2024-08-13T07:00:00Z",
    tags: ["smoothie", "breakfast", "fuel"],
    mealData: {
      name: "Morning Fuel Smoothie",
      mealType: "breakfast",
      ingredients: [
        { name: "Banana", amount: "1 large" },
        { name: "Whey Protein Powder", amount: "1 scoop" },
        { name: "Rolled Oats", amount: "1/2 cup" },
        { name: "Almond Milk", amount: "1 cup" },
      ],
      macros: { calories: 420, protein: 35, carbs: 48, fat: 10 },
    },
  },

  // ── Quote 2: Abraham Lincoln ─────────────────────────────────────────────
  {
    id: "post-7",
    author: mockUsers[2],
    type: "quote",
    caption:
      "Read this twice. The snooze button, the junk food, the shortcuts -- they feel good in the moment but cost you everything in the long run. Choose discipline over comfort.",
    likes: 2187,
    comments: 198,
    shares: 341,
    views: 12500,
    isLiked: true,
    isFavorited: false,
    createdAt: "2024-08-12T20:00:00Z",
    tags: ["discipline", "motivation", "lincoln"],
    quoteData: {
      text: "Discipline is choosing between what you want now and what you want most.",
      author: "Abraham Lincoln",
    },
  },

  // ── Story 2: Running and Mental Health ───────────────────────────────────
  {
    id: "post-8",
    author: mockUsers[3],
    type: "story",
    caption:
      "Writing this for anyone who is struggling right now. Movement is medicine. It saved me and it can help you too.",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop",
    likes: 1456,
    comments: 312,
    shares: 189,
    views: 7620,
    isLiked: false,
    isFavorited: false,
    createdAt: "2024-08-12T12:30:00Z",
    tags: ["running", "mental-health", "journey"],
    storyData: {
      title: "How Running Saved My Mental Health",
      content:
        "Two years ago I was drowning in anxiety. Panic attacks at work, sleepless nights, a constant weight on my chest that never seemed to lift. My therapist suggested I try running -- not to get fit, just to move. I thought she was crazy. I hated running. But I was desperate enough to try anything. The first run was miserable: half a mile at a shuffle pace, lungs burning, legs like lead. But something strange happened when I got home. For the first time in months, the noise in my head was quiet. So I went again the next day. And the next. Slowly the half mile became one mile, then three, then ten. As the miles grew, the anxiety shrank. Running gave me something medication alone never could -- proof that I was strong enough to endure discomfort and come out the other side. Today I run ultramarathons, and each finish line reminds me how far I have come, not just in distance, but in life.",
      tags: ["running", "mental-health", "journey"],
    },
  },
];

// ─── Mock Notifications ────────────────────────────────────────────────────

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

// ─── Helper Functions ──────────────────────────────────────────────────────

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
