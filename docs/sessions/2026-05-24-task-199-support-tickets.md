# Task 199 — R.5: Support — manual ticket creation + status notifications

**Date:** 2026-05-24  
**Status:** ✅ DONE (owner must run SQL below before deploying)  
**Branch:** main

## Problem

Admin support page was read-only. No way to manually create complaint tickets. No status management. No audit trail. `support_tickets` table had zero RLS policies (security gap).

## Schema (owner must run — idempotent SQL)

```sql
-- Task 199 — R.5: support_tickets hardening + support_ticket_events audit trail

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure status has a DB-level default (belt-and-suspenders; code always sets it explicitly)
ALTER TABLE support_tickets ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS reported_user_id    uuid        REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reason              text,
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid        REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ticket_type         text        NOT NULL DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'support_tickets_ticket_type_check'
       AND conrelid = 'support_tickets'::regclass
  ) THEN
    ALTER TABLE support_tickets
      ADD CONSTRAINT support_tickets_ticket_type_check
      CHECK (ticket_type IN ('support', 'user_complaint'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_support_tickets_updated_at'
  ) THEN
    CREATE TRIGGER trg_support_tickets_updated_at
      BEFORE UPDATE ON support_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'support_tickets_select_own') THEN
    CREATE POLICY "support_tickets_select_own" ON support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'support_tickets_insert_own') THEN
    CREATE POLICY "support_tickets_insert_own" ON support_tickets FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND ticket_type = 'support' AND reported_user_id IS NULL AND created_by_admin_id IS NULL AND assigned_to IS NULL AND status = 'open');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'support_tickets_admin_select') THEN
    CREATE POLICY "support_tickets_admin_select" ON support_tickets FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'support_tickets_admin_insert') THEN
    CREATE POLICY "support_tickets_admin_insert" ON support_tickets FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'support_tickets_admin_update') THEN
    CREATE POLICY "support_tickets_admin_update" ON support_tickets FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS support_ticket_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     uuid        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_user_id uuid        REFERENCES users(id) ON DELETE SET NULL,
  actor_role    text,
  event_type    text        NOT NULL,
  old_status    text,
  new_status    text,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'support_ticket_events_event_type_check'
       AND conrelid = 'support_ticket_events'::regclass
  ) THEN
    ALTER TABLE support_ticket_events
      ADD CONSTRAINT support_ticket_events_event_type_check
      CHECK (event_type IN ('created','status_changed','note_added','assigned','updated'));
  END IF;
END
$$;

ALTER TABLE support_ticket_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_ticket_events' AND policyname = 'ste_admin_select') THEN
    CREATE POLICY "ste_admin_select" ON support_ticket_events FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_ticket_events' AND policyname = 'ste_admin_insert') THEN
    CREATE POLICY "ste_admin_insert" ON support_ticket_events FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_reported_user_id ON support_tickets(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_type_status ON support_tickets(ticket_type, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket_id_created_at ON support_ticket_events(ticket_id, created_at DESC);
```

## Partial migration safety note

The DO-guards on RLS policies are idempotent for **creation** but will **not replace** a weaker policy with the same name that was created during local testing. Before running in production, verify the exact policies on both tables match the intended list:

**`support_tickets` — expected policies (no DELETE):**
- `support_tickets_select_own` — `USING (user_id = auth.uid())`
- `support_tickets_insert_own` — `WITH CHECK (user_id = auth.uid() AND ticket_type = 'support' AND reported_user_id IS NULL AND created_by_admin_id IS NULL AND assigned_to IS NULL AND status = 'open')`
- `support_tickets_admin_select` — admin/mod USING
- `support_tickets_admin_insert` — admin/mod WITH CHECK
- `support_tickets_admin_update` — admin/mod USING

**`support_ticket_events` — expected policies (no UPDATE, no DELETE):**
- `ste_admin_select` — admin/mod USING
- `ste_admin_insert` — admin/mod WITH CHECK

If any of these already exist with weaker definitions, `DROP POLICY IF EXISTS "<name>" ON <table>;` before running the SQL block.

## Files Changed

### `src/types/database.ts`
- Updated `SupportTicket`: added `reported_user_id`, `reason`, `created_by_admin_id`, `ticket_type`, `updated_at`.
- New `SupportTicketEvent` interface (9 fields).

### `scripts/schema-drift-check.sql`
- `support_tickets` 6 → 11 cols; added `support_ticket_events` (9 cols) to both CTEs and table list.

### `src/modules/admin/actions/index.ts`
- Added imports: `createNotification`, `resolveUserLocale`.
- `SUPPORT_NOTIFY_STRINGS` map (sq/en/uk/it): `created_title/body`, `resolved_title/body`, `closed_title/body`.
- `createSupportTicket({ reportedUserId, reporterUserId, subject, reason })`: admin-only; validates both user IDs exist; inserts ticket with `ticket_type='user_complaint'`; records `created` event; sends in-app notification to `reported_user_id` (type `support_reply`).
- `updateTicketStatus(ticketId, newStatus, note?)`: admin/mod; records `status_changed` event; sends in-app notification to `reported_user_id` when `resolved` or `closed` (type `report_outcome`).

### `src/components/admin/AdminSupportManager.tsx` (new)
- Client component with: stats row, type + status filter buttons, ticket table, `CreateComplaintDialog` (reporter/reported UUID inputs + subject + reason), `TicketDetailDialog` (metadata grid, reason block, status change control, event timeline).

### `src/app/admin/support/page.tsx`
- Refactored: fetches tickets with three user joins + all events in one query; passes to `AdminSupportManager`.

### `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`
- Added `admin.support.*` section (44 keys × 4 locales).

## TypeScript
`tsc --noEmit` → 0 errors.
