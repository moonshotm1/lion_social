export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, error: "code is required" }, { status: 400 });
  }

  const { prisma } = await import("@lion/database");

  const invite = await prisma.invite.findUnique({
    where: { code },
    select: { id: true, usedAt: true },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invite code." });
  }

  if (invite.usedAt) {
    return NextResponse.json({ valid: false, error: "This invite has already been used." });
  }

  return NextResponse.json({ valid: true });
}
