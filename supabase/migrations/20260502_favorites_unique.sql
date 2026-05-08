-- Add UNIQUE(user_id, listing_id) to favorites.
-- Run in Supabase SQL Editor.
--
-- Step 1: Remove any duplicate rows that may exist before adding the constraint.
-- Keeps the oldest (earliest created_at) row per (user_id, listing_id) pair.
-- This is a no-op when no duplicates exist, so the migration is safe to run
-- on a clean database or one that already has clean data.
DELETE FROM favorites
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT DISTINCT ON (user_id, listing_id) id
    FROM favorites
    ORDER BY user_id, listing_id, created_at ASC
  ) AS deduped
);

-- Step 2: Add the unique constraint (idempotent — skipped if it already exists).
-- PostgreSQL automatically creates a unique index to back this constraint,
-- which also speeds up the existence check in toggleFavorite.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname    = 'favorites_user_listing_unique'
      AND  conrelid   = 'favorites'::regclass
  ) THEN
    ALTER TABLE favorites
      ADD CONSTRAINT favorites_user_listing_unique UNIQUE (user_id, listing_id);
  END IF;
END $$;
