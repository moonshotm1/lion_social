export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: posts, error } = await supabase
      .from('Post')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[post/by-user] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!posts?.length) return NextResponse.json({ posts: [] })

    // Fetch user data
    const { data: user } = await supabase
      .from('User')
      .select('id, username, displayName, avatarUrl, bio')
      .eq('id', userId)
      .single()

    // Fetch like/comment counts
    const postIds = posts.map((p) => p.id)
    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabase.from('Like').select('postId').in('postId', postIds),
      supabase.from('Comment').select('postId').in('postId', postIds),
    ])

    const likeCountMap: Record<string, number> = {}
    const commentCountMap: Record<string, number> = {}
    ;(likes ?? []).forEach((l) => { likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1 })
    ;(comments ?? []).forEach((c) => { commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1 })

    const normalized = posts.map((post) => ({
      ...post,
      user: user ?? { id: userId, username: 'unknown', avatarUrl: null, bio: null },
      _count: {
        likes: likeCountMap[post.id] ?? 0,
        comments: commentCountMap[post.id] ?? 0,
        saves: 0,
      },
    }))

    return NextResponse.json({ posts: normalized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    console.error('[post/by-user] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
