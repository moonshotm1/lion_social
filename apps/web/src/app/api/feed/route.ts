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
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0"));
  const search = searchParams.get("search")?.trim() ?? "";

  // ── Step 1: Resolve authenticated user ──────────────────────────────────
  let currentUserId: string | null = null;
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr) {
        console.error("[feed] auth.getUser error:", authErr.message, "code:", authErr.status);
      } else if (authUser) {
        const { data: appUser, error: userErr } = await supabase
          .from("User")
          .select("id")
          .eq("supabaseId", authUser.id)
          .single();
        if (userErr) {
          // PGRST116 = no rows: user record missing for this supabase auth ID
          console.error("[feed] User lookup failed — supabaseId:", authUser.id, "error:", userErr.message, "code:", userErr.code);
        }
        currentUserId = (appUser as any)?.id ?? null;
        console.log("[feed] auth resolved — supabaseId:", authUser.id, "appUserId:", currentUserId);
      } else {
        console.log("[feed] auth.getUser returned no user (token may be expired)");
      }
    } catch (e) {
      console.error("[feed] auth resolution threw:", e);
    }
  } else {
    console.log("[feed] no auth header — tab:", tab, "type:", type);
  }

  if (auth?.startsWith("Bearer ") && !currentUserId) {
    console.error("[feed] WARN: auth header present but currentUserId is null — isLiked will always be false");
  }

  try {
    // ── Step 2: User-specific interaction data (runs in parallel) ──────────
    // Fetch ALL posts liked/saved by this user — not filtered by current page.
    // This is more reliable than comparing userId inside a per-page batch.
    let followingUserIds: string[] = [];
    const userLikedPostIds = new Set<string>();
    const userSavedPostIds = new Set<string>();

    if (currentUserId) {
      // Likes and saves always run in parallel
      const [likesResult, savesResult] = await Promise.all([
        supabase.from("Like").select("postId").eq("userId", currentUserId),
        supabase.from("Save").select("postId").eq("userId", currentUserId),
      ]);

      const { data: userLikes, error: userLikesErr } = likesResult;
      if (userLikesErr) {
        console.error("[feed] user likes query error:", userLikesErr.message);
      } else {
        (userLikes ?? []).forEach((l: any) => userLikedPostIds.add(l.postId));
        console.log("[feed] user liked posts:", userLikedPostIds.size);
      }

      const { data: userSaves, error: userSavesErr } = savesResult;
      if (userSavesErr) {
        console.error("[feed] user saves query error:", userSavesErr.message);
      } else {
        (userSaves ?? []).forEach((s: any) => userSavedPostIds.add(s.postId));
      }

      if (tab === "following") {
        const { data: follows, error: followsErr } = await supabase
          .from("Follow")
          .select("followingId")
          .eq("followerId", currentUserId);
        if (followsErr) {
          console.error("[feed] Follow query error:", followsErr.message, "code:", followsErr.code);
          return NextResponse.json({ error: followsErr.message }, { status: 500 });
        }
        followingUserIds = (follows ?? []).map((f: any) => f.followingId);
        console.log("[feed] following:", followingUserIds.length, "users");
        if (followingUserIds.length === 0) return NextResponse.json({ posts: [] });
      }
    } else if (tab === "following") {
      console.log("[feed] following tab but no currentUserId — returning empty");
      return NextResponse.json({ posts: [] });
    }

    // ── Step 3: Fetch posts with inline counts ───────────────────────────
    // Counts are embedded in the same query via Supabase's relation syntax
    // so each post always has its own accurate count — no separate batch needed.
    const pageSize = 20;
    let postQuery = supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt, metadata,
        User!inner (id, username, displayName, avatarUrl),
        likes:Like(count),
        comments:Comment(count),
        saves:Save(count),
        views:PostView(count)
      `)
      .order("createdAt", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (type && type !== "all") postQuery = postQuery.eq("type", type);
    if (tab === "following") postQuery = postQuery.in("userId", followingUserIds);
    if (search) postQuery = postQuery.ilike("caption", `%${search}%`);

    const { data: posts, error: postsError } = await postQuery;
    if (postsError) {
      console.error("[feed] Post query error:", postsError.message);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }
    if (!posts || posts.length === 0) return NextResponse.json({ posts: [] });

    // ── Step 4: Build result ─────────────────────────────────────────────
    const result = (posts as any[]).map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      metadata: p.metadata ?? {},
      user: p.User ?? { id: "", username: "unknown", avatarUrl: null },
      // Inline counts — each value is [{ count: N }]; Number() coerces string counts
      likesCount:    Number(p.likes?.[0]?.count    ?? 0),
      commentsCount: Number(p.comments?.[0]?.count ?? 0),
      savesCount:    Number(p.saves?.[0]?.count    ?? 0),
      viewCount:     Number(p.views?.[0]?.count    ?? 0),
      // User-centric flags from the dedicated liked/saved sets fetched above
      isLiked:      userLikedPostIds.has(p.id),
      isBookmarked: userSavedPostIds.has(p.id),
    }));

    console.log(
      "[feed] returning", result.length, "posts,",
      "isLiked:", result.filter((p) => p.isLiked).length,
      "isBookmarked:", result.filter((p) => p.isBookmarked).length,
      "tab:", tab
    );

    return NextResponse.json({ posts: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    console.error("[feed] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
