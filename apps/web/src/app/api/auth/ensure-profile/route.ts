export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user }, error } = await authClient.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', user.id)
      .single();

    if (!existing) {
      const rawUsername =
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        `user${user.id.slice(0, 8)}`;

      // Sanitize: lowercase, alphanumeric + underscore only
      const username = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || `user${user.id.slice(0, 8)}`;

      // Generate invite code (uppercase, no special chars)
      let inviteCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
      if (inviteCode.length < 3) inviteCode = `USER${inviteCode}`;

      // Check uniqueness of invite code; append random suffix if taken
      const { data: codeConflict } = await supabase
        .from('User')
        .select('id')
        .eq('inviteCode', inviteCode)
        .single();

      if (codeConflict) {
        inviteCode = `${inviteCode.slice(0, 16)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      }

      const now = new Date().toISOString();
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);

      await supabase.from('User').insert({
        id,
        supabaseId: user.id,
        username,
        inviteCode,
        inviteCount: 5,
        invitesUsed: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to ensure profile';
    console.error('[ensure-profile] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
