export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET() {
  const { createSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { prisma } = await import("@lion/database");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ invites: [] });
  }

  const invites = await prisma.invite.findMany({
    where: { invitedById: dbUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      code: true,
      createdAt: true,
      usedAt: true,
      usedBy: { select: { username: true } },
    },
  });

  return NextResponse.json({ invites });
}
