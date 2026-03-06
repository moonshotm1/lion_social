export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up the DB user to get their Supabase auth ID
  const { data: dbUser } = await supabase
    .from('User')
    .select('supabaseId')
    .eq('username', username)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Use admin client to retrieve the auth user's email
  const { data, error } = await supabase.auth.admin.getUserById(dbUser.supabaseId);

  if (error || !data.user?.email) {
    return NextResponse.json({ error: 'Could not retrieve account' }, { status: 500 });
  }

  return NextResponse.json({ email: data.user.email });
}
