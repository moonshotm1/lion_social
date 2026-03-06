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

    const { data: post, error } = await supabase
      .from('Post')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await supabase
      .from('Post')
      .update({ viewCount: (post.viewCount ?? 0) + 1 })
      .eq('id', postId);

    // Fetch post owner
    const { data: user } = await supabase
      .from('User')
      .select('id, username, avatarUrl, bio')
      .eq('id', post.userId)
      .single();

    // Fetch comments with user info
    const { data: comments } = await supabase
      .from('Comment')
      .select('id, content, createdAt, userId')
      .eq('postId', postId)
      .order('createdAt', { ascending: true });

    const commentUserIds = Array.from(new Set((comments ?? []).map(c => c.userId)));
    let commentUsers: Record<string, { id: string; username: string; avatarUrl: string | null }> = {};
    if (commentUserIds.length) {
      const { data: users } = await supabase
        .from('User')
        .select('id, username, avatarUrl')
        .in('id', commentUserIds);
      commentUsers = Object.fromEntries((users ?? []).map(u => [u.id, u]));
    }

    // Fetch counts
    const [{ count: likeCount }, { count: commentCount }, { count: saveCount }] = await Promise.all([
      supabase.from('Like').select('*', { count: 'exact', head: true }).eq('postId', postId),
      supabase.from('Comment').select('*', { count: 'exact', head: true }).eq('postId', postId),
      supabase.from('Save').select('*', { count: 'exact', head: true }).eq('postId', postId),
    ]);

    const enrichedComments = (comments ?? []).map(c => ({
      ...c,
      user: commentUsers[c.userId] ?? { id: c.userId, username: 'unknown', avatarUrl: null },
    }));

    return NextResponse.json({
      ...post,
      viewCount: (post.viewCount ?? 0) + 1,
      user: user ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null },
      comments: enrichedComments,
      _count: {
        likes: likeCount ?? 0,
        comments: commentCount ?? 0,
        saves: saveCount ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
