export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/user/connections?userId=<id>&type=followers|following
// Returns a list of users who follow (or are followed by) the given userId.
// Optionally resolves isFollowing for the requesting viewer.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'followers' | 'following'

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    if (type !== 'followers' && type !== 'following') {
      return NextResponse.json({ error: 'type must be followers or following' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Resolve optional viewer from Bearer token for isFollowing computation
    let viewerDbId: string | null = null
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
          viewerDbId = viewer?.id ?? null
        }
      } catch {
        // Non-fatal
      }
    }

    // For 'followers': people who follow this user → followingId = userId, join followerId → User
    // For 'following': people this user follows → followerId = userId, join followingId → User
    let userIds: string[] = []

    if (type === 'followers') {
      const { data: rows, error } = await supabase
        .from('Follow')
        .select('followerId')
        .eq('followingId', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      userIds = (rows ?? []).map((r: any) => r.followerId)
    } else {
      const { data: rows, error } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      userIds = (rows ?? []).map((r: any) => r.followingId)
    }

    if (userIds.length === 0) return NextResponse.json({ users: [] })

    // Fetch user records
    const { data: users, error: usersErr } = await supabase
      .from('User')
      .select('id, username, displayName, avatarUrl, bio')
      .in('id', userIds)

    if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

    // Resolve isFollowing for each user (viewer → that user)
    let viewerFollowingSet = new Set<string>()
    if (viewerDbId && userIds.length > 0) {
      const { data: viewerFollows } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', viewerDbId)
        .in('followingId', userIds)
      for (const f of (viewerFollows ?? [])) {
        viewerFollowingSet.add(f.followingId)
      }
    }

    const result = (users ?? []).map((u: any) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName ?? u.username,
      avatarUrl: u.avatarUrl ?? null,
      bio: u.bio ?? '',
      isFollowing: viewerFollowingSet.has(u.id),
      isSelf: u.id === viewerDbId,
    }))

    return NextResponse.json({ users: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch connections'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
