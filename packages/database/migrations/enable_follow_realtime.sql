-- Enable Supabase Realtime for the Follow table so the client can subscribe
-- to follower/following count changes instantly (no polling delay).
--
-- Run this in the Supabase SQL Editor.

ALTER PUBLICATION supabase_realtime ADD TABLE "Follow";
