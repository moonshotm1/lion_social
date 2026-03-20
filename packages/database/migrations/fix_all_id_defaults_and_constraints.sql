-- Fix all missing id defaults and constraints.
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Safe to run multiple times.

-- ── Like: add id default so inserts without id work ────────────────────────
ALTER TABLE "Like" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ── Save: add id default ───────────────────────────────────────────────────
ALTER TABLE "Save" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ── PostView: add id default ───────────────────────────────────────────────
ALTER TABLE "PostView" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ── Remove duplicate Like rows (keep oldest per userId+postId) ─────────────
DELETE FROM "Like"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "postId") id
  FROM "Like"
  ORDER BY "userId", "postId", "createdAt" ASC
);

-- ── Remove duplicate Save rows ─────────────────────────────────────────────
DELETE FROM "Save"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "postId") id
  FROM "Save"
  ORDER BY "userId", "postId", "createdAt" ASC
);

-- ── Unique constraints on Like and Save ───────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_postId_key" ON "Like" ("userId", "postId");
CREATE UNIQUE INDEX IF NOT EXISTS "Save_userId_postId_key" ON "Save" ("userId", "postId");

-- ── Remove duplicate follow notifications (keep oldest per userId+referenceId) ──
DELETE FROM "Notification"
WHERE type = 'follow'
  AND id NOT IN (
    SELECT DISTINCT ON ("userId", "referenceId") id
    FROM "Notification"
    WHERE type = 'follow'
    ORDER BY "userId", "referenceId", "createdAt" ASC
  );

-- ── Verify ─────────────────────────────────────────────────────────────────
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE table_name IN ('Like', 'Save', 'PostView') AND column_name = 'id'
ORDER BY table_name;
