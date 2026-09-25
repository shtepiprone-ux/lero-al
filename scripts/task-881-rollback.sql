-- task-881-rollback.sql
--
-- Task 881 (Sprint 80). Owner-applied ONLY on breakage after
-- scripts/task-881-notifications-least-privilege.sql — e.g. probe arm U2 fails AFTER
-- (mark-as-read no longer works through PostgREST with a column-level UPDATE grant, per
-- Assumption 1 in the kickoff), or O80-5 step 4's manual mark-as-read check does not hold.
--
-- Restores authenticated to the full pre-task table-level grant set (a coarse break-glass
-- restore, not a precise per-privilege replay).
--
-- THIS SCRIPT DOES NOT RE-GRANT ANON ANYTHING ON PUBLIC.NOTIFICATIONS. Rationale (R5,
-- F8): no path in src/ reads or writes notifications as anon — the bell mounts only for a
-- signed-in header (Header.tsx:78) and every anon probe arm (A1-A4) is expected to read
-- 42501 whether this rollback runs or not. Restoring anon would restore only exposure, not
-- app functionality. The rollback exists to restore the app if the column-level grant
-- breaks mark-as-read, never to restore anon's prior reach.

begin;

grant select, insert, update, delete, truncate, references, trigger on public.notifications to authenticated;

notify pgrst, 'reload schema';

commit;
