export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, error: 'code is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inviter } = await supabase
    .from('User')
    .select('id, inviteCode, inviteCount, invitesUsed')
    .eq('inviteCode', code)
    .single();

  if (!inviter) {
    return NextResponse.json({ valid: false, error: 'Invalid invite code.' });
  }

  const remaining = (inviter.inviteCount ?? 5) - (inviter.invitesUsed ?? 0);
  if (remaining <= 0) {
    return NextResponse.json({ valid: false, error: 'This invite has reached its limit.' });
  }

  return NextResponse.json({ valid: true });
}
