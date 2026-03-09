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

  // Resolve current user from Authorization header
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
    // continue as unauthenticated
  }

  try {
    // For "following" tab, get followed user IDs first
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

    // Fetch posts with author via embedded User join
    let postQuery = supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt, viewCount, metadata,
        User!inner (id, username, avatarUrl)
      `)
      .order("createdAt", { ascending: false })
      .limit(20);

    if (type && type !== "all") postQuery = postQuery.eq("type", type);
    if (followingUserIds) postQuery = postQuery.in("userId", followingUserIds);

    const { data: posts, error: postsError } = await postQuery;
    if (postsError) {
      console.error("[feed] Post query error:", postsError.message);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }
    if (!posts || posts.length === 0) return NextResponse.json({ posts: [] });

    const postIds = (posts as any[]).map((p) => p.id);

    // Batch fetch social data for all posts in parallel
    const [
      { data: likesData, error: likesErr },
      { data: commentsData, error: commentsErr },
      { data: savesData, error: savesErr },
    ] = await Promise.all([
      supabase.from("Like").select("postId, userId").in("postId", postIds),
      supabase.from("Comment").select("postId").in("postId", postIds),
      supabase.from("Save").select("postId, userId").in("postId", postIds),
    ]);

    if (likesErr) console.error("[feed] Likes query error:", likesErr.message);
    if (commentsErr) console.error("[feed] Comments query error:", commentsErr.message);
    if (savesErr) console.error("[feed] Saves query error:", savesErr.message);

    // Group counts by postId
    const likesCount: Record<string, number> = {};
    const isLikedSet = new Set<string>();
    for (const l of (likesData ?? [])) {
      likesCount[l.postId] = (likesCount[l.postId] ?? 0) + 1;
      if (l.userId === currentUserId) isLikedSet.add(l.postId);
    }

    const commentsCount: Record<string, number> = {};
    for (const c of (commentsData ?? [])) {
      commentsCount[c.postId] = (commentsCount[c.postId] ?? 0) + 1;
    }

    const savesCount: Record<string, number> = {};
    const isSavedSet = new Set<string>();
    for (const s of (savesData ?? [])) {
      savesCount[s.postId] = (savesCount[s.postId] ?? 0) + 1;
      if (s.userId === currentUserId) isSavedSet.add(s.postId);
    }

    const result = (posts as any[]).map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      viewCount: p.viewCount ?? 0,
      metadata: p.metadata ?? {},
      user: p.User ?? { id: "", username: "unknown", avatarUrl: null },
      likesCount: likesCount[p.id] ?? 0,
      commentsCount: commentsCount[p.id] ?? 0,
      savesCount: savesCount[p.id] ?? 0,
      isLiked: isLikedSet.has(p.id),
      isBookmarked: isSavedSet.has(p.id),
    }));

    return NextResponse.json({ posts: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    console.error("[feed] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
