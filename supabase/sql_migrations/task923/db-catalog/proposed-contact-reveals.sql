-- Task 923 Revision 37 (Opus, 2026-10-23), kickoff section 61, R125: the record of phone and WhatsApp number reveals that the limits of the owner's decisions D77, D79 and D80 count.
-- ONE change: the new table public.listing_contact_reveals. No existing object is changed. The apply file and its dry-run file differ in their LAST LINE only.
-- Written after the read-only facts of review-40/rv40-15-db-precheck.txt: the table does not exist; public.listings.id is uuid; public.users.id references auth.users (id) on delete cascade;
-- the precedent public.reauth_failures has row level security on, no policy, and grants to postgres and service_role only; Supabase's default privileges give anon and authenticated every
-- privilege on a table that supabase_admin creates, so this file revokes them explicitly.
--
-- OWNER STEPS: (1) Get-FileHash -Algorithm SHA256 proposed-contact-reveals.dryrun.sql against the hash Opus gives; run it in the SQL editor: it runs the preflight, every statement and the
--   post-checks, then ROLLS BACK. (2) After a clean dry run: the same for proposed-contact-reveals.sql, which COMMITS. (3) After an error the owner runs "rollback;" as a separate query and
--   reports the error to Opus.
-- The rollback is proposed-contact-reveals-rollback.sql. It drops the table and its rows; the gateway that counts reveals then refuses every reveal (it never counts a failed read as zero),
--   so the rollback goes together with the gateway code that reads the table.
--
-- WHAT THE PREFLIGHT REFUSES (the transaction stops at the first that fails and nothing is changed):
--   PREFLIGHT 01: public.listing_contact_reveals does not exist
--   PREFLIGHT 02: public.listings has a primary key on id, of type uuid
--   PREFLIGHT 03: auth.users has a primary key on id, of type uuid
-- WHAT THE POST-CHECKS REQUIRE BEFORE COMMIT:
--   POSTCHECK 01: the table exists with row level security on and no policy
--   POSTCHECK 02: anon and authenticated hold no privilege on the table
--   POSTCHECK 03: service_role holds select, insert and delete on the table
--   POSTCHECK 04: the three indexes exist
--
-- BEHAVIOUR (kickoff section 61):
--   1. One row per number reveal the gateway answers for a listing the viewer has not had revealed in the last 24 hours; a repeat reveal of the same listing writes no row.
--   2. The gateway reads it with the service role only. A browser session reads, writes and deletes nothing (row level security, no policy, no grant: error 42501).
--   3. requester_ip is the first address of x-forwarded-for, or x-real-ip, or null when neither is sent (one shared bucket, as in R67 (b)). The gateway deletes rows older than 48 hours.
--   4. A deleted person or listing takes its rows with it (on delete cascade).
begin;

do $preflight$
begin
  if to_regclass('public.listing_contact_reveals') is not null then
    raise exception 'preflight 01 failed: public.listing_contact_reveals already exists';
  end if;
  if (select string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod), ',')
        from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
       where i.indrelid = 'public.listings'::regclass and i.indisprimary) is distinct from 'id:uuid' then
    raise exception 'preflight 02 failed: public.listings has no primary key on id of type uuid';
  end if;
  if (select string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod), ',')
        from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
       where i.indrelid = 'auth.users'::regclass and i.indisprimary) is distinct from 'id:uuid' then
    raise exception 'preflight 03 failed: auth.users has no primary key on id of type uuid';
  end if;
end
$preflight$;

-- One row per new number reveal of a viewer (Task 923 R125; owner decisions D77, D79, D80). The service role only: row level security is on and NO policy exists, and anon and
-- authenticated hold no grant, so a session role gets 42501.
create table public.listing_contact_reveals (
  id bigint generated always as identity primary key,
  viewer_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  channel text not null check (channel in ('call', 'whatsapp')),
  requester_ip text,
  created_at timestamptz not null default now()
);
create index listing_contact_reveals_viewer_created_idx on public.listing_contact_reveals (viewer_id, created_at);
create index listing_contact_reveals_ip_created_idx on public.listing_contact_reveals (requester_ip, created_at);
create index listing_contact_reveals_created_idx on public.listing_contact_reveals (created_at);
alter table public.listing_contact_reveals enable row level security;
revoke all on table public.listing_contact_reveals from public, anon, authenticated;
grant select, insert, delete on table public.listing_contact_reveals to service_role;

do $postcheck$
begin
  if not (select c.relrowsecurity from pg_class c where c.oid = 'public.listing_contact_reveals'::regclass) then
    raise exception 'postcheck 01 failed: row level security is off';
  end if;
  if exists (select 1 from pg_policy p where p.polrelid = 'public.listing_contact_reveals'::regclass) then
    raise exception 'postcheck 01 failed: a policy exists';
  end if;
  if has_table_privilege('anon', 'public.listing_contact_reveals', 'select, insert, update, delete, truncate, references, trigger')
     or has_table_privilege('authenticated', 'public.listing_contact_reveals', 'select, insert, update, delete, truncate, references, trigger') then
    raise exception 'postcheck 02 failed: anon or authenticated holds a privilege';
  end if;
  if not (has_table_privilege('service_role', 'public.listing_contact_reveals', 'select')
          and has_table_privilege('service_role', 'public.listing_contact_reveals', 'insert')
          and has_table_privilege('service_role', 'public.listing_contact_reveals', 'delete')) then
    raise exception 'postcheck 03 failed: service_role lacks select, insert or delete';
  end if;
  if (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'listing_contact_reveals'
        and indexname in ('listing_contact_reveals_viewer_created_idx', 'listing_contact_reveals_ip_created_idx', 'listing_contact_reveals_created_idx')) <> 3 then
    raise exception 'postcheck 04 failed: an index is missing';
  end if;
end
$postcheck$;

notify pgrst, 'reload schema';
commit;
