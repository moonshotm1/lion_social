export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { code: rawCode } = await req.json();
    if (!rawCode) return NextResponse.json({ error: 'code is required' }, { status: 400 });

    const code = rawCode.trim().toUpperCase();

    if (code.length < 3 || code.length > 20 || !/^[A-Z0-9]+$/.test(code)) {
      return NextResponse.json({ error: '3-20 characters, letters and numbers only' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: me } = await supabase
      .from('User')
      .select('id, inviteCode')
      .eq('supabaseId', authUser.id)
      .single();

    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('inviteCode', code)
      .single();

    if (existing && existing.id !== me.id) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('User')
      .update({ inviteCode: code })
      .eq('id', me.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, code });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update invite code';
    console.error('[invite/customize] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
