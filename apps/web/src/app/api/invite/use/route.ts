export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

    const normalizedCode = code.trim().toUpperCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

    const { data: inviter } = await supabase
      .from('User')
      .select('id, inviteCount, invitesUsed')
      .eq('inviteCode', normalizedCode)
      .single();

    if (!inviter) return NextResponse.json({ error: 'Invalid invite code.' }, { status: 400 });

    const remaining = (inviter.inviteCount ?? 5) - (inviter.invitesUsed ?? 0);
    if (remaining <= 0) return NextResponse.json({ error: 'This invite has reached its limit.' }, { status: 400 });

    const now = new Date().toISOString();
    const inviteId = Date.now().toString(36) + Math.random().toString(36).slice(2);

    await supabase.from('Invite').insert({
      id: inviteId,
      code: normalizedCode,
      invitedById: inviter.id,
      usedById: dbUser.id,
      usedAt: now,
      createdAt: now,
    });

    await supabase
      .from('User')
      .update({ invitesUsed: (inviter.invitesUsed ?? 0) + 1 })
      .eq('id', inviter.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to use invite';
    console.error('[invite/use] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
