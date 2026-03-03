import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucket(supabase: any, bucket: string, isVideo: boolean) {
  console.log(`[upload] Ensuring bucket exists: ${bucket}`)
  const sizeLimit = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  const allowedMimeTypes = bucket === 'avatars'
    ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
       'video/mp4', 'video/quicktime', 'video/avi', 'video/webm']

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: sizeLimit,
    allowedMimeTypes,
  })

  if (createError) {
    if (createError.message.toLowerCase().includes('already exists')) {
      console.log(`[upload] Bucket "${bucket}" already exists — updating settings`)
      await supabase.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: sizeLimit,
        allowedMimeTypes,
      })
    } else {
      console.error(`[upload] Bucket creation error:`, createError.message)
    }
  } else {
    console.log(`[upload] Bucket "${bucket}" created successfully`)
  }
}

export async function POST(request: NextRequest) {
  console.log('[upload] POST /api/upload called')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[upload] Supabase URL set:', !!supabaseUrl)
    console.log('[upload] Service role key set:', !!serviceRoleKey)

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[upload] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Storage not configured — missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('[upload] Supabase client created')

    console.log('[upload] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucketParam = (formData.get('bucket') as string | null) ?? 'posts'

    console.log('[upload] File received:', file?.name, file?.size, file?.type)
    console.log('[upload] Bucket requested:', bucketParam)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Sanitise bucket name
    const bucket = ['posts', 'avatars'].includes(bucketParam) ? bucketParam : 'posts'
    console.log('[upload] Using bucket:', bucket)

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      console.error('[upload] Unsupported file type:', file.type)
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      )
    }

    if (bucket === 'avatars' && !isImage) {
      return NextResponse.json(
        { error: 'Avatars must be image files' },
        { status: 400 }
      )
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      const limit = isVideo ? '50 MB' : '10 MB'
      console.error(`[upload] File too large: ${file.size} bytes (max ${maxSize})`)
      return NextResponse.json(
        { error: `File too large. Maximum size is ${limit}` },
        { status: 400 }
      )
    }

    // Ensure bucket exists with correct settings
    await ensureBucket(supabase, bucket, isVideo)

    console.log('[upload] Reading file as ArrayBuffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('[upload] Buffer size:', buffer.length)

    const ext = file.name.split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg')
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    console.log('[upload] Uploading to path:', fileName)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: bucket === 'avatars',
      })

    if (error) {
      console.error('[upload] Supabase storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[upload] Upload successful, path:', data.path)

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[upload] Public URL:', urlData.publicUrl)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('[upload] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
