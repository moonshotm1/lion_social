export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: existing } = await supabase
      .from('Like')
      .select('id')
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .single();

    if (existing) {
      await supabase.from('Like').delete().eq('id', existing.id);
      return NextResponse.json({ liked: false });
    }

    const now = new Date().toISOString();
    await supabase.from('Like').insert({ id: genId(), userId: dbUser.id, postId, createdAt: now });

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
