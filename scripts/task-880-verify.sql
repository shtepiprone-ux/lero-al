-- Task 880: Verify public.notification_type accepts every value of
-- src/types/database.ts's NotificationType union.
-- Run in Supabase Dashboard -> SQL Editor, AFTER task-880-notification-type-enum.sql.
--
-- Expected result: ZERO ROWS.
-- Any returned row names a TypeScript NotificationType value still missing from the live
-- enum — the exact O82-1 acceptance check (AC1).

with expected(value) as (
  values
    ('new_message'),
    ('saved_search_match'),
    ('listing_status_change'),
    ('support_reply'),
    ('listing_expires_soon'),
    ('agent_verified'),
    ('marketing'),
    ('report_outcome'),
    ('price_change')
)
select expected.value as missing_from_live_enum
from expected
where expected.value not in (
  select pg_enum.enumlabel
  from pg_enum
  join pg_type on pg_type.oid = pg_enum.enumtypid
  where pg_type.typname = 'notification_type'
);
