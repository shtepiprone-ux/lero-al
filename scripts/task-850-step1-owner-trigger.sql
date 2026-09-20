-- Task 850 (Sprint 78) — STEP 1 of 2: the database resolves the owner of a WhatsApp click event.
--
-- DEPLOY ORDER (load-bearing — owner action O78-4):
--   1. THIS FILE (step 1)  → Supabase Dashboard → SQL Editor, run once.   Safe with the OLD code.
--   2. Deploy the Task 850 code (the server action no longer takes listingOwnerId and inserts with the
--      service-role client; it writes actor_ip_hash, which only exists after this step).
--   3. scripts/task-850-step2-revoke-client-insert.sql  → run AFTER the deploy.
--   4. scripts/task-850-verify.sql                      → run each part separately, return the grids.
-- The new code before step 1 fails on the missing actor_ip_hash column. Step 2 before the deploy makes
-- the OLD code's authenticated inserts fail (lost clicks, logged).
--
-- What this step does:
--   * adds public.listing_contact_events.actor_ip_hash (guest fingerprint, nullable) and two indexes
--     serving the 30-minute de-dup look-up by (listing, user) and (listing, ip hash);
--   * adds a BEFORE INSERT trigger that overwrites listing_owner_id from public.listings.user_id and
--     recomputes is_owner_click, so a value sent by ANY caller (including a service-role insert) is
--     replaced; an insert for a listing that does not exist raises an exception.
--
-- Every statement is idempotent (`if not exists` / `create or replace` / `drop trigger if exists`).
--
-- ROLLBACK (removes only what this step added; existing rows and columns are untouched):
--   drop trigger if exists listing_contact_events_set_owner on public.listing_contact_events;
--   drop function if exists public.listing_contact_events_set_owner();
--   drop index if exists public.listing_contact_events_listing_actor_idx;
--   drop index if exists public.listing_contact_events_listing_iphash_idx;
--   alter table public.listing_contact_events drop column if exists actor_ip_hash;

-- ── Column ───────────────────────────────────────────────────────────────────────────────────────

alter table public.listing_contact_events
  add column if not exists actor_ip_hash text null;

-- ── Indexes (de-dup look-up: same listing + same actor inside the window) ────────────────────────

create index if not exists listing_contact_events_listing_actor_idx
  on public.listing_contact_events (listing_id, actor_user_id, created_at desc);

create index if not exists listing_contact_events_listing_iphash_idx
  on public.listing_contact_events (listing_id, actor_ip_hash, created_at desc);

-- ── Trigger: the owner and the self-click flag come from the database, never from the caller ─────

create or replace function public.listing_contact_events_set_owner()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_owner uuid;
begin
  select l.user_id
    into v_owner
  from public.listings l
  where l.id = new.listing_id;

  if v_owner is null then
    raise exception 'listing_contact_events: listing % does not exist', new.listing_id
      using errcode = 'foreign_key_violation';
  end if;

  new.listing_owner_id := v_owner;
  new.is_owner_click   := (new.actor_user_id is not null and new.actor_user_id = v_owner);
  return new;
end;
$$;

-- Trigger function: runs only in trigger context, so REST exposure is dead surface
-- (rls-rules.md → Default EXECUTE policy by function role). service_role keeps EXECUTE.
revoke execute on function public.listing_contact_events_set_owner() from public, anon, authenticated;

drop trigger if exists listing_contact_events_set_owner on public.listing_contact_events;

create trigger listing_contact_events_set_owner
  before insert on public.listing_contact_events
  for each row
  execute function public.listing_contact_events_set_owner();

notify pgrst, 'reload schema';
