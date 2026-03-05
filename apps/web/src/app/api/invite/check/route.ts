export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const raw = searchParams.get('code')?.trim();
    if (!raw) return NextResponse.json({ available: false, error: 'code is required' }, { status: 400 });

    const code = raw.toUpperCase();

    if (code.length < 3 || code.length > 20 || !/^[A-Z0-9]+$/.test(code)) {
      return NextResponse.json({ available: false, error: 'Invalid format' });
    }

    const { createSupabaseServerClient } = await import('@/lib/supabase');
    const authClient = await createSupabaseServerClient();
    const { data: { user: authUser } } = await authClient.auth.getUser();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let currentUserId: string | null = null;
    if (authUser) {
      const { data: me } = await supabase.from('User').select('id').eq('supabaseId', authUser.id).single();
      currentUserId = me?.id ?? null;
    }

    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('inviteCode', code)
      .single();

    const available = !existing || existing.id === currentUserId;
    return NextResponse.json({ available });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check failed';
    return NextResponse.json({ available: false, error: message }, { status: 500 });
  }
}
