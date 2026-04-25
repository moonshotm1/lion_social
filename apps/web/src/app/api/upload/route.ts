import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Missing service role key' },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucketParam = (formData.get('bucket') as string | null) ?? 'posts'
    const bucket = ['posts', 'avatars', 'messages'].includes(bucketParam) ? bucketParam : 'posts'

    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    console.log('[upload] file:', file.name, file.size, file.type, '→ bucket:', bucket)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      console.error('[upload] storage error:', error.message)
      throw error
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    console.log('[upload] public URL:', data.publicUrl)
    return NextResponse.json({ url: data.publicUrl })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[upload] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
