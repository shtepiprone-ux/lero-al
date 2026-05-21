# Session Archive: Epic D.5 — Inactive Account Warning Emails — 2026-05-21

## Task 124 — Epic D.5 — Inactive Account Warning Emails (3mo → 12mo soft delete)

**Status:** COMPLETE (code shipped; owner must run DB migration + set CRON_SECRET in Vercel)
**Closes Epic D.**

---

## DB Migration SQL (owner runs in Supabase Dashboard → SQL Editor)

```sql
-- Add inactivity warning tracking column to users table.
-- Tracks whether the 3-month warning email was sent for this inactivity cycle.
-- Reset to NULL when the user becomes active again (presence update or reactivation).

ALTER TABLE users ADD COLUMN IF NOT EXISTS inactivity_warning_sent_at TIMESTAMPTZ;
```

---

## Key Decisions

### Inactivity measurement
`COALESCE(last_seen_at, created_at)` — users who never signed in after registration use `created_at` as the activity baseline. This prevents newly registered but never-active users from silently expiring without a warning.

### Thresholds
- **3 months** = 91 days (not 90, to avoid edge cases at exactly 90 days)
- **12 months** = 365 days

### Deduplication
`inactivity_warning_sent_at` column — set when the 3-month warning is sent; reset to NULL on every presence update. Prevents duplicate warning emails during a single inactivity cycle. The 12-month soft-delete has no tracking column needed (user is soft-deleted, next cron run excludes deleted users).

### Soft delete at 12 months
- Sets `deleted_at = now()` and `status = 'inactive'` on the users row
- Archives all active listings via `applyListingTransitionByStatus()` (mutation gateway)
- Writes `user_status_history`: `old_status='active', new_status='inactive', reason='inactivity_12_months_auto_deactivation', changed_by=null`
- Sends `InactivityFinalEmail` immediately after

### Grace period: 90 days
If a soft-deleted-by-inactivity user signs in within 90 days, the presence route (`/api/presence`) restores the account automatically:
- Clears `deleted_at` and `inactivity_warning_sent_at`
- Sets `status = 'active'`
- Writes `user_status_history` (reason: `reactivated_within_grace_period`)
- Archived listings are NOT automatically restored (require manual admin action)

After 90 days: account remains soft-deleted, data retained indefinitely until a future cleanup task.

### GDPR note
Retained data after 90-day grace period includes email and profile fields. A future explicit deletion flow should hard-delete this data for right-to-erasure compliance. Platform legal counsel should review the 90-day window against applicable law.

### ESLint exception added
`src/app/api/cron/**` and `src/app/api/presence/**` added to `LISTING_STATUS_IGNORES` in `eslint.config.mjs`. These files update `UserStatus`, not `ListingStatus`. The comment in the exception list already documents this intent ("Non-listing status contexts: UserStatus").

---

## Files Created

### `src/modules/notifications/lib/emails/InactivityWarningEmail.tsx`
3-month warning — React Email on BaseEmail, 4 locales, CTA "Sign in now", note about 9 remaining months.

### `src/modules/notifications/lib/emails/InactivityFinalEmail.tsx`
12-month final notice — React Email on BaseEmail, 4 locales, CTA "Restore my account", 90-day grace window notice.

### `src/app/api/cron/inactivity/route.ts`
Daily cron handler. Authenticated via `CRON_SECRET` (Bearer token). Idempotent:
1. Query + soft-delete 12-month inactive users
2. Query + warn 3-month inactive users (dedup via `inactivity_warning_sent_at`)
Batch limit: 200 users per run. Results logged to Vercel console.

### `vercel.json`
```json
{ "crons": [{ "path": "/api/cron/inactivity", "schedule": "0 8 * * *" }] }
```
Runs daily at 08:00 UTC.

---

## Files Modified

- `src/app/api/presence/route.ts` — reactivation logic: checks `deleted_at` + grace window; restores account if within 90 days; resets `inactivity_warning_sent_at` on every active presence ping
- `docs/domain-rules.md` — inactivity lifecycle policy added at top (thresholds, grace period, GDPR note, reactivation rules)
- `docs/env.md` — `CRON_SECRET` documented
- `eslint.config.mjs` — cron/** and presence/** added to `LISTING_STATUS_IGNORES`

---

## Owner Actions Required

1. **DB migration**: run the SQL above in Supabase Dashboard → SQL Editor
2. **CRON_SECRET env var**: add to Vercel → Settings → Environment Variables (generate: `openssl rand -hex 32`)
3. **Verify cron is running**: after deploy, check Vercel → Cron Jobs tab — the `/api/cron/inactivity` job should appear with daily schedule

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: ✅ PASS (no new regressions)
- npm run build: user's manual step
