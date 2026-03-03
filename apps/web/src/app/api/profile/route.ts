export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

async function getAuthUser() {
  const { createSupabaseServerClient } = await import('@/lib/supabase')
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/** GET /api/profile — return current user's profile */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@lion/database')
    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })

    if (!user) {
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
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      username?: string
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

    const { prisma } = await import('@lion/database')

    // Check username uniqueness if changing
    if (body.username) {
      const existing = await prisma.user.findUnique({
        where: { username: body.username },
      })
      const currentUser = await prisma.user.findUnique({
        where: { supabaseId: authUser.id },
        select: { id: true },
      })
      if (existing && existing.id !== currentUser?.id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.user.update({
      where: { supabaseId: authUser.id },
      data: {
        ...(body.username !== undefined && { username: body.username }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[profile PATCH] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update profile' },
      { status: 500 }
    )
  }
}
