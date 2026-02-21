import type { MockPost, MockUser } from "./types";

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
    views: 0,
    isLiked: false,
    isFavorited: false,
    tags: metadata.tags ?? [],
    workoutData: apiPost.type === "workout" ? metadata : undefined,
    mealData: apiPost.type === "meal" ? metadata : undefined,
    quoteData: apiPost.type === "quote" ? metadata : undefined,
    storyData: apiPost.type === "story" ? metadata : undefined,
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
