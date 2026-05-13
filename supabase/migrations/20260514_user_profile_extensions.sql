-- User profile extensions (Phase 10 consolidated pass)
-- Adds: preferred_currency, pending_email, user_status_history, email_change_tokens

-- ── New columns on users ──────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_currency  text NOT NULL DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS pending_email        text;

-- Constrain preferred_currency to known values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_preferred_currency_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_preferred_currency_check
      CHECK (preferred_currency IN ('ALL', 'EUR'));
  END IF;
END $$;

-- ── User status history ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_status_history (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_status  text,
  new_status  text        NOT NULL,
  reason      text,
  changed_by  uuid        REFERENCES users(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/moderator read status history"
  ON user_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Insert only via service-role (Server Actions using admin client)

-- ── Email change tokens ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_change_tokens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email    text        NOT NULL,
  token_hash   text        NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_change_tokens ENABLE ROW LEVEL SECURITY;

-- No direct user access — all operations via service-role in Server Actions
-- Public route /auth/confirm-email validates token via service-role.

-- Index for token lookup
CREATE INDEX IF NOT EXISTS email_change_tokens_token_hash_idx
  ON email_change_tokens (token_hash)
  WHERE consumed_at IS NULL;

-- Index for per-user rate limiting
CREATE INDEX IF NOT EXISTS email_change_tokens_user_created_idx
  ON email_change_tokens (user_id, created_at DESC);
