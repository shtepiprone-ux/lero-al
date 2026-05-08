-- User profile management migration
-- Run in Supabase SQL Editor

-- ── New columns on users ──────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_name          text,
  ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS block_reason       text,
  ADD COLUMN IF NOT EXISTS location_id        integer REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS position           text,
  ADD COLUMN IF NOT EXISTS year_started       integer,
  ADD COLUMN IF NOT EXISTS website            text,
  ADD COLUMN IF NOT EXISTS company_logo_url   text,
  ADD COLUMN IF NOT EXISTS deleted_at         timestamptz,
  ADD COLUMN IF NOT EXISTS location_request   jsonb;

-- Allow developer as user_type
ALTER TABLE users ALTER COLUMN user_type TYPE text;

-- Status constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status IN ('active', 'blocked', 'inactive'));
  END IF;
END $$;

-- ── Change log for user type/role changes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_change_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by  uuid        REFERENCES users(id),
  field_name  text        NOT NULL,
  old_value   text,
  new_value   text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/moderator read change log"
  ON user_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ── Avatars storage bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Admin/moderator upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admin/moderator update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admin/moderator delete avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ── Inactive status automation (optional trigger) ─────────────────────────────
-- Uncomment if you want automatic status = 'inactive' after 90 days of no login.
-- Requires a scheduled job (pg_cron or Supabase Edge Function) to run periodically.
--
-- CREATE OR REPLACE FUNCTION set_inactive_users()
-- RETURNS void LANGUAGE plpgsql AS $$
-- BEGIN
--   UPDATE users
--   SET status = 'inactive'
--   WHERE status = 'active'
--     AND deleted_at IS NULL
--     AND id NOT IN (
--       SELECT DISTINCT user_id FROM auth.sessions
--       WHERE created_at > now() - interval '90 days'
--     );
-- END $$;
