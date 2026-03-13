export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20);

  if (!q || q.length < 1) return NextResponse.json({ users: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: users, error } = await supabase
      .from("User")
      .select("id, username, avatarUrl, bio")
      .ilike("username", `%${q}%`)
      .limit(limit);

    if (error) {
      console.error("[user/search] error:", error.message);
      return NextResponse.json({ users: [] });
    }

    return NextResponse.json({ users: users ?? [] });
  } catch (err) {
    console.error("[user/search] threw:", err);
    return NextResponse.json({ users: [] });
  }
}
