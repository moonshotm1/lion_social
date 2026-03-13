-- ============================================================
-- Add displayName to User + create Story table
-- Run this in Supabase SQL Editor before deploying
-- ============================================================

-- Step 1: Add displayName column to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

-- Step 2: Create Story table for ephemeral 24-hour stories
CREATE TABLE IF NOT EXISTS "Story" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "mediaUrl"  TEXT,
  "text"      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "Story_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Story_userId_idx"    ON "Story" ("userId");
CREATE INDEX IF NOT EXISTS "Story_expiresAt_idx" ON "Story" ("expiresAt");

-- Step 3: RLS policies for Like table
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Like' AND policyname = 'Users can view all likes'
  ) THEN
    CREATE POLICY "Users can view all likes" ON "Like" FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Like' AND policyname = 'Users can insert own likes'
  ) THEN
    CREATE POLICY "Users can insert own likes" ON "Like" FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'Like' AND policyname = 'Users can delete own likes'
  ) THEN
    CREATE POLICY "Users can delete own likes" ON "Like" FOR DELETE USING (true);
  END IF;
END $$;

-- Step 4: Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'displayName';
SELECT COUNT(*) AS story_rows FROM "Story";
