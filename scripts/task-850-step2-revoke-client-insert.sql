-- Task 850 (Sprint 78) — STEP 2 of 2: direct client inserts into listing_contact_events are impossible.
--
-- DEPLOY ORDER (load-bearing — owner action O78-4):
--   1. scripts/task-850-step1-owner-trigger.sql  → already applied.
--   2. Deploy the Task 850 code                   → MUST be live before this file runs.
--   3. THIS FILE (step 2)                         → Supabase Dashboard → SQL Editor, run once.
--   4. scripts/task-850-verify.sql                → run each part separately, return the grids.
-- Running this file BEFORE the code deploy makes the old code's authenticated inserts fail (lost clicks,
-- logged as '[contactEvents] insert failed').
--
-- After this step the only way to create a row is the trackListingContactEvent server action, which
-- inserts with the service-role client. `events_select_owner` (the cabinet's owner-scoped read) and the
-- service-role grants are left exactly as they are.
--
-- Idempotent: `drop policy if exists`; `revoke` is a no-op when the privilege is already gone.
--
-- ROLLBACK (restores the pre-Task-850 client insert path — the hole the task closes):
--   grant insert on public.listing_contact_events to authenticated;
--   create policy "events_insert_authenticated" on public.listing_contact_events
--     for insert to authenticated
--     with check (actor_user_id = auth.uid());

drop policy if exists "events_insert_authenticated" on public.listing_contact_events;

revoke insert on public.listing_contact_events from authenticated;

notify pgrst, 'reload schema';
