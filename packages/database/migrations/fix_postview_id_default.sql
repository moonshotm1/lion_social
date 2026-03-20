-- Fix: add gen_random_uuid() default to id column on PostView.
-- Without this, inserts that omit `id` fail with:
--   "null value in column id violates not-null constraint"
-- Run in Supabase Dashboard → SQL Editor → New query.

ALTER TABLE "PostView" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Verify
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE table_name = 'PostView' AND column_name = 'id';
