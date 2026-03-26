-- Run this in the Supabase SQL Editor to enable Realtime for the Notification table.
-- Required for the notification bell badge to update instantly without polling.

ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
