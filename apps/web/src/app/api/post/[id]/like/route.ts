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
    console.log('[like] START postId:', postId);
    const supabase = getServiceClient();

    // Resolve auth from Authorization header (sent by browser client)
    const auth = req.headers.get('authorization');
    console.log('[like] auth header present:', !!auth, 'starts with Bearer:', auth?.startsWith('Bearer '));
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = auth.slice(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    console.log('[like] authUser:', authUser?.id ?? null, 'authError:', authError ? JSON.stringify(authError) : null);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: dbUser, error: userErr } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();
    console.log('[like] dbUser:', dbUser?.id ?? null, 'userErr:', userErr ? JSON.stringify(userErr) : null);

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Delete-first toggle: if a Like row exists, remove it (unlike); otherwise insert (like).
    const { data: deleted, error: deleteErr } = await supabase
      .from('Like')
      .delete()
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .select('id');
    console.log('[like] delete result — deleted:', deleted?.length ?? 0, 'deleteErr:', deleteErr ? JSON.stringify(deleteErr) : null);

    if (deleteErr) {
      console.error('[like] delete error:', JSON.stringify(deleteErr));
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (deleted && deleted.length > 0) {
      console.log('[like] unliked — returning liked:false');
      return NextResponse.json({ liked: false });
    }

    // Was not liked — insert new Like (let DB supply id + createdAt defaults)
    const { error: insertErr } = await supabase
      .from('Like')
      .insert({ userId: dbUser.id, postId });
    console.log('[like] insert result — insertErr:', insertErr ? JSON.stringify(insertErr) : null);

    if (insertErr) {
      // 23505 = unique_violation: another request already inserted — still liked
      if (insertErr.code === '23505') return NextResponse.json({ liked: true });
      console.error('[like] insert error:', JSON.stringify(insertErr));
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Notify post owner (not self)
    const now = new Date().toISOString();
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

    console.log('[like] SUCCESS — returning liked:true');
    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error('[like] CAUGHT EXCEPTION:', err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : 'Failed to toggle like';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
