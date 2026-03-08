-- =============================================================================
-- Notifications: RLS policies + Realtime
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).
-- =============================================================================

-- 1. Enable Row Level Security on the Notification table (safe to run again)
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to SELECT their own notifications.
--    The "User" table maps supabaseId (Supabase auth UID) → app User.id.
--    The Notification.userId column stores the app User.id (CUID).
DROP POLICY IF EXISTS "notifications_select_own" ON "Notification";
CREATE POLICY "notifications_select_own"
  ON "Notification"
  FOR SELECT
  USING (
    "userId" IN (
      SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
    )
  );

-- 3. Allow users to UPDATE (mark as read) their own notifications.
DROP POLICY IF EXISTS "notifications_update_own" ON "Notification";
CREATE POLICY "notifications_update_own"
  ON "Notification"
  FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
    )
  );

-- 4. Allow INSERT from service role only.
--    (API routes use the service role key; no browser-side INSERT is needed.)
--    No explicit policy needed — service role bypasses RLS by default.

-- 5. Enable Realtime publication for the Notification table so that
--    the useUnreadCount hook (postgres_changes) receives INSERT events.
--    This requires the "supabase_realtime" publication to exist (it does by default).
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";


-- =============================================================================
-- Post views: atomic increment RPC
-- Replaces the read-modify-write in /api/post/[id]/route.ts with a single
-- UPDATE that increments in place — safe under concurrent requests.
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_post_view(post_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE "Post"
  SET    "viewCount" = COALESCE("viewCount", 0) + 1
  WHERE  id = post_id;
$$;
