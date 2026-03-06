export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    if (!dbUser) return NextResponse.json({ notifications: [] });

    const { data: notifications } = await supabase
      .from('Notification')
      .select('id, type, referenceId, read, createdAt')
      .eq('userId', dbUser.id)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (!notifications?.length) return NextResponse.json({ notifications: [] });

    // referenceId format: "actorId:postId" for like/comment, "actorId" for follow
    const actorIds = Array.from(new Set(
      notifications.map(n => n.referenceId.split(':')[0])
    ));

    const { data: actors } = await supabase
      .from('User')
      .select('id, username, avatarUrl')
      .in('id', actorIds);

    const actorMap = Object.fromEntries((actors ?? []).map(a => [a.id, a]));

    const enriched = notifications.map(n => {
      const [actorId, postId] = n.referenceId.split(':');
      const actor = actorMap[actorId] ?? { id: actorId, username: 'unknown', avatarUrl: null };
      const message =
        n.type === 'like' ? 'liked your post' :
        n.type === 'comment' ? 'commented on your post' :
        n.type === 'follow' ? 'started following you' : '';

      return {
        id: n.id,
        type: n.type,
        postId: postId ?? null,
        read: n.read,
        createdAt: n.createdAt,
        message,
        actor,
      };
    });

    return NextResponse.json({ notifications: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    console.error('[notifications] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
