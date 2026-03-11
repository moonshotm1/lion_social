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
      const promises: Promise<any>[] = [
        supabase.from("Like").select("postId").eq("userId", currentUserId),
        supabase.from("Save").select("postId").eq("userId", currentUserId),
      ];
      if (tab === "following") {
        promises.push(
          supabase.from("Follow").select("followingId").eq("followerId", currentUserId)
        );
      }

      const results = await Promise.all(promises);

      const { data: userLikes, error: userLikesErr } = results[0];
      if (userLikesErr) {
        console.error("[feed] user likes query error:", userLikesErr.message);
      } else {
        (userLikes ?? []).forEach((l: any) => userLikedPostIds.add(l.postId));
        console.log("[feed] user liked posts:", userLikedPostIds.size);
      }

      const { data: userSaves, error: userSavesErr } = results[1];
      if (userSavesErr) {
        console.error("[feed] user saves query error:", userSavesErr.message);
      } else {
        (userSaves ?? []).forEach((s: any) => userSavedPostIds.add(s.postId));
      }

      if (tab === "following") {
        const { data: follows, error: followsErr } = results[2];
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

    // ── Step 3: Fetch posts ──────────────────────────────────────────────
    let postQuery = supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt, viewCount, metadata,
        User!inner (id, username, avatarUrl)
      `)
      .order("createdAt", { ascending: false })
      .limit(20);

    if (type && type !== "all") postQuery = postQuery.eq("type", type);
    if (tab === "following") postQuery = postQuery.in("userId", followingUserIds);

    const { data: posts, error: postsError } = await postQuery;
    if (postsError) {
      console.error("[feed] Post query error:", postsError.message);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }
    if (!posts || posts.length === 0) return NextResponse.json({ posts: [] });

    const postIds = (posts as any[]).map((p) => p.id);

    // ── Step 4: Batch fetch counts for displayed posts ───────────────────
    const [
      { data: likesData, error: likesErr },
      { data: commentsData, error: commentsErr },
      { data: savesData, error: savesErr },
      { data: viewsData },
    ] = await Promise.all([
      supabase.from("Like").select("postId").in("postId", postIds),
      supabase.from("Comment").select("postId").in("postId", postIds),
      supabase.from("Save").select("postId").in("postId", postIds),
      // PostView counts unique viewers — falls back to 0 if table doesn't exist yet
      supabase.from("PostView").select("postId").in("postId", postIds).catch(() => ({ data: null })),
    ]);

    if (likesErr) console.error("[feed] Likes count query error:", likesErr.message);
    if (commentsErr) console.error("[feed] Comments count query error:", commentsErr.message);
    if (savesErr) console.error("[feed] Saves count query error:", savesErr.message);

    const likesCount: Record<string, number> = {};
    for (const l of (likesData ?? [])) {
      likesCount[l.postId] = (likesCount[l.postId] ?? 0) + 1;
    }
    const commentsCount: Record<string, number> = {};
    for (const c of (commentsData ?? [])) {
      commentsCount[c.postId] = (commentsCount[c.postId] ?? 0) + 1;
    }
    const savesCount: Record<string, number> = {};
    for (const s of (savesData ?? [])) {
      savesCount[s.postId] = (savesCount[s.postId] ?? 0) + 1;
    }
    const viewsCount: Record<string, number> = {};
    for (const v of ((viewsData as any[]) ?? [])) {
      viewsCount[v.postId] = (viewsCount[v.postId] ?? 0) + 1;
    }

    // ── Step 5: Build result ─────────────────────────────────────────────
    const result = (posts as any[]).map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      // Use PostView unique count if available, fallback to Post.viewCount
      viewCount: viewsCount[p.id] !== undefined ? viewsCount[p.id] : (p.viewCount ?? 0),
      metadata: p.metadata ?? {},
      user: p.User ?? { id: "", username: "unknown", avatarUrl: null },
      likesCount: likesCount[p.id] ?? 0,
      commentsCount: commentsCount[p.id] ?? 0,
      savesCount: savesCount[p.id] ?? 0,
      // User-centric: directly from this user's liked/saved sets
      isLiked: userLikedPostIds.has(p.id),
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
