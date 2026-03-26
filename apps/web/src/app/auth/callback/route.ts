export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create user profile in database if it doesn't exist yet
      const { prisma } = await import("@lion/database");
      const existingUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (!existingUser) {
        const username =
          data.user.user_metadata?.username ||
          data.user.email?.split("@")[0] ||
          `user_${data.user.id.slice(0, 8)}`;

        await prisma.user.create({
          data: {
            supabaseId: data.user.id,
            username,
          },
        });
      }

      // If there's a specific next destination use it, otherwise show the verified page
      const destination = next !== "/" ? next : "/auth/verified";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
