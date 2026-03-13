export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

/**
 * GET /api/stories?userIds=id1,id2,...
 * Returns active (non-expired) stories for the given user IDs, with user info joined.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdsParam = searchParams.get('userIds')
    if (!userIdsParam) {
      return NextResponse.json({ stories: [] })
    }

    const userIds = userIdsParam.split(',').filter(Boolean)
    if (userIds.length === 0) {
      return NextResponse.json({ stories: [] })
    }

    const supabase = getServiceSupabase()
    const now = new Date().toISOString()

    const { data: stories, error } = await supabase
      .from('Story')
      .select(`
        id,
        userId,
        mediaUrl,
        text,
        createdAt,
        expiresAt,
        user:User!inner(id, username, displayName, avatarUrl)
      `)
      .in('userId', userIds)
      .gt('expiresAt', now)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[stories GET] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    return NextResponse.json({ stories: stories ?? [] })
  } catch (err) {
    console.error('[stories GET] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories
 * Body: { text?: string, mediaUrl?: string }
 * Creates a story that expires in 24 hours.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceSupabase()

    // Look up internal user ID
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json() as { text?: string; mediaUrl?: string }

    if (!body.text && !body.mediaUrl) {
      return NextResponse.json(
        { error: 'Story must have either text or media' },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // +24 hours

    const storyId = crypto.randomUUID()

    const { data: story, error: insertError } = await supabase
      .from('Story')
      .insert({
        id: storyId,
        userId: dbUser.id,
        mediaUrl: body.mediaUrl ?? null,
        text: body.text ?? null,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })
      .select('id, userId, mediaUrl, text, createdAt, expiresAt')
      .single()

    if (insertError) {
      console.error('[stories POST] DB error:', insertError.message)
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
    }

    return NextResponse.json({ story }, { status: 201 })
  } catch (err) {
    console.error('[stories POST] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create story' },
      { status: 500 }
    )
  }
}
