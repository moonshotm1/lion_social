export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function resolveDbUser(supabase: ReturnType<typeof getServiceClient>, token: string) {
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) return null;
  const { data: dbUser } = await supabase
    .from('User')
    .select('id')
    .eq('supabaseId', authUser.id)
    .single();
  return dbUser ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();

    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const dbUser = await resolveDbUser(supabase, auth.slice(7));
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { targetUserId } = body;
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    if (dbUser.id === targetUserId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const { data: existing } = await supabase
      .from('Follow')
      .select('id')
      .eq('followerId', dbUser.id)
      .eq('followingId', targetUserId)
      .single();

    if (existing) {
      await supabase.from('Follow').delete().eq('id', existing.id);
      return NextResponse.json({ following: false });
    }

    const now = new Date().toISOString();
    await supabase.from('Follow').insert({
      id: genId(),
      followerId: dbUser.id,
      followingId: targetUserId,
      createdAt: now,
    });

    await supabase.from('Notification').insert({
      id: genId(),
      userId: targetUserId,
      type: 'follow',
      referenceId: dbUser.id,
      read: false,
      createdAt: now,
    });

    return NextResponse.json({ following: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle follow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get('targetUserId');
    if (!targetUserId) return NextResponse.json({ following: false });

    const supabase = getServiceClient();

    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ following: false });

    const dbUser = await resolveDbUser(supabase, auth.slice(7));
    if (!dbUser) return NextResponse.json({ following: false });

    const { data: follow } = await supabase
      .from('Follow')
      .select('id')
      .eq('followerId', dbUser.id)
      .eq('followingId', targetUserId)
      .single();

    return NextResponse.json({ following: !!follow });
  } catch {
    return NextResponse.json({ following: false });
  }
}
