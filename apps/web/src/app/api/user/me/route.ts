export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase')
    const authClient = await createSupabaseServerClient()
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await supabase
      .from('User')
      .select('id, username, bio, avatarUrl, supabaseId, createdAt, inviteCode, inviteCount, invitesUsed')
      .eq('supabaseId', authUser.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
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
    const message = err instanceof Error ? err.message : 'Failed to fetch current user'
    console.error('[user/me] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
