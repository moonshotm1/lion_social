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

// POST /api/groups/[id]/members — add a member (admin only)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Insert — ignore if already a member
    await supabase.from('GroupMember').upsert({
      id: genId(),
      groupId: params.id,
      userId,
      role: 'member',
    }, { onConflict: 'groupId,userId', ignoreDuplicates: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[groups/members] POST error:', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members — leave or remove
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { supabase, authUserId } = await resolveUser(req);
    if (!authUserId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { userId } = await req.json();
    const targetId = userId ?? dbUser.id; // default to self (leave)

    await supabase.from('GroupMember')
      .delete()
      .eq('groupId', params.id)
      .eq('userId', targetId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[groups/members] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
