export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Returns { streak, longestStreak } for a given userId (db id)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ streak: 0, longestStreak: 0 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch all post dates for this user (most recent first)
    const { data: posts } = await supabase
      .from('Post')
      .select('createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (!posts?.length) return NextResponse.json({ streak: 0, longestStreak: 0 });

    // Collect unique UTC date strings (YYYY-MM-DD)
    const daySet = new Set<string>();
    for (const p of posts) {
      daySet.add(p.createdAt.slice(0, 10));
    }
    const days = Array.from(daySet).sort().reverse(); // newest first

    // Calculate current streak
    const todayUTC = new Date().toISOString().slice(0, 10);
    const yesterdayUTC = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Streak is alive if user posted today or yesterday
    let streak = 0;
    if (days[0] === todayUTC || days[0] === yesterdayUTC) {
      let cursor = new Date(days[0]);
      for (const day of days) {
        const d = new Date(day);
        const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
        if (diff <= 1) {
          streak++;
          cursor = d;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longest = 0;
    let run = 1;
    for (let i = 0; i < days.length - 1; i++) {
      const a = new Date(days[i]);
      const b = new Date(days[i + 1]);
      const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
      if (diff === 1) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }
    if (days.length === 1) longest = 1;
    if (streak > longest) longest = streak;

    return NextResponse.json({ streak, longestStreak: longest });
  } catch (err) {
    console.error('[streak] error:', err);
    return NextResponse.json({ streak: 0, longestStreak: 0 });
  }
}
