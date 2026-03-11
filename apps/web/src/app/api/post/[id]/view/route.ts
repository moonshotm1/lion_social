export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const postId = params.id;

    // Read current viewCount then increment
    const { data: post, error: readErr } = await supabase
      .from('Post')
      .select('viewCount')
      .eq('id', postId)
      .single();

    if (readErr) {
      console.error('[view] Read error:', readErr.message, 'postId:', postId);
      return NextResponse.json({ ok: false });
    }

    const { error: updateErr } = await supabase
      .from('Post')
      .update({ viewCount: (post?.viewCount ?? 0) + 1 })
      .eq('id', postId);

    if (updateErr) {
      console.error('[view] Update error:', updateErr.message, 'postId:', postId);
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[view] Threw:', err);
    return NextResponse.json({ ok: false });
  }
}
