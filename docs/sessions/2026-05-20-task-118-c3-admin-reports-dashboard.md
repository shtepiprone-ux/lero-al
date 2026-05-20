# Session Archive: Task 118 — Epic C.3 — Admin Reports Dashboard — 2026-05-20

**Epic:** C — Trust, Safety & Moderation  
**Task:** 118 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED (requires DB migration)

---

## ⚠️ Required Database Migration

Run in Supabase SQL editor before deploying:

```sql
CREATE TABLE public.report_actions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id   uuid NOT NULL REFERENCES public.listing_reports(id) ON DELETE CASCADE,
  actor_id    uuid NOT NULL REFERENCES public.users(id),
  actor_role  text NOT NULL,
  old_status  text NOT NULL,
  new_status  text NOT NULL,
  notes       text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_actions_admin"
  ON report_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

---

## Changes

### `src/modules/listings/actions/reportListing.ts` — added `updateReportStatusAction`
- Admin/moderator auth guard via `createAdminClient` role check
- Gets current status for audit log
- Updates `listing_reports.status`
- Inserts into `report_actions` with actor_id, actor_role, old/new status, optional notes
- ESLint block-disable justified (report status ≠ listing status transition)

### `src/components/admin/AdminReportsManager.tsx` (new)
- `ReportDetailDialog`: shows full report (reason, listing link, reporter, comment, date + status badge); action buttons for pending/reviewed reports (review, resolve, dismiss) + notes textarea; toast success/error
- `AdminReportsManager`: status filter tabs with counts (all/pending/reviewed/resolved/dismissed); table (reason, listing title, reporter, status badge, date); click row → detail dialog; optimistic status update via `handleUpdated`
- `STATUS_VARIANT` map for Badge colors: pending=warning, reviewed=neutral, resolved=success, dismissed=destructive

### `src/app/admin/reports/page.tsx` (new)
- Fetches reports with listing + reporter joins (admin client, limit 200, newest first)
- Passes locale to manager for listing URL construction

### `src/components/admin/AdminSidebar.tsx`
- Added `Flag` icon import; Reports nav item in group_management (after Support)

### `src/components/admin/AdminMobileHeader.tsx`
- Added `/admin/reports` title

### `messages/{sq,en,uk,it}.json`
- `admin.sidebar.item_reports` (1 key × 4 locales)
- `admin.pages.reports_title`, `.reports_subtitle` (2 keys × 4 locales)
- `admin.reports.*` — 22 keys × 4 locales

### Bonus fixes
- `AdminReportsManager.tsx`: `max-w-[200px]` → `max-w-xs` (2 occurrences)
- `listings/[slug]/page.tsx`: `max-w-[200px]` → `max-w-xs` in breadcrumb
- Governance localization improved: M:18 → M:17 (below baseline)

---

## Acceptance Criteria

- [x] `/admin/reports` lists all reports with status filter tabs
- [x] Report detail Dialog shows full info + action buttons
- [x] Status transitions logged in `report_actions` audit table
- [x] Admin/moderator only (server action auth guard)
- [x] All 4 locales · lint 0/0 · governance M:17 (below baseline)
- [ ] `report_actions` DB migration required before deploy
- [ ] `npm run build` — user's manual step
