-- ============================================================
-- RESET VIEW COUNTS — run this in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================
-- This drops the old PostView table (with any duplicate/corrupt rows),
-- recreates it with a hard UNIQUE constraint, and resets Post.viewCount
-- to 0 so the display starts clean.

-- Step 1: Drop existing PostView table (removes all rows and old constraints)
DROP TABLE IF EXISTS "PostView" CASCADE;

-- Step 2: Recreate PostView with guaranteed UNIQUE constraint
CREATE TABLE "PostView" (
  "id"        TEXT        NOT NULL,
  "postId"    TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "PostView_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "PostView_postId_userId_key" UNIQUE ("postId", "userId"),
  CONSTRAINT "PostView_postId_fkey"       FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "PostView_userId_fkey"       FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PostView_postId_idx" ON "PostView" ("postId");
CREATE INDEX "PostView_userId_idx" ON "PostView" ("userId");

-- Step 3: Reset inflated viewCount on all posts to 0
-- (the app now reads view counts from PostView rows, not this column)
UPDATE "Post" SET "viewCount" = 0;

-- Step 4: Verify — both should return 0
SELECT COUNT(*) AS post_view_rows  FROM "PostView";
SELECT SUM("viewCount") AS total_old_view_count FROM "Post";
