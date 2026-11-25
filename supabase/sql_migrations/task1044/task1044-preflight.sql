-- Task 1044: the read-only check before task1044.sql. One statement, no write. A row with problems > 0 stops the apply; the owner decides what to do, never the file.
-- Row 1: none of the seven new columns may exist yet. Row 2: none of the three new checks may exist yet. Row 3: neither unique index may exist yet.
-- Row 4: the two tables must exist with row-level security on (task1044.sql changes no policy and no grant; it only adds columns, checks and indexes).
select n, check_name, problems
from (
  select 1 as n, 'a column of task1044.sql already exists' as check_name,
         (select count(*) from information_schema.columns c
          where c.table_schema = 'public'
            and ((c.table_name = 'contact_inquiries' and c.column_name in ('source', 'message_id', 'attachments'))
              or (c.table_name = 'contact_inquiry_replies' and c.column_name in ('direction', 'from_email', 'message_id', 'attachments')))) as problems
  union all select 2, 'a check of task1044.sql already exists',
         (select count(*) from pg_constraint k join pg_class t on t.oid = k.conrelid join pg_namespace s on s.oid = t.relnamespace
          where s.nspname = 'public'
            and k.conname in ('contact_inquiries_source_check', 'contact_inquiry_replies_direction_check', 'contact_inquiry_replies_inbound_no_staff_check'))
  union all select 3, 'a unique index of task1044.sql already exists',
         (select count(*) from pg_indexes i
          where i.schemaname = 'public' and i.indexname in ('contact_inquiries_message_id_key', 'contact_inquiry_replies_message_id_key'))
  union all select 4, 'contact_inquiries or contact_inquiry_replies is missing or has row-level security off',
         2 - (select count(*) from pg_class t join pg_namespace s on s.oid = t.relnamespace
              where s.nspname = 'public' and t.relname in ('contact_inquiries', 'contact_inquiry_replies') and t.relkind = 'r' and t.relrowsecurity)
) checks
order by n;
