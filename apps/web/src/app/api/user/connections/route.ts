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

    // Fetch user IDs from Follow table, then fetch User records for each.
    // We fetch ALL follow rows first, then look up all user records in a single query.
    // Filter out any null/undefined IDs to guard against orphaned records.
    let userIds: string[] = []

    if (type === 'followers') {
      // People who follow userId → followingId = userId
      const { data: rows, error } = await supabase
        .from('Follow')
        .select('followerId')
        .eq('followingId', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      userIds = (rows ?? []).map((r: any) => r.followerId).filter(Boolean)
    } else {
      // People userId follows → followerId = userId
      const { data: rows, error } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      userIds = (rows ?? []).map((r: any) => r.followingId).filter(Boolean)
    }

    if (userIds.length === 0) return NextResponse.json({ users: [] })

    // Deduplicate just in case
    const uniqueIds = [...new Set(userIds)]

    // Fetch all matching User records in one query
    const { data: users, error: usersErr } = await supabase
      .from('User')
      .select('id, username, displayName, avatarUrl, bio')
      .in('id', uniqueIds)

    if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

    const foundUsers = users ?? []

    // Log a warning if counts don't match (indicates orphaned Follow records)
    if (foundUsers.length !== uniqueIds.length) {
      const missing = uniqueIds.filter(id => !foundUsers.find((u: any) => u.id === id))
      console.warn(
        `[connections] ${type} for userId=${userId}: ` +
        `Follow table has ${uniqueIds.length} entries but only ${foundUsers.length} User records found. ` +
        `Missing user IDs: ${missing.join(', ')}`
      )
    }

    // Resolve isFollowing for each user (viewer → that user)
    const foundUserIds = foundUsers.map((u: any) => u.id)
    let viewerFollowingSet = new Set<string>()
    if (viewerDbId && foundUserIds.length > 0) {
      const { data: viewerFollows } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', viewerDbId)
        .in('followingId', foundUserIds)
      for (const f of (viewerFollows ?? [])) {
        viewerFollowingSet.add(f.followingId)
      }
    }

    const result = foundUsers.map((u: any) => ({
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
    console.error('[connections] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
