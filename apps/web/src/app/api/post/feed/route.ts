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

async function normalizePosts(supabase: ReturnType<typeof getSupabase>, posts: any[]) {
  if (!posts.length) return []

  const userIds = Array.from(new Set(posts.map((p) => p.userId)))
  const postIds = posts.map((p) => p.id)

  const [{ data: users }, { data: likes }, { data: comments }, { data: follows }, { data: views }] = await Promise.all([
    supabase.from('User').select('id, username, avatarUrl, bio').in('id', userIds),
    supabase.from('Like').select('postId').in('postId', postIds),
    supabase.from('Comment').select('postId').in('postId', postIds),
    // Count followers for each author so Featured Creators shows real counts
    supabase.from('Follow').select('followingId').in('followingId', userIds),
    // Unique view counts from PostView table (falls back gracefully if table missing)
    supabase.from('PostView').select('postId').in('postId', postIds).then((r) => r, () => ({ data: null })),
  ])

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

  const likeCountMap: Record<string, number> = {}
  const commentCountMap: Record<string, number> = {}
  const viewCountMap: Record<string, number> = {}
  ;(likes ?? []).forEach((l: any) => { likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1 })
  ;(comments ?? []).forEach((c: any) => { commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1 })
  ;((views as any[]) ?? []).forEach((v: any) => { viewCountMap[v.postId] = (viewCountMap[v.postId] ?? 0) + 1 })

  return posts.map((post) => ({
    ...post,
    // View count = unique viewers from PostView table only
    viewCount: viewCountMap[post.id] ?? 0,
    user: userMap[post.userId] ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null, _count: { followers: 0, following: 0, posts: 0 } },
    _count: {
      likes: likeCountMap[post.id] ?? 0,
      comments: commentCountMap[post.id] ?? 0,
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

    const normalized = await normalizePosts(supabase, posts ?? [])
    console.log(`[post/feed] Returning ${normalized.length} posts`)
    return NextResponse.json({ posts: normalized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    console.error('[post/feed] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
