export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve optional viewer from Bearer token
    let viewerDbId: string | null = null;
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        if (authUser) {
          const { data: viewer } = await supabase
            .from('User').select('id').eq('supabaseId', authUser.id).single();
          viewerDbId = viewer?.id ?? null;
        }
      } catch { /* non-fatal */ }
    }

    const { data: post, error } = await supabase
      .from('Post')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count atomically
    await supabase.rpc('increment_post_view', { post_id: postId });

    // Fetch everything in parallel
    const [
      { data: user },
      { data: comments },
      { data: likesRows },
      { data: commentsRows },
      { data: savesRows },
      { data: viewerLike },
      { data: viewerSave },
    ] = await Promise.all([
      supabase.from('User').select('id, username, displayName, avatarUrl, bio').eq('id', post.userId).single(),
      supabase.from('Comment').select('id, content, createdAt, userId').eq('postId', postId).order('createdAt', { ascending: true }),
      supabase.from('Like').select('id').eq('postId', postId),
      supabase.from('Comment').select('id').eq('postId', postId),
      supabase.from('Save').select('id').eq('postId', postId),
      viewerDbId
        ? supabase.from('Like').select('id').eq('postId', postId).eq('userId', viewerDbId).maybeSingle()
        : Promise.resolve({ data: null }),
      viewerDbId
        ? supabase.from('Save').select('id').eq('postId', postId).eq('userId', viewerDbId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const commentUserIds = Array.from(new Set((comments ?? []).map((c: any) => c.userId)));
    let commentUsers: Record<string, { id: string; username: string; avatarUrl: string | null }> = {};
    if (commentUserIds.length) {
      const { data: users } = await supabase
        .from('User')
        .select('id, username, avatarUrl')
        .in('id', commentUserIds);
      commentUsers = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));
    }

    const enrichedComments = (comments ?? []).map((c: any) => ({
      ...c,
      user: commentUsers[c.userId] ?? { id: c.userId, username: 'unknown', avatarUrl: null },
    }));

    return NextResponse.json({
      ...post,
      viewCount: (post.viewCount ?? 0) + 1,
      user: user ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null },
      isLiked: !!viewerLike,
      isBookmarked: !!viewerSave,
      comments: enrichedComments,
      _count: {
        likes: (likesRows ?? []).length,
        comments: (commentsRows ?? []).length,
        saves: (savesRows ?? []).length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Require auth
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = auth.slice(7);
    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Resolve DB user
    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUser.id).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify ownership
    const { data: post } = await supabase
      .from('Post').select('userId').eq('id', postId).single();
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the post (cascade deletes likes, comments, saves via FK)
    const { error } = await supabase.from('Post').delete().eq('id', postId);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
