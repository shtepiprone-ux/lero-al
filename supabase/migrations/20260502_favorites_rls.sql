-- Favorites table RLS policies.
-- The favorites table already exists. This migration adds user-scoped RLS.
-- Run in Supabase SQL Editor.

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only read their own favorites
CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert favorites for themselves
CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
