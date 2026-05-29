-- Task 289 (corrective to Task 277): revoke anonymous access to listing_contact_events
-- Run this in Supabase Dashboard → SQL Editor.
--
-- Context: Task 277 created public.listing_contact_events with an anon SELECT grant and an
-- `events_insert_anon` policy, on the (incorrect) assumption that anonymous visitors could trigger
-- WhatsApp contact events. Task 289 re-scopes the WhatsApp CTA to AUTHENTICATED USERS ONLY, so
-- anonymous contact events are impossible by design. This migration removes that unused anon
-- attack surface.
--
-- Owner confirmation (2026-05-29): scripts/task-277-listing-contact-events.sql has ALREADY been
-- applied in Supabase, so this is a follow-up corrective migration (not an edit to the original file).
--
-- What this KEEPS intact:
--   - table public.listing_contact_events (+ indexes)
--   - policy events_insert_authenticated  (authenticated INSERT, actor_user_id = auth.uid())
--   - policy events_select_owner          (listing owner SELECT)
--   - grant select, insert TO authenticated
--   - grant select, insert, update, delete TO service_role
--
-- What this REMOVES:
--   - policy events_insert_anon
--   - grant select TO anon

-- 1) Drop the anonymous INSERT policy.
drop policy if exists "events_insert_anon" on public.listing_contact_events;

-- 2) Revoke the anonymous SELECT grant.
revoke select on public.listing_contact_events from anon;

-- 3) Reload PostgREST schema cache so the changes take effect immediately.
notify pgrst, 'reload schema';
