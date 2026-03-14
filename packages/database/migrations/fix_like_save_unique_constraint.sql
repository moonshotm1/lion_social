-- Add unique constraint on (userId, postId) to Like and Save tables.
-- These may be missing if the tables were created before this constraint was defined.
-- Also removes any duplicate rows created before the constraint was in place.
-- Run in Supabase Dashboard → SQL Editor → New query.

-- ── Remove duplicate Like rows (keep the oldest per userId+postId) ────────────
DELETE FROM "Like"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "postId") id
  FROM "Like"
  ORDER BY "userId", "postId", "createdAt" ASC
);

-- ── Remove duplicate Save rows ────────────────────────────────────────────────
DELETE FROM "Save"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "postId") id
  FROM "Save"
  ORDER BY "userId", "postId", "createdAt" ASC
);

-- ── Add unique constraints (safe: skip if already exists) ─────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Like_userId_postId_key' AND conrelid = '"Like"'::regclass
  ) THEN
    ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_postId_key" UNIQUE ("userId", "postId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Save_userId_postId_key' AND conrelid = '"Save"'::regclass
  ) THEN
    ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_postId_key" UNIQUE ("userId", "postId");
  END IF;
END $$;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT conname, contype FROM pg_constraint
WHERE conrelid IN ('"Like"'::regclass, '"Save"'::regclass)
ORDER BY conrelid::text, conname;
