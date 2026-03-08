export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = req.nextUrl;
  const tab = searchParams.get("tab") ?? "explore";
  const type = searchParams.get("type");

  // Resolve current user — try Authorization header first, then cookie session
  let currentUserId: string | null = null;
  try {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: appUser } = await supabase
          .from("User")
          .select("id")
          .eq("supabaseId", user.id)
          .single();
        currentUserId = (appUser as any)?.id ?? null;
      }
    }
  } catch {
    // Auth resolution is optional — continue as unauthenticated
  }

  try {
    // For "following" tab, get the list of users the current user follows
    let followingUserIds: string[] | null = null;
    if (tab === "following") {
      if (!currentUserId) return NextResponse.json({ posts: [] });

      const { data: follows } = await supabase
        .from("Follow")
        .select("followingId")
        .eq("followerId", currentUserId);

      followingUserIds = (follows ?? []).map((f: any) => f.followingId);
      if (followingUserIds.length === 0) return NextResponse.json({ posts: [] });
    }

    // Fetch posts
    let postQuery = supabase
      .from("Post")
      .select("id, caption, imageUrl, type, createdAt, viewCount, userId, metadata")
      .order("createdAt", { ascending: false })
      .limit(20);

    if (type && type !== "all") {
      postQuery = postQuery.eq("type", type);
    }
    if (followingUserIds) {
      postQuery = postQuery.in("userId", followingUserIds);
    }

    const { data: posts, error } = await postQuery;
    if (error) {
      console.error("[feed] Post query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!posts || posts.length === 0) return NextResponse.json({ posts: [] });

    const postIds = (posts as any[]).map((p) => p.id);
    const userIds = Array.from(new Set((posts as any[]).map((p) => p.userId)));

    // Batch-fetch users, likes, comments
    const [{ data: users }, { data: likes }, { data: comments }] =
      await Promise.all([
        supabase
          .from("User")
          .select("id, username, avatarUrl")
          .in("id", userIds),
        supabase
          .from("Like")
          .select("postId, userId")
          .in("postId", postIds),
        supabase
          .from("Comment")
          .select("postId")
          .in("postId", postIds),
      ]);

    console.log("[feed] userIds to fetch:", userIds);
    console.log("[feed] users returned:", users?.length, JSON.stringify(users?.[0]));

    const userMap: Record<string, any> = Object.fromEntries(
      (users ?? []).map((u: any) => [u.id, u])
    );

    const likeCountMap: Record<string, number> = {};
    const userLikedSet = new Set<string>();
    (likes ?? []).forEach((l: any) => {
      likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1;
      if (currentUserId && l.userId === currentUserId) userLikedSet.add(l.postId);
    });

    const commentCountMap: Record<string, number> = {};
    (comments ?? []).forEach((c: any) => {
      commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1;
    });

    const result = (posts as any[]).map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      viewCount: p.viewCount ?? 0,
      metadata: p.metadata ?? {},
      user: userMap[p.userId] ?? {
        id: p.userId,
        username: "unknown",
        avatarUrl: null,
      },
      likesCount: likeCountMap[p.id] ?? 0,
      commentsCount: commentCountMap[p.id] ?? 0,
      isLiked: userLikedSet.has(p.id),
    }));

    console.log(`[feed] tab=${tab} returning ${result.length} posts`);
    return NextResponse.json({ posts: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    console.error("[feed] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
