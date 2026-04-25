export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

async function resolveUser(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let authUserId: string | null = null;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
    if (user) authUserId = user.id;
  }
  if (!authUserId) {
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user) authUserId = user.id;
  }
  return { supabase, authUserId };
}

// GET /api/messages/[userId] — get messages in a thread
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ messages: [] });

    const myId = dbUser.id;
    const otherId = params.userId;

    // Mark messages from other user as read
    await supabase
      .from('Message')
      .update({ read: true })
      .eq('senderId', otherId)
      .eq('recipientId', myId)
      .eq('read', false);

    // Fetch thread
    const { data: messages } = await supabase
      .from('Message')
      .select('id, senderId, recipientId, content, mediaUrl, mediaType, read, createdAt')
      .or(
        `and(senderId.eq.${myId},recipientId.eq.${otherId}),and(senderId.eq.${otherId},recipientId.eq.${myId})`
      )
      .order('createdAt', { ascending: true })
      .limit(100);

    // Fetch other user's profile
    const { data: otherUser } = await supabase
      .from('User').select('id, username, displayName, avatarUrl').eq('id', otherId).single();

    return NextResponse.json({ messages: messages ?? [], otherUser });
  } catch (err) {
    console.error('[messages/thread] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
