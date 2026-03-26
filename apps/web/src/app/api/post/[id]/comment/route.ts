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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = getServiceClient();

    // Fetch top-level comments and their replies in parallel
    const [{ data: topLevel, error: topErr }, { data: replies, error: replyErr }] = await Promise.all([
      supabase
        .from('Comment')
        .select('id, content, createdAt, user:User(id, username, avatarUrl)')
        .eq('postId', postId)
        .is('parentId', null)
        .order('createdAt', { ascending: true }),
      supabase
        .from('Comment')
        .select('id, content, createdAt, parentId, user:User(id, username, avatarUrl)')
        .eq('postId', postId)
        .not('parentId', 'is', null)
        .order('createdAt', { ascending: true }),
    ]);

    if (topErr) throw topErr;
    if (replyErr) throw replyErr;

    // Group replies by parentId
    const replyMap: Record<string, any[]> = {};
    for (const r of (replies ?? []) as any[]) {
      if (!replyMap[r.parentId]) replyMap[r.parentId] = [];
      replyMap[r.parentId].push({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        parentId: r.parentId,
        user: r.user ?? { id: '', username: 'unknown', avatarUrl: null },
      });
    }

    const enriched = ((topLevel ?? []) as any[]).map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      parentId: null,
      user: c.user ?? { id: '', username: 'unknown', avatarUrl: null },
      replies: replyMap[c.id] ?? [],
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
    const supabase = getServiceClient();

    // Resolve auth from Authorization header
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = auth.slice(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const content = body.content?.trim();
    const parentId: string | null = body.parentId ?? null;

    if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

    // Validate parentId belongs to this post (prevent cross-post reply injection)
    if (parentId) {
      const { data: parentComment } = await supabase
        .from('Comment')
        .select('id, postId, parentId')
        .eq('id', parentId)
        .single();
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
      }
      // Only allow one level deep — reject if parent itself is a reply
      if (parentComment.parentId) {
        return NextResponse.json({ error: 'Replies are limited to one level deep' }, { status: 400 });
      }
    }

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
      .insert({ id, userId: dbUser.id, postId, parentId, content, createdAt: now, updatedAt: now })
      .select('id, content, createdAt, parentId, userId')
      .single();

    if (insertError) throw insertError;

    // Notify post owner (fire-and-forget)
    supabase.from('Post').select('userId').eq('id', postId).single().then(({ data: post }) => {
      if (post && post.userId !== dbUser.id) {
        supabase.from('Notification').insert({
          id: genId(),
          userId: post.userId,
          type: 'comment',
          referenceId: `${dbUser.id}:${postId}`,
          read: false,
          createdAt: now,
        });
      }
    });

    return NextResponse.json(comment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add comment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
