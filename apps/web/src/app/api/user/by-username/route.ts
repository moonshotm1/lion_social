export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const username = searchParams.get('username')
    if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await supabase
      .from('User')
      .select('id, username, bio, avatarUrl, createdAt')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get counts
    const [
      { count: postsCount },
      { count: followersCount },
      { count: followingCount },
    ] = await Promise.all([
      supabase.from('Post').select('*', { count: 'exact', head: true }).eq('userId', user.id),
      supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('followingId', user.id),
      supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('followerId', user.id),
    ])

    return NextResponse.json({
      ...user,
      _count: {
        posts: postsCount ?? 0,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user'
    console.error('[user/by-username] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
