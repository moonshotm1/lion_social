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

    // Resolve auth from Authorization header (sent by browser client)
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

    // Delete-first toggle: if a Like row exists, remove it (unlike); otherwise insert (like).
    // This avoids race conditions where the SELECT misses an existing row.
    const { data: deleted, error: deleteErr } = await supabase
      .from('Like')
      .delete()
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .select('id');

    if (deleteErr) {
      console.error('[like] delete error:', deleteErr.message);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (deleted && deleted.length > 0) {
      // Was liked — now unliked
      return NextResponse.json({ liked: false });
    }

    // Was not liked — insert new Like
    const now = new Date().toISOString();
    const { error: insertErr } = await supabase
      .from('Like')
      .insert({ id: genId(), userId: dbUser.id, postId, createdAt: now });

    if (insertErr) {
      // 23505 = unique_violation: another request already inserted — still liked
      if (insertErr.code === '23505') return NextResponse.json({ liked: true });
      console.error('[like] insert error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Notify post owner (not self)
    const { data: post } = await supabase
      .from('Post')
      .select('userId')
      .eq('id', postId)
      .single();

    if (post && post.userId !== dbUser.id) {
      await supabase.from('Notification').insert({
        id: genId(),
        userId: post.userId,
        type: 'like',
        referenceId: `${dbUser.id}:${postId}`,
        read: false,
        createdAt: now,
      });
    }

    return NextResponse.json({ liked: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle like';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
