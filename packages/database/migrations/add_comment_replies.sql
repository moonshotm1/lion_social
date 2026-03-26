-- Add parentId to Comment for one-level-deep reply threading
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Add FK only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Comment_parentId_fkey'
  ) THEN
    ALTER TABLE "Comment"
      ADD CONSTRAINT "Comment_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment" ("parentId");
