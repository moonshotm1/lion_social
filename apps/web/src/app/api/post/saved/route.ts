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

    // Get saved post IDs
    const { data: saves, error: savesError } = await supabase
      .from('Save')
      .select('postId')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (savesError) throw savesError
    if (!saves?.length) return NextResponse.json({ posts: [] })

    const postIds = saves.map((s) => s.postId)

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

    // Fetch like/comment/save counts + user's likes for isLiked
    const [{ data: likes }, { data: comments }, { data: allSaves }, { data: userLikes }] = await Promise.all([
      supabase.from('Like').select('postId').in('postId', postIds),
      supabase.from('Comment').select('postId').in('postId', postIds),
      supabase.from('Save').select('postId').in('postId', postIds),
      supabase.from('Like').select('postId').eq('userId', userId).in('postId', postIds),
    ])

    const likeCountMap: Record<string, number> = {}
    const commentCountMap: Record<string, number> = {}
    const saveCountMap: Record<string, number> = {}
    ;(likes ?? []).forEach((l) => { likeCountMap[l.postId] = (likeCountMap[l.postId] ?? 0) + 1 })
    ;(comments ?? []).forEach((c) => { commentCountMap[c.postId] = (commentCountMap[c.postId] ?? 0) + 1 })
    ;(allSaves ?? []).forEach((s) => { saveCountMap[s.postId] = (saveCountMap[s.postId] ?? 0) + 1 })
    const userLikedSet = new Set((userLikes ?? []).map((l: any) => l.postId))

    // Sort posts in saved order (most recently saved first)
    const postMap = Object.fromEntries(posts.map((p) => [p.id, p]))
    const normalized = postIds
      .filter((id) => postMap[id])
      .map((postId) => {
        const post = postMap[postId]
        return {
          ...post,
          user: userMap[post.userId] ?? { id: post.userId, username: 'unknown', avatarUrl: null, bio: null },
          isLiked: userLikedSet.has(post.id),
          isBookmarked: true,
          _count: {
            likes: likeCountMap[post.id] ?? 0,
            comments: commentCountMap[post.id] ?? 0,
            saves: saveCountMap[post.id] ?? 0,
          },
        }
      })

    return NextResponse.json({ posts: normalized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch saved posts'
    console.error('[post/saved] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
