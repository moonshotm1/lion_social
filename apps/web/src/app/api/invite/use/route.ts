import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { prisma } from "@lion/database";

export async function POST(req: Request) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const invite = await prisma.invite.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!invite || invite.usedAt) {
    return NextResponse.json({ error: "Invalid or already-used invite" }, { status: 400 });
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedById: dbUser.id, usedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
