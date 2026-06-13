-- Task 319 (Epic II Phase 2): notification locale-binding fix — Model C
-- Run once in Supabase SQL editor before deploying the code change.
--
-- Adds two NULLable columns to `notifications` so new rows can carry a
-- canonical template ID + small typed params, resolved at RENDER time in the
-- viewer's current locale (NotificationItem.tsx). Existing rows stay valid
-- with NULL (graceful legacy verbatim fallback — Owner decision 2, NO backfill).
--
-- Reversible: see DOWN section at the bottom (commented out by default).

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS template_id text NULL,
  ADD COLUMN IF NOT EXISTS template_params jsonb NULL;

-- Verification: expected 10 columns (8 existing + template_id + template_params)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ── DOWN (reversal — run manually if needed) ──────────────────────────────────
-- ALTER TABLE notifications
--   DROP COLUMN IF EXISTS template_id,
--   DROP COLUMN IF EXISTS template_params;
