export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ count: 0 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase
      .from("User")
      .select("id")
      .eq("supabaseId", authUser.id)
      .single();

    if (!dbUser) return NextResponse.json({ count: 0 });

    // Use row fetch instead of head:true — head count returns null in some Supabase configs
    const { data: rows } = await supabase
      .from("Notification")
      .select("id")
      .eq("userId", (dbUser as any).id)
      .eq("read", false);

    return NextResponse.json({ count: rows?.length ?? 0 });
  } catch (err) {
    console.error("[notifications/unread-count] Error:", err);
    return NextResponse.json({ count: 0 });
  }
}
