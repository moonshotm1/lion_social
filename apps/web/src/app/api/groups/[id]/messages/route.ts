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

type Params = { params: { id: string } };

// GET /api/groups/[id]/messages
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ messages: [] });

    // Verify membership
    const { data: membership } = await supabase
      .from('GroupMember')
      .select('id')
      .eq('groupId', params.id)
      .eq('userId', dbUser.id)
      .single();
    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    const [{ data: messages }, { data: group }, { data: members }] = await Promise.all([
      supabase
        .from('GroupMessage')
        .select('id, groupId, senderId, content, mediaUrl, mediaType, createdAt')
        .eq('groupId', params.id)
        .order('createdAt', { ascending: true })
        .limit(100),
      supabase
        .from('GroupChat')
        .select('id, name, avatarUrl, createdBy')
        .eq('id', params.id)
        .single(),
      supabase
        .from('GroupMember')
        .select('userId, role')
        .eq('groupId', params.id),
    ]);

    // Enrich messages with sender info
    const senderIds = Array.from(new Set((messages ?? []).map(m => m.senderId)));
    const memberIds = (members ?? []).map(m => m.userId);
    const allUserIds = Array.from(new Set([...senderIds, ...memberIds]));

    const { data: users } = await supabase
      .from('User')
      .select('id, username, displayName, avatarUrl')
      .in('id', allUserIds);

    const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));

    const enrichedMessages = (messages ?? []).map(msg => ({
      ...msg,
      sender: userMap[msg.senderId] ?? { id: msg.senderId, username: 'unknown', displayName: null, avatarUrl: null },
    }));

    const enrichedMembers = (members ?? []).map(m => ({
      ...m,
      user: userMap[m.userId] ?? { id: m.userId, username: 'unknown', displayName: null, avatarUrl: null },
    }));

    return NextResponse.json({ messages: enrichedMessages, group, members: enrichedMembers, myId: dbUser.id });
  } catch (err) {
    console.error('[groups/messages] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/groups/[id]/messages
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id, username, displayName, avatarUrl').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify membership
    const { data: membership } = await supabase
      .from('GroupMember').select('id').eq('groupId', params.id).eq('userId', dbUser.id).single();
    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    const { content, mediaUrl, mediaType } = await req.json();
    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json({ error: 'content or media required' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('GroupMessage')
      .insert({
        id: genId(),
        groupId: params.id,
        senderId: dbUser.id,
        content: content?.trim() ?? '',
        ...(mediaUrl ? { mediaUrl, mediaType: mediaType ?? 'image' } : {}),
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      message: { ...message, sender: dbUser },
    });
  } catch (err) {
    console.error('[groups/messages] POST error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
