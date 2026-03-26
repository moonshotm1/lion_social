export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ postIds: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const token = auth.slice(7);
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authUser) return NextResponse.json({ postIds: [] });

    const { data: appUser } = await supabase
      .from("User")
      .select("id")
      .eq("supabaseId", authUser.id)
      .single();
    if (!appUser) return NextResponse.json({ postIds: [] });

    const [{ data: likes, error: likesError }, { data: saves, error: savesError }] = await Promise.all([
      supabase.from("Like").select("postId").eq("userId", appUser.id),
      supabase.from("Save").select("postId").eq("userId", appUser.id),
    ]);

    if (likesError) {
      console.error("[liked-post-ids] likes query error:", likesError.message);
      return NextResponse.json({ postIds: [], savedPostIds: [] });
    }
    if (savesError) {
      console.error("[liked-post-ids] saves query error:", savesError.message);
    }

    return NextResponse.json({
      postIds: (likes ?? []).map((l: any) => l.postId),
      savedPostIds: (saves ?? []).map((s: any) => s.postId),
    });
  } catch (err) {
    console.error("[liked-post-ids] threw:", err);
    return NextResponse.json({ postIds: [] });
  }
}
