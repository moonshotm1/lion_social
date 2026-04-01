export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function normalizePosts(
  supabase: ReturnType<typeof getSupabase>,
  posts: any[],
  viewerDbId: string | null
) {
  if (!posts.length) return []

  const userIds = Array.from(new Set(posts.map((p) => p.userId)))
  const postIds = posts.map((p) => p.id)

  const [{ data: users }, { data: follows }, { data: countRows }] = await Promise.all([
    supabase.from('User').select('id, username, displayName, avatarUrl, bio').in('id', userIds),
    supabase.from('Follow').select('followingId').in('followingId', userIds),
    supabase.from('Post').select('id, likes:Like(count), comments:Comment(count), views:PostView(count)').in('id', postIds),
  ])

  let viewerLikedSet = new Set<string>()
  let viewerSavedSet = new Set<string>()
  if (viewerDbId) {
    const [{ data: viewerLikes }, { data: viewerSaves }] = await Promise.all([
      supabase.from('Like').select('postId').eq('userId', viewerDbId).in('postId', postIds),
      supabase.from('Save').select('postId').eq('userId', viewerDbId).in('postId', postIds),
    ])
    viewerLikedSet = new Set((viewerLikes ?? []).map((l: { postId: string }) => l.postId))
    viewerSavedSet = new Set((viewerSaves ?? []).map((s: { postId: string }) => s.postId))
  }

  // Build follower count map: how many people follow each user
  const followerCountMap: Record<string, number> = {}
  ;(follows ?? []).forEach((f: any) => {
    followerCountMap[f.followingId] = (followerCountMap[f.followingId] ?? 0) + 1
  })

  const userMap: Record<string, any> = Object.fromEntries(
    (users ?? []).map((u: any) => [u.id, {
      ...u,
      _count: { followers: followerCountMap[u.id] ?? 0, following: 0, posts: 0 },
    }])
  )

  const countMap: Record<string, { likes: number; comments: number; views: number }> = {}
  ;(countRows ?? []).forEach((row: any) => {
    countMap[row.id] = {
      likes:    Number(row.likes?.[0]?.count    ?? 0),
      comments: Number(row.comments?.[0]?.count ?? 0),
      views:    Number(row.views?.[0]?.count    ?? 0),
    }
  })

  return posts.map((post) => ({
    ...post,
    viewCount:    countMap[post.id]?.views    ?? 0,
    isLiked:      viewerLikedSet.has(post.id),
    isBookmarked: viewerSavedSet.has(post.id),
    user: userMap[post.userId] ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null, _count: { followers: 0, following: 0, posts: 0 } },
    _count: {
      likes:    countMap[post.id]?.likes    ?? 0,
      comments: countMap[post.id]?.comments ?? 0,
      saves: 0,
    },
  }))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 50)
    const type = searchParams.get('type')

    const supabase = getSupabase()

    // Resolve optional viewer from Bearer token so we can return isLiked/isBookmarked
    let viewerDbId: string | null = null
    const auth = req.headers.get('authorization')
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7)
        const { data: { user: authUser } } = await supabase.auth.getUser(token)
        if (authUser) {
          const { data: dbUser } = await supabase
            .from('User').select('id').eq('supabaseId', authUser.id).single()
          viewerDbId = dbUser?.id ?? null
        }
      } catch { /* non-fatal */ }
    }

    let query = supabase
      .from('Post')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: posts, error } = await query
    if (error) {
      console.error('[post/feed] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalized = await normalizePosts(supabase, posts ?? [], viewerDbId)
    return NextResponse.json({ posts: normalized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    console.error('[post/feed] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
