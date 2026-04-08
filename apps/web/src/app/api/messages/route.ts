export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

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

// GET /api/messages — list conversations (one row per unique thread partner)
export async function GET(req: NextRequest) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ conversations: [] });

    const myId = dbUser.id;

    // Fetch all messages where user is sender or recipient
    const { data: messages } = await supabase
      .from('Message')
      .select('id, senderId, recipientId, content, read, createdAt')
      .or(`senderId.eq.${myId},recipientId.eq.${myId}`)
      .order('createdAt', { ascending: false });

    if (!messages?.length) return NextResponse.json({ conversations: [] });

    // Group into conversations by the other user's ID
    const threadMap = new Map<string, typeof messages[0]>();
    for (const msg of messages) {
      const otherId = msg.senderId === myId ? msg.recipientId : msg.senderId;
      if (!threadMap.has(otherId)) threadMap.set(otherId, msg);
    }

    const partnerIds = Array.from(threadMap.keys());
    const { data: partners } = await supabase
      .from('User').select('id, username, displayName, avatarUrl').in('id', partnerIds);

    const partnerMap = Object.fromEntries((partners ?? []).map(p => [p.id, p]));

    // Count unread per thread
    const { data: unreadRows } = await supabase
      .from('Message')
      .select('senderId')
      .eq('recipientId', myId)
      .eq('read', false);

    const unreadByPartner: Record<string, number> = {};
    for (const row of (unreadRows ?? [])) {
      unreadByPartner[row.senderId] = (unreadByPartner[row.senderId] ?? 0) + 1;
    }

    const conversations = partnerIds.map(partnerId => {
      const latest = threadMap.get(partnerId)!;
      const partner = partnerMap[partnerId] ?? { id: partnerId, username: 'unknown', displayName: null, avatarUrl: null };
      return {
        partnerId,
        partner,
        lastMessage: latest.content,
        lastMessageAt: latest.createdAt,
        lastMessageFromMe: latest.senderId === myId,
        unreadCount: unreadByPartner[partnerId] ?? 0,
      };
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('[messages] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { recipientId, content } = body;
    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: 'recipientId and content are required' }, { status: 400 });
    }

    const { data: dbUser } = await supabase
      .from('User').select('id, username').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Insert message
    const messageId = genId();
    const { data: message, error } = await supabase
      .from('Message')
      .insert({ id: messageId, senderId: dbUser.id, recipientId, content: content.trim() })
      .select()
      .single();
    if (error) throw error;

    // Create dm notification for recipient
    await supabase.from('Notification').insert({
      id: genId(),
      userId: recipientId,
      type: 'dm',
      referenceId: `${dbUser.id}:${messageId}`,
      read: false,
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error('[messages] POST error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
