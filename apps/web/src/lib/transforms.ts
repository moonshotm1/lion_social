import type { MockPost, MockUser, WorkoutData, MealData, QuoteData, StoryData } from "./types";

/**
 * Transform a tRPC post response into the MockPost shape that components expect.
 */
export function transformPost(apiPost: any): MockPost {
  const metadata = (apiPost.metadata as Record<string, any>) ?? {};

  return {
    id: apiPost.id,
    type: apiPost.type,
    caption: apiPost.caption,
    image: apiPost.imageUrl ?? undefined,
    createdAt:
      apiPost.createdAt instanceof Date
        ? apiPost.createdAt.toISOString()
        : apiPost.createdAt,
    author: transformUser(apiPost.user),
    likes: apiPost._count?.likes ?? 0,
    comments: apiPost._count?.comments ?? 0,
    shares: 0,
    views: apiPost.viewCount ?? 0,
    favorites: apiPost._count?.saves ?? 0,
    isLiked: Array.isArray(apiPost.likes) && apiPost.likes.length > 0,
    isFavorited: false,
    isBookmarked: Array.isArray(apiPost.saves) && apiPost.saves.length > 0,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    workoutData:
      apiPost.type === "workout"
        ? ({
            ...metadata,
            exercises: Array.isArray(metadata.exercises)
              ? metadata.exercises.map((ex: any) => ({
                  ...ex,
                  sets: Array.isArray(ex?.sets) ? ex.sets : [],
                }))
              : [],
          } as WorkoutData)
        : undefined,
    mealData:
      apiPost.type === "meal"
        ? ({
            ...metadata,
            ingredients: Array.isArray(metadata.ingredients)
              ? metadata.ingredients
              : [],
            macros: metadata.macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
          } as MealData)
        : undefined,
    quoteData: apiPost.type === "quote" ? (metadata as QuoteData) : undefined,
    storyData:
      apiPost.type === "story"
        ? ({
            ...metadata,
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          } as StoryData)
        : undefined,
  };
}

/**
 * Transform a tRPC user response into the MockUser shape that components expect.
 */
export function transformUser(apiUser: any): MockUser {
  return {
    id: apiUser.id,
    username: apiUser.username,
    displayName: apiUser.username,
    avatar:
      apiUser.avatarUrl ??
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${apiUser.username}`,
    bio: apiUser.bio ?? "",
    followers: apiUser._count?.followers ?? 0,
    following: apiUser._count?.following ?? 0,
    posts: apiUser._count?.posts ?? 0,
    isVerified: false,
  };
}
