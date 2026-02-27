import { NextResponse } from "next/server";
import { prisma } from "@lion/database";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  // Look up the DB user to get their Supabase auth ID
  const dbUser = await prisma.user.findUnique({
    where: { username },
    select: { supabaseId: true },
  });

  if (!dbUser) {
    // Return a generic error so we don't reveal which usernames exist
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Use admin client to retrieve the auth user's email
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(dbUser.supabaseId);

  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Could not retrieve account" }, { status: 500 });
  }

  return NextResponse.json({ email: data.user.email });
}
