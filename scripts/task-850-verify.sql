-- Task 850 (Sprint 78): owner-run verification of the WhatsApp click event write path (AC5).
--
-- OWNER RUN: Supabase Dashboard → SQL Editor, AFTER both task-850-step1-owner-trigger.sql and
-- task-850-step2-revoke-client-insert.sql (and the code deploy between them — see their headers).
-- Run each PART SEPARATELY (select just that part and run it) — the editor shows only the last result
-- grid of a run — and return each grid.
--
-- Part (a) inserts two probe rows and deletes them again before it finishes; it leaves no data behind.

-- ═════ PART (a) — the trigger overwrites a spoofed owner and rejects an unknown listing ═════════════
-- Expected: two rows.
--   spoofed_owner : listing_owner_id = a user who is NOT the owner, is_owner_click = true sent by the caller
--                   → stored_owner = the listing's real owner, stored_is_owner_click = false, corrected = true.
--   unknown_listing: insert for a random uuid → raised = true, sqlstate = 23503.

drop table if exists pg_temp.t850_trigger;
create temp table t850_trigger (
  probe                 text,
  spoofed_owner         uuid,
  stored_owner          uuid,
  expected_owner        uuid,
  stored_is_owner_click boolean,
  corrected             boolean,
  raised                boolean,
  sqlstate              text
);

do $$
declare
  v_listing_id uuid;
  v_owner_id   uuid;
  v_other_id   uuid;
  v_row_id     uuid;
  v_stored     uuid;
  v_flag       boolean;
begin
  select l.id, l.user_id
    into v_listing_id, v_owner_id
  from public.listings l
  where l.status = 'active'
  order by l.created_at desc
  limit 1;

  select u.id
    into v_other_id
  from public.users u
  where u.id <> v_owner_id
  limit 1;

  insert into public.listing_contact_events
    (listing_id, listing_owner_id, actor_user_id, actor_ip_hash, channel, source, is_owner_click)
  values
    (v_listing_id, v_other_id, null, 'task850verifyprobe', 'whatsapp', 'task_850_verify', true)
  returning id into v_row_id;

  select ce.listing_owner_id, ce.is_owner_click
    into v_stored, v_flag
  from public.listing_contact_events ce
  where ce.id = v_row_id;

  insert into t850_trigger (probe, spoofed_owner, stored_owner, expected_owner, stored_is_owner_click, corrected)
  values ('spoofed_owner', v_other_id, v_stored, v_owner_id, v_flag, v_stored = v_owner_id and v_flag = false);

  delete from public.listing_contact_events where id = v_row_id;

  begin
    insert into public.listing_contact_events
      (listing_id, listing_owner_id, actor_user_id, actor_ip_hash, channel, source)
    values
      (gen_random_uuid(), v_other_id, null, 'task850verifyprobe', 'whatsapp', 'task_850_verify');
    insert into t850_trigger (probe, raised) values ('unknown_listing', false);
  exception when others then
    insert into t850_trigger (probe, raised, sqlstate) values ('unknown_listing', true, sqlstate);
  end;

  delete from public.listing_contact_events where source = 'task_850_verify';
end;
$$;

select probe, spoofed_owner, stored_owner, expected_owner, stored_is_owner_click, corrected, raised, sqlstate
from t850_trigger
order by probe desc;

-- ═════ PART (b) — a signed-in client can no longer insert; the service role still can ════════════════
-- Expected: authenticated_can_insert = false, anon_can_insert = false, service_role_can_insert = true.

select
  has_table_privilege('authenticated', 'public.listing_contact_events', 'insert') as authenticated_can_insert,
  has_table_privilege('anon',          'public.listing_contact_events', 'insert') as anon_can_insert,
  has_table_privilege('service_role',  'public.listing_contact_events', 'insert') as service_role_can_insert;

-- ═════ PART (c) — the policies left on the table ═════════════════════════════════════════════════════
-- Expected: no row with cmd = 'INSERT' and 'authenticated' in roles; `events_select_owner` (SELECT) remains.

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename  = 'listing_contact_events'
order by policyname;
