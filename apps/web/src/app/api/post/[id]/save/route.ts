export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

    // Delete-first toggle (mirrors like route)
    const { data: deleted, error: deleteErr } = await supabase
      .from('Save')
      .delete()
      .eq('userId', dbUser.id)
      .eq('postId', postId)
      .select('id');

    if (deleteErr) {
      console.error('[save] delete error:', JSON.stringify(deleteErr));
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (deleted && deleted.length > 0) {
      return NextResponse.json({ saved: false });
    }

    // Was not saved — insert (let DB supply id + createdAt defaults)
    const { error: insertErr } = await supabase
      .from('Save')
      .insert({ userId: dbUser.id, postId });

    if (insertErr) {
      if (insertErr.code === '23505') return NextResponse.json({ saved: true });
      console.error('[save] insert error:', JSON.stringify(insertErr));
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle save';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
