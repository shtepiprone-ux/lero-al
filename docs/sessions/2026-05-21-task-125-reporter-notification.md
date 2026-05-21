# Session Archive: Epic C.4 — Reporter Notification Flow — 2026-05-21

## Task 125 — Reporter notification (email + in-app on report resolved/dismissed)

**Status:** COMPLETE

---

## What triggers the notification

When `updateReportStatusAction` transitions a `listing_reports` row to `'resolved'` or `'dismissed'` AND the status actually changed (idempotency guard: `newStatus !== report.status`), the original reporter receives:
1. An **in-app notification** (type: `'report_outcome'`)
2. An **email** via Resend (`ReporterNotificationEmail`)

Both are fire-and-forget — failure is logged but never blocks the moderation action.

---

## Files Created

### `src/modules/notifications/lib/emails/ReporterNotificationEmail.tsx`
React Email on BaseEmail, inline STRINGS sq/en/uk/it, separate strings for `resolved` vs `dismissed` outcomes. Shows listing title if available. No CTA (informational). Exports `getReporterNotificationEmailStrings(locale, status)`.

---

## Files Modified

### `src/modules/listings/actions/reportListing.ts`
`updateReportStatusAction` — after logging the report_action, calls `notifyReporter()` (fire-and-forget).

New `notifyReporter()` helper:
1. Fetches reporter `user_id` + listing title in one query (`listing_reports → listings(title)`)
2. `resolveUserLocale(reporterUserId)` → locale
3. `createNotification({ type: 'report_outcome', title, body })` — in-app
4. `db.auth.admin.getUserById(reporterUserId)` → reporter email
5. `sendEmail({ react: ReporterNotificationEmail })` — email

### `src/types/database.ts`
`NotificationType` union: added `'report_outcome'`

### `src/modules/notifications/components/NotificationItem.tsx`
`TYPE_ICON` record: added `report_outcome: '🛡️'`

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: PASS
- No DB migration required (notifications.type is a TEXT column, not ENUM)
