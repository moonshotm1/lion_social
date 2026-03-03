export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate via cookie session
    const { createSupabaseServerClient } = await import('@/lib/supabase')
    const authClient = await createSupabaseServerClient()
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser()

    if (authError || !authUser) {
      console.error('[post/create] Auth error:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      type: 'workout' | 'meal' | 'quote' | 'story'
      caption: string
      imageUrl?: string
      metadata?: Record<string, unknown>
    }

    if (!body.type || !body.caption?.trim()) {
      return NextResponse.json({ error: 'type and caption are required' }, { status: 400 })
    }

    if (body.caption.length > 2000) {
      return NextResponse.json({ error: 'Caption too long (max 2000 characters)' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Look up internal user id
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', authUser.id)
      .single()

    if (userError || !dbUser) {
      console.error('[post/create] User lookup error:', userError?.message)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

    const { data: post, error: insertError } = await supabase
      .from('Post')
      .insert({
        id,
        userId: dbUser.id,
        type: body.type,
        caption: body.caption.trim(),
        imageUrl: body.imageUrl ?? null,
        metadata: body.metadata ?? null,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[post/create] Insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(post)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    console.error('[post/create] Unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
