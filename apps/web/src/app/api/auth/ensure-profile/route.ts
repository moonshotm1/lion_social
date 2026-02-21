import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@lion/database";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!existingUser) {
    const username =
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      `user_${user.id.slice(0, 8)}`;

    await prisma.user.create({
      data: {
        supabaseId: user.id,
        username,
      },
    });
  }

  return NextResponse.json({ success: true });
}
