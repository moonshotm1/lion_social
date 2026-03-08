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

  // Resolve current user — try Authorization header first
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

    // Fetch posts with embedded relations for counts and user state.
    // Using embedded arrays (Like, Comment, Save) so we can count lengths
    // and check for the current user's ID — proven reliable vs separate batch queries.
    let postQuery = supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt, viewCount, metadata,
        User!inner (id, username, avatarUrl),
        Like (userId),
        Comment (postId),
        Save (userId)
      `)
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

    const result = (posts as any[]).map((p) => {
      const likes: any[] = p.Like ?? [];
      const comments: any[] = p.Comment ?? [];
      const saves: any[] = p.Save ?? [];

      return {
        id: p.id,
        caption: p.caption,
        imageUrl: p.imageUrl ?? null,
        type: p.type,
        createdAt: p.createdAt,
        viewCount: p.viewCount ?? 0,
        metadata: p.metadata ?? {},
        user: p.User ?? { id: "", username: "unknown", avatarUrl: null },
        likesCount: likes.length,
        commentsCount: comments.length,
        savesCount: saves.length,
        isLiked: currentUserId ? likes.some((l) => l.userId === currentUserId) : false,
        isBookmarked: currentUserId ? saves.some((s) => s.userId === currentUserId) : false,
      };
    });

    return NextResponse.json({ posts: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    console.error("[feed] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
