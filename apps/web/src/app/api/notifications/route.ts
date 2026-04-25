export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Accept Bearer token (sent by the hook) or fall back to cookie-based auth
    let authUserId: string | null = null;
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) authUserId = user.id;
    }

    // Fallback: cookie-based session (for SSR / direct navigation)
    if (!authUserId) {
      const { createSupabaseServerClient } = await import('@/lib/supabase');
      const authClient = await createSupabaseServerClient();
      const { data: { user }, error } = await authClient.auth.getUser();
      if (!error && user) authUserId = user.id;
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUserId)
      .single();

    if (!dbUser) return NextResponse.json({ notifications: [] });

    const { data: notifications } = await supabase
      .from('Notification')
      .select('id, type, referenceId, read, createdAt')
      .eq('userId', dbUser.id)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (!notifications?.length) return NextResponse.json({ notifications: [] });

    // referenceId format: "actorId:postId" for like/comment/save, "actorId" for follow
    const actorIds = Array.from(new Set(
      notifications.map(n => n.referenceId.split(':')[0])
    ));

    // Collect postIds for comment notifications (to fetch comment text)
    const commentNotifs = notifications.filter(n => n.type === 'comment');
    const dmNotifs = notifications.filter(n => n.type === 'dm');

    const [{ data: actors }, { data: myFollows }] = await Promise.all([
      supabase.from('User').select('id, username, avatarUrl').in('id', actorIds),
      supabase.from('Follow').select('followingId').eq('followerId', dbUser.id).in('followingId', actorIds),
    ]);

    const actorMap = Object.fromEntries((actors ?? []).map(a => [a.id, a]));
    const alreadyFollowing = new Set((myFollows ?? []).map((f: any) => f.followingId));

    // Fetch most recent comment text per comment notification
    const commentTextMap: Record<string, string> = {};
    if (commentNotifs.length > 0) {
      await Promise.all(commentNotifs.map(async n => {
        const [actorId, postId] = n.referenceId.split(':');
        if (!actorId || !postId) return;
        const { data } = await supabase
          .from('Comment')
          .select('content')
          .eq('userId', actorId)
          .eq('postId', postId)
          .order('createdAt', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.content) commentTextMap[n.id] = data.content;
      }));
    }

    // Fetch DM preview text per dm notification (referenceId = "actorId:messageId")
    const dmPreviewMap: Record<string, string> = {};
    if (dmNotifs.length > 0) {
      await Promise.all(dmNotifs.map(async n => {
        const [, messageId] = n.referenceId.split(':');
        if (!messageId) return;
        const { data } = await supabase
          .from('Message')
          .select('content, mediaType')
          .eq('id', messageId)
          .maybeSingle();
        if (data) {
          dmPreviewMap[n.id] = data.content?.trim()
            ? data.content
            : data.mediaType === 'video' ? '🎥 Video' : '📷 Photo';
        }
      }));
    }

    const enriched = notifications.map(n => {
      const [actorId, postId] = n.referenceId.split(':');
      const actor = actorMap[actorId] ?? { id: actorId, username: 'unknown', avatarUrl: null };
      const message =
        n.type === 'like'    ? 'liked your post' :
        n.type === 'comment' ? 'commented on your post' :
        n.type === 'follow'  ? 'started following you' :
        n.type === 'save'    ? 'favorited your post' :
        n.type === 'dm'      ? 'sent you a message' : '';

      return {
        id: n.id,
        type: n.type,
        postId: postId ?? null,
        read: n.read,
        createdAt: n.createdAt,
        message,
        actor,
        isFollowingActor: alreadyFollowing.has(actorId),
        commentText: commentTextMap[n.id] ?? null,
        dmPreview: dmPreviewMap[n.id] ?? null,
      };
    });

    // Deduplicate follow notifications: only show the most recent per actor
    const seen = new Set<string>();
    const deduped = enriched.filter(n => {
      if (n.type !== 'follow') return true;
      if (seen.has(n.actor.id)) return false;
      seen.add(n.actor.id);
      return true;
    });

    return NextResponse.json({ notifications: deduped });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    console.error('[notifications] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
