-- Ensure Like and Save tables exist with correct structure.
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS constraints).
-- Run in Supabase Dashboard → SQL Editor → New query.

-- ── Like ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Like" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "postId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Like_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "Like_userId_postId_key" UNIQUE ("userId", "postId"),
  CONSTRAINT "Like_userId_fkey"    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Like_postId_fkey"    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Like_postId_idx" ON "Like" ("postId");
CREATE INDEX IF NOT EXISTS "Like_userId_idx" ON "Like" ("userId");

-- ── Save ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Save" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "postId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Save_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "Save_userId_postId_key" UNIQUE ("userId", "postId"),
  CONSTRAINT "Save_userId_fkey"       FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Save_postId_fkey"       FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Save_postId_idx" ON "Save" ("postId");
CREATE INDEX IF NOT EXISTS "Save_userId_idx" ON "Save" ("userId");

-- ── Verify ───────────────────────────────────────────────────────────────────

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('Like', 'Save')
ORDER BY table_name, ordinal_position;
