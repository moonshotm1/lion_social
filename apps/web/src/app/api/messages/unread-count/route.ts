export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let authUserId: string | null = null;
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
      if (user) authUserId = user.id;
    }
    if (!authUserId) {
      const { createSupabaseServerClient } = await import('@/lib/supabase');
      const authClient = await createSupabaseServerClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (user) authUserId = user.id;
    }

    if (!authUserId) return NextResponse.json({ count: 0 });

    const { data: dbUser } = await supabase
      .from('User').select('id').eq('supabaseId', authUserId).single();

    if (!dbUser) return NextResponse.json({ count: 0 });

    const { data: rows } = await supabase
      .from('Message')
      .select('id')
      .eq('recipientId', dbUser.id)
      .eq('read', false);

    return NextResponse.json({ count: rows?.length ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
