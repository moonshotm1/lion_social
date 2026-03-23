export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve optional reporter from Bearer token
    let reporterDbId: string | null = null;
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        if (authUser) {
          const { data: dbUser } = await supabase
            .from('User').select('id').eq('supabaseId', authUser.id).single();
          reporterDbId = dbUser?.id ?? null;
        }
      } catch { /* non-fatal */ }
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 100) : 'No reason given';

    // Store report — silently ignore if Report table doesn't exist yet
    await supabase.from('Report').insert({
      id: genId(),
      postId,
      reporterId: reporterDbId,
      reason,
      createdAt: new Date().toISOString(),
    }).then(() => {}).catch(() => {});

    return NextResponse.json({ reported: true });
  } catch {
    // Always return success to the client — no need to surface errors for reports
    return NextResponse.json({ reported: true });
  }
}
