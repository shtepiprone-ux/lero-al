-- ═════════════════════════════════════════════════════════════════════════════
-- Task 455 (Epic LV, LV.2) — One-time backfill: resolve all active listings
-- that are silently invisible (past-expiry OR NULL-expiry) → expired.
--
-- PREREQUISITES:
--   1. The pg enum migration MUST have been committed first:
--      ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expired';
--   2. Run this as a SEPARATE step AFTER the enum value is committed.
--
-- IDEMPOTENT: safe to re-run. Only updates rows still in 'active' status.
-- ═════════════════════════════════════════════════════════════════════════════

-- Step 1: Expire active listings with lapsed expires_at
UPDATE listings
SET status = 'expired', updated_at = now()
WHERE status = 'active'
  AND expires_at IS NOT NULL
  AND expires_at < now();

-- Step 2: Expire active listings with NULL expires_at (broken lifecycle data)
UPDATE listings
SET status = 'expired', updated_at = now()
WHERE status = 'active'
  AND expires_at IS NULL;

-- Step 3: Verification — should return 0 rows after backfill
-- (proves no active row remains silently invisible)
SELECT count(*) AS remaining_invisible_active
FROM listings
WHERE status = 'active'
  AND (expires_at IS NULL OR expires_at < now());
