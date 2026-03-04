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

  const [{ data: users }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from('User').select('id, username, avatarUrl, bio').in('id', userIds),
    supabase.from('Like').select('postId').in('postId', postIds),
    supabase.from('Comment').select('postId').in('postId', postIds),
  ])

  const userMap: Record<string, any> = Object.fromEntries((users ?? []).map((u) => [u.id, u]))
  const likeCountMap: Record<string, number> = {}
  const commentCountMap: Record<string, number> = {}
  ;(likes ?? []).forEach((l) => { likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1 })
  ;(comments ?? []).forEach((c) => { commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1 })

  return posts.map((post) => ({
    ...post,
    user: userMap[post.userId] ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null },
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
