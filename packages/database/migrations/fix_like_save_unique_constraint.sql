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

-- ── Add unique indexes (IF NOT EXISTS is safe to re-run) ─────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_postId_key" ON "Like" ("userId", "postId");
CREATE UNIQUE INDEX IF NOT EXISTS "Save_userId_postId_key" ON "Save" ("userId", "postId");

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT conname, contype FROM pg_constraint
WHERE conrelid IN ('"Like"'::regclass, '"Save"'::regclass)
ORDER BY conrelid::text, conname;
