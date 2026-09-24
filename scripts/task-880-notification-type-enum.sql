-- Task 880: Add the two missing values to public.notification_type
-- Run in Supabase Dashboard -> SQL Editor.
--
-- Root cause (measured on the live database, 2026-09-24): src/types/database.ts declares
-- NotificationType with 9 values, but the live public.notification_type enum only has 7 —
-- it is missing 'report_outcome' and 'price_change'. Every insert of those two types has
-- always failed silently: createNotification (src/modules/notifications/lib/mutations.ts)
-- inserts via the service-role client and, on error, only logs
-- console.error('[notifications] createNotification failed', ...) — it returns void, so no
-- caller could ever know the insert failed. Confirmed 0 rows of either type in `notifications`
-- (live query, 2026-09-24).
--
-- This migration is ADDITIVE ONLY. PostgreSQL enum values cannot be dropped once added
-- (`ALTER TYPE ... DROP VALUE` does not exist), so there is deliberately NO rollback script.
-- Leaving 'report_outcome'/'price_change' in the enum even if this task were ever reverted is
-- harmless: an unused enum value has no effect on any row, query, or constraint.
--
-- `add value if not exists` is idempotent — safe to re-run.

alter type public.notification_type add value if not exists 'report_outcome';
alter type public.notification_type add value if not exists 'price_change';

-- Reload PostgREST schema cache so the new enum values take effect immediately.
notify pgrst, 'reload schema';
