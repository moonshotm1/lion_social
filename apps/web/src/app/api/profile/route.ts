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

/** Resolve the authenticated Supabase user from either Bearer token or cookie session */
async function resolveAuthUser(req: NextRequest) {
  const supabase = getServiceClient()

  // Prefer Bearer token (works on all clients/devices)
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7))
    if (!error && user) return user
  }

  // Fall back to cookie session
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase')
    const authClient = await createSupabaseServerClient()
    const { data: { user }, error } = await authClient.auth.getUser()
    if (!error && user) return user
  } catch {
    // ignore
  }

  return null
}

/** GET /api/profile — return current user's profile */
export async function GET(req: NextRequest) {
  try {
    const authUser = await resolveAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data: user, error } = await supabase
      .from('User')
      .select('id, username, displayName, bio, avatarUrl, supabaseId, createdAt, inviteCode, inviteCount, invitesUsed')
      .eq('supabaseId', authUser.id)
      .single()

    if (error || !user) {
      console.error('[profile GET] DB error:', error?.message)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('[profile GET] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/** PATCH /api/profile — update current user's profile */
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await resolveAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as {
      username?: string
      displayName?: string
      bio?: string
      avatarUrl?: string
    }

    // Validate username if provided
    if (body.username !== undefined) {
      if (body.username.length < 3 || body.username.length > 30) {
        return NextResponse.json(
          { error: 'Username must be 3–30 characters' },
          { status: 400 }
        )
      }
      if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, and underscores' },
          { status: 400 }
        )
      }
    }

    const supabase = getServiceClient()

    // Check username uniqueness if changing
    if (body.username) {
      const { data: existing } = await supabase
        .from('User')
        .select('id')
        .eq('username', body.username)
        .neq('supabaseId', authUser.id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, string> = {}
    if (body.username !== undefined) updates.username = body.username
    if (body.displayName !== undefined) updates.displayName = body.displayName
    if (body.bio !== undefined) updates.bio = body.bio
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl

    const { data: updated, error: updateError } = await supabase
      .from('User')
      .update(updates)
      .eq('supabaseId', authUser.id)
      .select('id, username, displayName, bio, avatarUrl, supabaseId, createdAt')
      .single()

    if (updateError) {
      console.error('[profile PATCH] DB error:', updateError.message)
      throw updateError
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[profile PATCH] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update profile' },
      { status: 500 }
    )
  }
}
