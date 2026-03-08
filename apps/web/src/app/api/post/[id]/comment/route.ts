export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: comments, error } = await supabase
      .from('Comment')
      .select('id, content, createdAt, userId')
      .eq('postId', postId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    if (!comments?.length) return NextResponse.json({ comments: [] });

    const userIds = Array.from(new Set(comments.map((c: any) => c.userId)));
    const { data: users } = await supabase
      .from('User')
      .select('id, username, avatarUrl')
      .in('id', userIds);

    const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));

    const enriched = comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: userMap[c.userId] ?? { id: c.userId, username: 'unknown', avatarUrl: null },
    }));

    return NextResponse.json({ comments: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch comments';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const content = body.content?.trim();
    if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

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

    const now = new Date().toISOString();
    const id = genId();

    const { data: comment, error: insertError } = await supabase
      .from('Comment')
      .insert({ id, userId: dbUser.id, postId, content, createdAt: now, updatedAt: now })
      .select('id, content, createdAt, userId')
      .single();

    if (insertError) throw insertError;

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
        type: 'comment',
        referenceId: `${dbUser.id}:${postId}`,
        read: false,
        createdAt: now,
      });
    }

    return NextResponse.json(comment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add comment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
