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

// GET /api/groups — list groups I'm a member of
export async function GET(req: NextRequest) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ groups: [] });

    // Groups I'm a member of
    const { data: memberships } = await supabase
      .from('GroupMember')
      .select('groupId, role')
      .eq('userId', dbUser.id);

    if (!memberships?.length) return NextResponse.json({ groups: [] });

    const groupIds = memberships.map(m => m.groupId);

    // Fetch group details
    const { data: groups } = await supabase
      .from('GroupChat')
      .select('id, name, avatarUrl, createdBy, createdAt')
      .in('id', groupIds);

    // Latest message per group
    const { data: latestMessages } = await supabase
      .from('GroupMessage')
      .select('id, groupId, senderId, content, mediaUrl, mediaType, createdAt')
      .in('groupId', groupIds)
      .order('createdAt', { ascending: false });

    type LatestMsg = { id: string; groupId: string; senderId: string; content: string; mediaUrl: string | null; mediaType: string | null; createdAt: string };
    const latestMap: Record<string, LatestMsg> = {};
    for (const msg of (latestMessages ?? [])) {
      if (!latestMap[msg.groupId]) latestMap[msg.groupId] = msg;
    }

    // Member counts
    const { data: allMembers } = await supabase
      .from('GroupMember')
      .select('groupId, userId')
      .in('groupId', groupIds);

    const memberCountMap: Record<string, number> = {};
    for (const m of (allMembers ?? [])) {
      memberCountMap[m.groupId] = (memberCountMap[m.groupId] ?? 0) + 1;
    }

    const enriched = (groups ?? []).map(g => {
      const latest = latestMap[g.id];
      return {
        id: g.id,
        name: g.name,
        avatarUrl: g.avatarUrl,
        memberCount: memberCountMap[g.id] ?? 0,
        lastMessage: latest
          ? (latest.content || (latest.mediaType === 'video' ? '🎥 Video' : '📷 Photo'))
          : null,
        lastMessageAt: latest?.createdAt ?? g.createdAt,
        isAdmin: memberships.find(m => m.groupId === g.id)?.role === 'admin',
      };
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ groups: enriched });
  } catch (err) {
    console.error('[groups] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups — create a group
export async function POST(req: NextRequest) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { name, memberIds } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 });

    const groupId = genId();

    await supabase.from('GroupChat').insert({
      id: groupId,
      name: name.trim(),
      createdBy: dbUser.id,
    });

    // Add creator as admin + all other members
    const uniqueIds = Array.from(new Set([dbUser.id, ...(memberIds ?? [])]));
    await supabase.from('GroupMember').insert(
      uniqueIds.map(uid => ({
        id: genId(),
        groupId,
        userId: uid,
        role: uid === dbUser.id ? 'admin' : 'member',
      }))
    );

    return NextResponse.json({ groupId });
  } catch (err) {
    console.error('[groups] POST error:', err);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
