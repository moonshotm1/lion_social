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

    // Read current viewCount then increment (atomic enough for view tracking)
    const { data: post } = await supabase
      .from('Post')
      .select('viewCount')
      .eq('id', params.id)
      .single();

    await supabase
      .from('Post')
      .update({ viewCount: (post?.viewCount ?? 0) + 1 })
      .eq('id', params.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
