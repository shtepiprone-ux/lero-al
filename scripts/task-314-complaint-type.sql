-- Task 314: Add complaint_type enum + column to support_tickets
-- Run once in Supabase SQL editor before deploying the UI change.
-- Distinct from report_reason_t which classifies listing reports (different domain).
--
-- Canonical 8-value taxonomy for user-vs-user complaint classification:
--   fraud_or_scam, fake_listing_or_profile, harassment_or_abuse,
--   inappropriate_content, spam, payment_or_deposit_issue,
--   duplicate_or_impersonation, other

CREATE TYPE complaint_type_t AS ENUM (
  'fraud_or_scam',
  'fake_listing_or_profile',
  'harassment_or_abuse',
  'inappropriate_content',
  'spam',
  'payment_or_deposit_issue',
  'duplicate_or_impersonation',
  'other'
);

-- Legacy rows receive 'other' automatically via DEFAULT.
-- New rows require an explicit value set by the admin Create dialog.
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS complaint_type complaint_type_t NOT NULL DEFAULT 'other';

-- Verification: expected 12 columns (11 existing + complaint_type)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;
