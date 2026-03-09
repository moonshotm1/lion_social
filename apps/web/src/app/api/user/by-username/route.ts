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

    // Fetch follower/following/post IDs in parallel (count via array length — more reliable than HEAD count)
    const [
      { data: postsData, error: postsErr },
      { data: followersData, error: followersErr },
      { data: followingData, error: followingErr },
    ] = await Promise.all([
      supabase.from('Post').select('id').eq('userId', user.id),
      supabase.from('Follow').select('id').eq('followingId', user.id),
      supabase.from('Follow').select('id').eq('followerId', user.id),
    ])

    if (postsErr) console.error('[by-username] posts count error:', postsErr.message)
    if (followersErr) console.error('[by-username] followers count error:', followersErr.message)
    if (followingErr) console.error('[by-username] following count error:', followingErr.message)

    const postsCount = postsData?.length ?? 0
    const followersCount = followersData?.length ?? 0
    const followingCount = followingData?.length ?? 0

    // Optionally resolve whether the requesting viewer follows this user
    let isFollowing = false
    const auth = req.headers.get('authorization')
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7)
        const { data: { user: authUser } } = await supabase.auth.getUser(token)
        if (authUser) {
          const { data: viewer } = await supabase
            .from('User')
            .select('id')
            .eq('supabaseId', authUser.id)
            .single()
          if (viewer && viewer.id !== user.id) {
            const { data: follow } = await supabase
              .from('Follow')
              .select('id')
              .eq('followerId', viewer.id)
              .eq('followingId', user.id)
              .single()
            isFollowing = !!follow
          }
        }
      } catch {
        // Non-fatal — viewer follow state defaults to false
      }
    }

    return NextResponse.json({
      ...user,
      isFollowing,
      _count: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user'
    console.error('[user/by-username] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
