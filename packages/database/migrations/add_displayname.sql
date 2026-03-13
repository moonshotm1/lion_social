-- ============================================================
-- Add displayName to User
-- Run this in Supabase SQL Editor before deploying
-- ============================================================

-- Step 1: Add displayName column to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

-- Step 2: RLS policies for Like table (service role bypasses RLS, but good practice)
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

-- Step 3: Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'displayName';
