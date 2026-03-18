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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = getServiceClient();

    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = auth.slice(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // SELECT first — check if like exists
    const { data: existing } = await supabase
      .from('Like')
      .select('id')
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .maybeSingle();

    if (existing) {
      // Already liked — delete it (unlike)
      await supabase.from('Like').delete().eq('id', existing.id);
      return NextResponse.json({ liked: false });
    }

    // Not liked — insert
    const { error: insertErr } = await supabase
      .from('Like')
      .insert({ userId: dbUser.id, postId });

    if (insertErr) {
      // 23505 = unique_violation: race condition, treat as liked
      if (insertErr.code === '23505') return NextResponse.json({ liked: true });
      console.error('[like] insert error:', JSON.stringify(insertErr));
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Notify post owner (fire-and-forget, don't block response)
    const now = new Date().toISOString();
    supabase.from('Post').select('userId').eq('id', postId).single().then(({ data: post }) => {
      if (post && post.userId !== dbUser.id) {
        supabase.from('Notification').insert({
          id: genId(),
          userId: post.userId,
          type: 'like',
          referenceId: `${dbUser.id}:${postId}`,
          read: false,
          createdAt: now,
        });
      }
    });

    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error('[like] exception:', err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : 'Failed to toggle like';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
