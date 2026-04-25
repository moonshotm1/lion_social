export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const postId = params.id;

    // Only count authenticated views (unique per user, matching Instagram/X behaviour)
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ ok: true }); // unauthenticated — skip silently
    }

    const token = auth.slice(7);
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authUser) {
      console.error('[view] auth error:', authErr?.message ?? 'no user');
      return NextResponse.json({ ok: true }); // non-fatal
    }

    const { data: dbUser, error: userErr } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();

    if (userErr || !dbUser) {
      console.error('[view] User lookup error:', userErr?.message ?? 'not found', 'supabaseId:', authUser.id);
      return NextResponse.json({ ok: true }); // non-fatal
    }

    // --- Reliable deduplication: select-then-insert ---
    // UPSERT with onConflict is unreliable for camelCase column names across
    // PostgREST versions. Instead: check for existing row, insert only if absent.

    const { data: existing } = await supabase
      .from('PostView')
      .select('id')
      .eq('postId', postId)
      .eq('userId', dbUser.id)
      .maybeSingle();

    if (existing) {
      // Already viewed by this user — no-op
      return NextResponse.json({ ok: true });
    }

    const { error: insertErr } = await supabase
      .from('PostView')
      .insert({ id: genId(), postId, userId: dbUser.id });

    if (insertErr) {
      if (insertErr.code === '23505') {
        // Race condition: concurrent request already inserted — ignore
        return NextResponse.json({ ok: true });
      }
      console.error('[view] Insert error:', insertErr.message, 'code:', insertErr.code,
        'postId:', postId, 'userId:', dbUser.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[view] Threw:', err);
    return NextResponse.json({ ok: false });
  }
}
