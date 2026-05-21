# Session Archive: Epic E.4 — Saved-Search Match Notifications — 2026-05-21

## Task 132 — E.4 Saved-search match notifications

**Status:** COMPLETE (code shipped; owner must run DB migration + create email template)

---

## DB Migration SQL (owner runs in Supabase Dashboard → SQL Editor)

```sql
ALTER TABLE saved_searches 
ADD COLUMN IF NOT EXISTS notify_frequency TEXT NOT NULL DEFAULT 'daily'
CHECK (notify_frequency IN ('instant', 'daily', 'weekly'));
```

---

## Owner actions after migration

1. Run the SQL above.
2. Create the `saved_search_alert` template in `/admin/email-templates` with key `saved_search_alert`.
   Suggested variables: `{{searchName}}`, `{{newCount}}`, `{{searchUrl}}`.
   If the template doesn't exist, `sendTemplatedEmail` logs a warning and continues.

---

## Architecture

**Cron:** `/api/cron/saved-searches` (daily 09:00 UTC, via `vercel.json`).
Same pattern as Task 124 (inactivity) — `CRON_SECRET` Bearer auth, idempotent.

**Deduplication:** `last_checked_at` is the cutoff boundary. Only listings with `created_at > last_checked_at` are counted. `last_checked_at` is updated every run (even when no new listings), preventing double-notification.

**Frequency gate:**
| Setting | Minimum elapsed since last check |
|---------|----------------------------------|
| `instant` | Always (cron cadence is the limit) |
| `daily` | 23 hours |
| `weekly` | 6.5 days |

**Filter application:** `canonicalToSearchParams(saved.filters)` → `parseSearchParams(sp)` → `applyListingFilters(query, parsed)` — same pipeline as the listings page. No filter logic duplication.

**Email:** Admin-editable `saved_search_alert` template via `sendTemplatedEmail`. Locale via `resolveUserLocale`. Gracefully skips if template not found.

**In-app notification:** `createNotification({ type: 'saved_search_match', ... })` with locale-specific inline strings.

---

## Files created

### `src/app/api/cron/saved-searches/route.ts`
Daily cron handler. CRON_SECRET auth. Per-search flow: frequency gate → query new listings → in-app + email notification → update last_checked_at + new_count. Idempotent; errors are logged but don't block other searches.

---

## Files modified

### `src/types/database.ts`
`SavedSearch.notify_frequency: 'instant' | 'daily' | 'weekly'` added.

### `vercel.json`
New cron: `{ path: '/api/cron/saved-searches', schedule: '0 9 * * *' }`.

### `src/modules/cabinet/actions/index.ts`
`updateSavedSearchFrequency(id, frequency)` server action added. Same pattern as `updateSavedSearchNotify`.

### `src/modules/cabinet/components/SavedSearchesTab.tsx`
- `Combobox` import + `updateSavedSearchFrequency` import added
- `handleFrequency(id, freq)` handler added
- Frequency Combobox (size="xs", w-[90px]) shown when `notify_email = true`

### `messages/*.json` (sq/en/uk/it)
`saved_search` namespace: `notify_frequency`, `frequency_instant`, `frequency_daily`, `frequency_weekly`, `frequency_updated`

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: PASS
