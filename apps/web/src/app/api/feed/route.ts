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
        console.error("[feed] auth.getUser error:", authErr.message);
      } else if (authUser) {
        const { data: appUser, error: userErr } = await supabase
          .from("User")
          .select("id")
          .eq("supabaseId", authUser.id)
          .single();
        if (userErr) {
          console.error("[feed] User lookup failed — supabaseId:", authUser.id, "error:", userErr.message);
        }
        currentUserId = (appUser as any)?.id ?? null;
      }
    } catch (e) {
      console.error("[feed] auth resolution threw:", e);
    }
  }

  try {
    // ── Step 2: User-specific interaction data ──────────────────────────────
    let followingUserIds: string[] = [];
    const userLikedPostIds = new Set<string>();
    const userSavedPostIds = new Set<string>();

    if (currentUserId) {
      const [likesResult, savesResult] = await Promise.all([
        supabase.from("Like").select("postId").eq("userId", currentUserId),
        supabase.from("Save").select("postId").eq("userId", currentUserId),
      ]);

      (likesResult.data ?? []).forEach((l: any) => userLikedPostIds.add(l.postId));
      (savesResult.data ?? []).forEach((s: any) => userSavedPostIds.add(s.postId));

      if (tab === "following") {
        const { data: follows, error: followsErr } = await supabase
          .from("Follow")
          .select("followingId")
          .eq("followerId", currentUserId);
        if (followsErr) {
          console.error("[feed] Follow query error:", followsErr.message);
          return NextResponse.json({ error: followsErr.message }, { status: 500 });
        }
        followingUserIds = (follows ?? []).map((f: any) => f.followingId);
        if (followingUserIds.length === 0) return NextResponse.json({ posts: [] });
      }
    } else if (tab === "following") {
      return NextResponse.json({ posts: [] });
    }

    // ── Step 3: Fetch posts (no embedded PostView count — camelCase breaks PostgREST) ─
    const pageSize = 20;
    let postQuery = supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt, metadata, userId,
        User!inner (id, username, displayName, avatarUrl),
        likes:Like(count),
        comments:Comment(count),
        saves:Save(count)
      `)
      .order("createdAt", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (type && type !== "all") postQuery = postQuery.eq("type", type);
    if (tab === "following") postQuery = postQuery.in("userId", followingUserIds);
    // Explore tab: exclude current user's own posts
    if (tab === "explore" && currentUserId) postQuery = postQuery.neq("userId", currentUserId);
    if (search) postQuery = postQuery.ilike("caption", `%${search}%`);

    const { data: posts, error: postsError } = await postQuery;
    if (postsError) {
      console.error("[feed] Post query error:", postsError.message);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }
    if (!posts || posts.length === 0) return NextResponse.json({ posts: [] });

    // ── Step 4: Fetch view counts separately (PostgREST camelCase workaround) ─
    const postIds = (posts as any[]).map((p) => p.id);
    const { data: viewRows } = await supabase
      .from("PostView")
      .select("postId")
      .in("postId", postIds);

    const viewCountMap: Record<string, number> = {};
    (viewRows ?? []).forEach((v: any) => {
      viewCountMap[v.postId] = (viewCountMap[v.postId] ?? 0) + 1;
    });

    // ── Step 5: Build result ─────────────────────────────────────────────────
    const result = (posts as any[]).map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      metadata: p.metadata ?? {},
      user: p.User ?? { id: "", username: "unknown", avatarUrl: null },
      likesCount:    Number(p.likes?.[0]?.count    ?? 0),
      commentsCount: Number(p.comments?.[0]?.count ?? 0),
      savesCount:    Number(p.saves?.[0]?.count    ?? 0),
      viewCount:     viewCountMap[p.id] ?? 0,
      isLiked:      userLikedPostIds.has(p.id),
      isBookmarked: userSavedPostIds.has(p.id),
    }));

    return NextResponse.json({ posts: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    console.error("[feed] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
