export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = getServiceClient();

    // Resolve auth from Authorization header (sent by browser client)
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = auth.slice(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: existing, error: selectErr } = await supabase
      .from('Save')
      .select('id')
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .single();

    if (selectErr && selectErr.code !== 'PGRST116') {
      // PGRST116 = "no rows" — expected when not yet saved
      console.error('[save] select error:', JSON.stringify(selectErr));
      return NextResponse.json({ error: selectErr.message }, { status: 500 });
    }

    if (existing) {
      const { error: deleteErr } = await supabase.from('Save').delete().eq('id', existing.id);
      if (deleteErr) console.error('[save] delete error:', JSON.stringify(deleteErr));
      return NextResponse.json({ saved: false });
    }

    const now = new Date().toISOString();
    const { error: insertErr } = await supabase
      .from('Save')
      .insert({ id: genId(), userId: dbUser.id, postId, createdAt: now });
    if (insertErr) {
      console.error('[save] insert error:', JSON.stringify(insertErr));
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    return NextResponse.json({ saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle save';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
