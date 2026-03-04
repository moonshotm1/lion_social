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

    // Get liked post IDs
    const { data: likes, error: likesError } = await supabase
      .from('Like')
      .select('postId')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (likesError) throw likesError
    if (!likes?.length) return NextResponse.json({ posts: [] })

    const postIds = likes.map((l) => l.postId)

    // Fetch the actual posts
    const { data: posts, error: postsError } = await supabase
      .from('Post')
      .select('*')
      .in('id', postIds)

    if (postsError) throw postsError
    if (!posts?.length) return NextResponse.json({ posts: [] })

    // Fetch users
    const userIds = Array.from(new Set(posts.map((p) => p.userId)))
    const { data: users } = await supabase
      .from('User')
      .select('id, username, avatarUrl, bio')
      .in('id', userIds)

    const userMap: Record<string, any> = Object.fromEntries((users ?? []).map((u) => [u.id, u]))

    // Fetch like/comment counts
    const [{ data: allLikes }, { data: allComments }] = await Promise.all([
      supabase.from('Like').select('postId').in('postId', postIds),
      supabase.from('Comment').select('postId').in('postId', postIds),
    ])

    const likeCountMap: Record<string, number> = {}
    const commentCountMap: Record<string, number> = {}
    ;(allLikes ?? []).forEach((l) => { likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1 })
    ;(allComments ?? []).forEach((c) => { commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1 })

    // Sort posts in the same order as liked (most recently liked first)
    const postMap = Object.fromEntries(posts.map((p) => [p.id, p]))
    const normalized = postIds
      .filter((id) => postMap[id])
      .map((postId) => {
        const post = postMap[postId]
        return {
          ...post,
          user: userMap[post.userId] ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null },
          _count: {
            likes: likeCountMap[post.id] ?? 0,
            comments: commentCountMap[post.id] ?? 0,
            saves: 0,
          },
        }
      })

    return NextResponse.json({ posts: normalized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch liked posts'
    console.error('[post/liked] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
