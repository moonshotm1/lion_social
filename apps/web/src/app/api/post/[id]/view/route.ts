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

    // UPSERT: on conflict (postId, userId) do nothing — enforces unique view per user
    const { error: upsertErr } = await supabase
      .from('PostView')
      .upsert(
        { id: genId(), postId, userId: dbUser.id, createdAt: new Date().toISOString() },
        { onConflict: 'postId,userId', ignoreDuplicates: true }
      );

    if (upsertErr) {
      // If PostView table doesn't exist yet (migration not run), log but don't fail
      console.error('[view] PostView upsert error:', upsertErr.message, 'code:', upsertErr.code);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[view] Threw:', err);
    return NextResponse.json({ ok: false });
  }
}
