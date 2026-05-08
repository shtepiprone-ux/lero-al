-- Site-wide key/value settings table.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Default values
INSERT INTO site_settings (key, value) VALUES
  ('archived_noindex_days', '30')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can read — needed for SSR without session
CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT
  USING (true);

-- Only admin / moderator can write
CREATE POLICY "site_settings_admin_write"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );
