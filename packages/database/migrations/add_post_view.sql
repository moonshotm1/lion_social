-- Migration: Add PostView table for unique per-user view tracking
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- This replaces the non-unique viewCount column on Post with a proper
-- PostView table that enforces one row per (postId, userId).
-- The view count then = COUNT(*) from PostView WHERE postId = X,
-- matching how unique views work on Instagram/X.

CREATE TABLE IF NOT EXISTS "PostView" (
  "id"        TEXT        NOT NULL,
  "postId"    TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "PostView_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "PostView_postId_userId_key" UNIQUE ("postId", "userId"),
  CONSTRAINT "PostView_postId_fkey"      FOREIGN KEY ("postId") REFERENCES "Post"("id")  ON DELETE CASCADE,
  CONSTRAINT "PostView_userId_fkey"      FOREIGN KEY ("userId") REFERENCES "User"("id")  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PostView_postId_idx" ON "PostView" ("postId");
CREATE INDEX IF NOT EXISTS "PostView_userId_idx" ON "PostView" ("userId");

-- Optional: enable Row Level Security (the app uses service role key so this
-- is informational; adjust if you want additional RLS protection)
-- ALTER TABLE "PostView" ENABLE ROW LEVEL SECURITY;
