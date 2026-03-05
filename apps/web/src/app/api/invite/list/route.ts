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

    if (!dbUser) return NextResponse.json({ invites: [] });

    const { data: invites } = await supabase
      .from('Invite')
      .select('code, createdAt, usedAt, usedById')
      .eq('invitedById', dbUser.id)
      .order('createdAt', { ascending: false });

    if (!invites?.length) return NextResponse.json({ invites: [] });

    const usedByIds = invites.filter(i => i.usedById).map(i => i.usedById as string);
    let userMap: Record<string, string> = {};
    if (usedByIds.length) {
      const { data: users } = await supabase
        .from('User')
        .select('id, username')
        .in('id', usedByIds);
      userMap = Object.fromEntries((users ?? []).map(u => [u.id, u.username]));
    }

    const result = invites.map(i => ({
      code: i.code,
      createdAt: i.createdAt,
      usedAt: i.usedAt,
      usedByUsername: i.usedById ? (userMap[i.usedById] ?? null) : null,
    }));

    return NextResponse.json({ invites: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list invites';
    console.error('[invite/list] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
