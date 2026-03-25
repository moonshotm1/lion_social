export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
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

    // SELECT first — check if save exists
    const { data: existing } = await supabase
      .from('Save')
      .select('id')
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .maybeSingle();

    if (existing) {
      // Already saved — delete it (unsave)
      await supabase.from('Save').delete().eq('id', existing.id);
      return NextResponse.json({ saved: false });
    }

    // Not saved — insert
    const { error: insertErr } = await supabase
      .from('Save')
      .insert({ userId: dbUser.id, postId });

    if (insertErr) {
      if (insertErr.code === '23505') return NextResponse.json({ saved: true });
      console.error('[save] insert error:', JSON.stringify(insertErr));
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Notify post owner — skip if notification already exists for this actor+post
    const now = new Date().toISOString();
    supabase.from('Post').select('userId').eq('id', postId).single().then(async ({ data: post }) => {
      if (!post || post.userId === dbUser.id) return;
      const { data: existing } = await supabase
        .from('Notification')
        .select('id')
        .eq('userId', post.userId)
        .eq('type', 'save')
        .eq('referenceId', `${dbUser.id}:${postId}`)
        .maybeSingle();
      if (!existing) {
        supabase.from('Notification').insert({
          id: genId(),
          userId: post.userId,
          type: 'save',
          referenceId: `${dbUser.id}:${postId}`,
          read: false,
          createdAt: now,
        });
      }
    });

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('[save] exception:', err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : 'Failed to toggle save';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
