-- Task 1044: the read-only check after task1044.sql. One statement, no write. Every row must say ok = true; a row that says false names what the apply did not leave as task1044.sql intends.
-- src/tests/integration/inboundEmail.integration.test.ts proves the same checks and indexes refuse wrong rows on the real database (AC9); db-catalog-audit.mjs checks the grants and policies.
select n, check_name, ok
from (
  select 1 as n, 'contact_inquiries.source is text not null default form, message_id text, attachments jsonb not null default []' as check_name,
         (select count(*) from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = 'contact_inquiries'
            and ((c.column_name = 'source' and c.data_type = 'text' and c.is_nullable = 'NO' and c.column_default like '''form''%')
              or (c.column_name = 'message_id' and c.data_type = 'text' and c.is_nullable = 'YES')
              or (c.column_name = 'attachments' and c.data_type = 'jsonb' and c.is_nullable = 'NO' and c.column_default like '''[]''%'))) = 3 as ok
  union all select 2, 'contact_inquiry_replies.direction text not null default outbound, from_email and message_id text, attachments jsonb not null default []',
         (select count(*) from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = 'contact_inquiry_replies'
            and ((c.column_name = 'direction' and c.data_type = 'text' and c.is_nullable = 'NO' and c.column_default like '''outbound''%')
              or (c.column_name = 'from_email' and c.data_type = 'text' and c.is_nullable = 'YES')
              or (c.column_name = 'message_id' and c.data_type = 'text' and c.is_nullable = 'YES')
              or (c.column_name = 'attachments' and c.data_type = 'jsonb' and c.is_nullable = 'NO' and c.column_default like '''[]''%'))) = 4
  union all select 3, 'the three checks exist and are validated',
         (select count(*) from pg_constraint k join pg_class t on t.oid = k.conrelid join pg_namespace s on s.oid = t.relnamespace
          where s.nspname = 'public' and k.contype = 'c' and k.convalidated
            and k.conname in ('contact_inquiries_source_check', 'contact_inquiry_replies_direction_check', 'contact_inquiry_replies_inbound_no_staff_check')) = 3
  union all select 4, 'both message_id indexes are unique and partial (where message_id is not null)',
         (select count(*) from pg_index x join pg_class i on i.oid = x.indexrelid join pg_namespace s on s.oid = i.relnamespace
          where s.nspname = 'public' and i.relname in ('contact_inquiries_message_id_key', 'contact_inquiry_replies_message_id_key')
            and x.indisunique and x.indpred is not null) = 2
  union all select 5, 'anon and authenticated still cannot read or write either table',
         not has_table_privilege('anon', 'public.contact_inquiries', 'select,insert,update,delete')
         and not has_table_privilege('authenticated', 'public.contact_inquiries', 'select,insert,update,delete')
         and not has_table_privilege('anon', 'public.contact_inquiry_replies', 'select,insert,update,delete')
         and not has_table_privilege('authenticated', 'public.contact_inquiry_replies', 'select,insert,update,delete')
  union all select 6, 'the policies are unchanged: three on each table, row-level security on',
         (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'contact_inquiries') = 3
         and (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = 'contact_inquiry_replies') = 3
         and (select count(*) from pg_class t join pg_namespace s on s.oid = t.relnamespace
              where s.nspname = 'public' and t.relname in ('contact_inquiries', 'contact_inquiry_replies') and t.relrowsecurity) = 2
  union all select 7, 'right after the apply: every existing reply is outbound and every existing inquiry came from the form',
         not exists (select 1 from public.contact_inquiry_replies r where r.direction <> 'outbound')
         and not exists (select 1 from public.contact_inquiries q where q.source <> 'form')
) checks
order by n;
