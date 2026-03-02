-- ============================================================
-- Supabase Storage Setup for Gains
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Create the "posts" bucket (images + videos, 50 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
        'video/mp4','video/quicktime','video/avi','video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
                             'video/mp4','video/quicktime','video/avi','video/webm'];

-- 2. Create the "avatars" bucket (images only, 10 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- ============================================================
-- RLS Policies — Posts bucket
-- ============================================================

-- Allow authenticated users to upload to posts/
CREATE POLICY "Authenticated users can upload posts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts');

-- Allow anyone to read from posts/
CREATE POLICY "Anyone can read posts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'posts');

-- Allow users to update/delete their own files in posts/
CREATE POLICY "Users can update their own post files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own post files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- RLS Policies — Avatars bucket
-- ============================================================

-- Allow authenticated users to upload to avatars/
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to read avatars
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
