# Epic C — Trust, Safety & Moderation — CLOSED

**Status:** COMPLETE
**Opened:** 2026-05-19
**Closed:** 2026-05-21

---

## Goal (achieved)

Protect users from scams and abuse. Full report → moderation → notification → block pipeline across all four locales.

---

## Tasks completed

| Task | Epic sub | Description | Session log |
|------|----------|-------------|-------------|
| 116 | C.1 | Trust & safety research — protection stack decision | [log](../../docs/sessions/2026-05-20-task-116-c1-trust-safety-research.md) |
| 117 | C.2 | User report flow — ListingReportDialog + reportListingAction | [log](../../docs/sessions/2026-05-20-task-117-c2-user-report-flow.md) |
| 118 | C.3 | Admin reports dashboard — /admin/reports CRUD + audit log | [log](../../docs/sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md) |
| 125 | C.4 | Reporter notification — email + in-app on report resolved/dismissed | [log](../../docs/sessions/2026-05-21-task-125-reporter-notification.md) |
| 126 | C.5 | Account blocking/suspension — guard + suspended_until + admin UI | [log](../../docs/sessions/2026-05-21-task-126-account-blocking.md) |

---

## Architecture delivered

- `listing_reports` table + `report_actions` audit table
- `ListingReportDialog` — 6-reason selector, 500-char comment, one-per-user-per-listing guard
- `/admin/reports` — status filter tabs, ReportDetailDialog, action buttons + notes
- `ReporterNotificationEmail` — code-first React Email, 4 locales, sent on resolved/dismissed
- In-app notification type `'report_outcome'` (🛡️ icon)
- `status: 'blocked'` + `block_reason` + `suspended_until` in admin user profile
- Server guard in `createListing` — blocked users cannot post

## Owner actions required

- Task 118: `report_actions` table SQL (in session log)
- Task 126: `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;`
