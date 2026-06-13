# Session Log — 2026-06-13 — Task 319

**Task:** `tasks/Epics/Epic_II_kickoff_prompt_Task_319.md`
**Scope:** Notification locale-binding FIX (Model C — template-ID + small typed params hybrid).
Epic II Phase 2. Eliminates the wrong-locale in-app notification bug class diagnosed in Task 318
(`docs/governance-reports/2026-06-13-notification-locale-audit.md`).

**STATUS: DONE.** All 9 acceptance-criteria groups met. tsc/lint/build/i18n/i18n-dynamic/
schema-drift all green. Rendered evidence matrix (28/28 PASS) at
`.screenshots/task319-qa/2026-06-13_21-02/`. One STOP & ASK finding documented (§6) — NOT fixed,
per the kickoff's own instruction.

---

## 1. Pre-read performed

- `docs/agent-contract.md` clauses 1–14, `docs/backlog.md`.
- `docs/governance-reports/2026-06-13-notification-locale-audit.md` §2–§7 (Task 318 audit —
  root cause + producer inventory).
- `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md`,
  `docs/architecture.md`.
- `docs/i18n-rules.md` §8 + `docs/ai-behavior.md` i18n rules; `docs/integrations.md` email policy
  (Albanian-only outbound email, Task 251 — confirmed unchanged/out of scope).
- `docs/ui-rules.md`, `docs/component-rules.md`.
- Source read in full: `src/modules/notifications/lib/mutations.ts`,
  `src/modules/notifications/components/NotificationItem.tsx`,
  `src/modules/notifications/components/NotificationCenter.tsx`,
  `src/modules/notifications/components/NotificationBell.tsx`,
  `src/modules/admin/actions/index.ts`, `src/app/api/cron/saved-searches/route.ts`,
  `src/app/api/cron/price-alerts/route.ts`, `src/modules/listings/actions/reportListing.ts`,
  `src/types/database.ts`, `scripts/i18n-dynamic-manifest.json`, `package.json`.
- Existing migration-style file pattern: `scripts/task-314-*.sql` + `npm run check:schema-drift`
  (confirmed `supabase/migrations/` does not exist anywhere in the repo — see §4 deviation).

## 2. What changed (Model C summary)

- New columns `notifications.template_id text NULL`, `notifications.template_params jsonb NULL`.
- `createNotification(...)` extended with optional `templateId`/`templateParams`; existing
  required `title`/`body` remain as the **sq safety-fallback** (belt-and-suspenders — worst-case
  degradation is Albanian, never a wrong non-sq locale).
- `NotificationItem.tsx` render precedence:
  - `template_id` present → `safeT(t, '${templateId}_title'/'_body', params)` in the viewer's
    `useLocale()`. Missing key / malformed params → falls back to stored `title`/`body`.
  - `template_id` NULL (legacy row) → **unchanged** verbatim + the two pre-existing
    special-cases (`saved_search_match` count, `listing_status_change` `resolveStatusBody()`).
- 5 producers migrated (per kickoff's canonical template-ID mapping):
  1. `createSupportTicket` → `support_created`
  2. `updateTicketStatus` → `support_resolved` / `support_closed`
  3. `cron/saved-searches` → `saved_search_match` (`{searchName, count}`)
  4. `cron/price-alerts` → `price_change` (`{oldPrice, newPrice, currency, listingName, listingId}`,
     formatted at render time via `Intl.NumberFormat(viewerLocale)`)
  5. `reportListing.notifyReporter` → `report_resolved` / `report_dismissed`
- Producer #6 (`applyListingTransition` / `listing_status_change`) **unchanged**, per owner lock.
- `emailLocale = 'sq'` preserved for all outbound emails (Task 251 policy unchanged).
- 14 new `notifications.*` keys added to `messages/{sq,en,uk,it}.json` (1780 keys, parity PASS)
  + registered in `scripts/i18n-dynamic-manifest.json` (new `notification-templates` entry).
- `resolveUserLocale.ts` — no remaining callers; doc comment updated to record this (function
  body kept, intentionally not deleted, per its own original "not deleted" design note).

## 3. Files Changed

| File | Change |
|---|---|
| `src/types/database.ts` | `Notification` interface: added `template_id`, `template_params` |
| `src/modules/notifications/lib/mutations.ts` | `createNotification` extended with `templateId`/`templateParams` |
| `src/modules/notifications/components/NotificationItem.tsx` | Render-precedence: `safeT`, `resolveTitleParams`, `resolvePriceChangeBody` helpers + template_id/legacy branch; wrap classes on title/body `<p>` |
| `src/modules/notifications/components/NotificationItem.stories.tsx` | NEW — Storybook stories for rendered-evidence matrix (8 producer/legacy cases) |
| `src/modules/admin/actions/index.ts` | Producers #1/#2: removed `resolveUserLocale`/`SUPPORT_NOTIFY_STRINGS`/`getSupportNotifyStrings`; added sq-fallback `SUPPORT_NOTIFY_SQ` + `templateId`/`templateParams` |
| `src/app/api/cron/saved-searches/route.ts` | Producer #3: removed `NOTIF`/`getNotif`; sq-fallback title/body + `templateId: 'saved_search_match'`, `templateParams: {searchName, count}` |
| `src/app/api/cron/price-alerts/route.ts` | Producer #4: removed `NOTIF`/`getNotif`; sq-fallback title/body + `templateId: 'price_change'`, numeric `templateParams` |
| `src/modules/listings/actions/reportListing.ts` | Producer #5: `templateId: report_resolved/report_dismissed`, `templateParams: {}` |
| `src/modules/notifications/lib/emails/resolveUserLocale.ts` | Doc comment updated — no remaining callers as of Task 319 |
| `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` | +14 `notifications.*` keys (7 template IDs × `_title`/`_body`); `saved_search_match_title` gained `{searchName}` param |
| `scripts/i18n-dynamic-manifest.json` | New `notification-templates` entry (14 keys) |
| `scripts/task-319-notifications-template-columns.sql` | NEW — `ALTER TABLE notifications ADD COLUMN template_id, template_params` (+ verification query + commented DOWN) |
| `scripts/schema-drift-check.sql` | Regenerated via `npm run check:schema-drift` (auto-derived; `notifications` now 10 cols) |
| `scripts/task319-qa-notification-templates.mjs` | NEW — Playwright rendered-evidence script (28-cell matrix) |

## 4. Deviation from kickoff: migration file path

The kickoff specified `supabase/migrations/<new>_notifications_template_columns.sql (NEW)`.
**No `supabase/migrations/` directory exists anywhere in this repo** (verified via repo-wide
search). The established convention — confirmed across Tasks 277/289/302/314/326 — is a
`scripts/task-NNN-*.sql` file applied manually via the Supabase SQL editor, with
`scripts/schema-drift-check.sql` regenerated from `src/types/database.ts` via
`npm run check:schema-drift`. I followed that real convention instead of the kickoff's literal
(non-existent) path:
- `scripts/task-319-notifications-template-columns.sql` (NEW) — idempotent `ADD COLUMN IF NOT
  EXISTS`, includes a verification `SELECT` and a commented-out `DOWN` (matches Task 314's
  `scripts/task-314-complaint-type.sql` shape).
- `scripts/schema-drift-check.sql` regenerated, confirms `Notification → notifications  10`
  columns (was 8).

This is a reasoned convention-following deviation, not scope creep — flagging per clause 10.
**The owner still needs to run `scripts/task-319-notifications-template-columns.sql` in the
Supabase SQL editor before this code is deployed** (new columns are additive/nullable, so the
existing app keeps working until then, but `template_id`/`template_params` writes will be
silently dropped by PostgREST until the columns exist).

## 5. Validation — ALL GREEN

- `npx tsc --noEmit` → 0 errors
- `npx eslint` (all touched files/dirs) → 0 errors
- `npm run check:i18n` → Parity PASSED, 1780 keys × 4 locales (1 pre-existing non-blocking
  raw-enum WARN at `AdminInquiriesManager.tsx:288`, unrelated to this task)
- `npm run check:i18n-dynamic` → PASSED, 0 errors (12 pre-existing Task-320-baselined WARNs for
  `admin.support.user_status_*`, unrelated)
- `npm run build` → succeeded, full route manifest printed, no errors
- `npm run check:schema-drift` → regenerated, `notifications` → 10 columns confirmed
- `npm run build-storybook` → succeeded
- `node scripts/task319-qa-notification-templates.mjs` → **28/28 PASS**
  (7 viewports × 4 locales: 320/375/390/768/1280/1440/2560 × sq/en/uk/it). Manifest +
  screenshots at `.screenshots/task319-qa/2026-06-13_21-02/`. Mandatory uk@320/375/390 +
  sq/en/it@320/375/390 PNGs captured. Spot-checked uk@320 and it@320 PNGs visually:
  - All 7 new template titles/bodies render correctly in the viewer's locale (e.g.
    `price_change` → uk "Зміна ціни: Vilë private me oborr dhe pishinë, Durrës" /
    "180 000 EUR → 165 000 EUR" with `Intl.NumberFormat('uk')` space-separated thousands;
    it → "Variazione prezzo: ..." / "180.000 EUR → 165.000 EUR" with dot separator).
  - Long uk/it title/body text wraps (`whitespace-normal break-words`), no clipping, no
    per-element overflow at 320px (`titleOverflow`/`bodyOverflow` both false for all 8 rows ×
    28 cells).
  - The two LEGACY rows (`template_id = null`):
    - `saved_search_match` legacy row: title stays verbatim sq ("Kërkim i ruajtur: Tokë / Truall
      Vlorë" — no template to localize the title), but **body still resolves via the
      pre-existing `saved_search_match_body` special-case in the viewer's locale**
      (uk "7 нових оголошень відповідають вашому збереженому пошуку").
    - `listing_status_change` legacy row: title verbatim sq, body resolves via the
      pre-existing `resolveStatusBody()` JSON-format special-case in viewer's locale
      (uk "На модерації → Активне").
    - Plain legacy row (`marketing`, no special-case): both verbatim sq, as expected
      (graceful fallback, Owner decision 2 — no backfill).

## 6. STOP & ASK finding — NOT fixed (out of scope, per kickoff)

`NotificationCenter.tsx` renders a **fixed `w-80` (320px)** container
(`className="w-80 max-h-120 flex flex-col overflow-hidden rounded-xl border bg-background
shadow-lg"`), and `NotificationBell.tsx` wraps it in a hand-rolled
`<div className="absolute right-0 top-full mt-2 z-50">` — **no Sheet/Dialog/Popover primitive,
no bottom-sheet behavior at any breakpoint**.

This is a **pre-existing violation of the OWNER P0 "Mobile <640 full-width gate"**
(`CLAUDE.md` + `docs/agent-contract.md` clauses 11–12): at <640px the notification bell popup
should be a full-width, bottom-anchored sheet, not a 320px absolutely-positioned dropdown.

Per the kickoff's own explicit instruction:

> "The popup container's full-width bottom-sheet behavior at <640 is owned by the bell/sheet
> component, NOT this task. Do NOT change it; just verify it is not regressed. If you find the
> notification popup is NOT already a full-width bottom sheet at <640 ... STOP & ASK — do not
> silently expand scope here."

**This finding is therefore NOT fixed in Task 319.** Task 319's own in-scope changes
(`NotificationItem` text resolution) do not regress this — the rendered-evidence matrix above
confirms text wraps correctly within the existing `w-80` container at every locale/breakpoint
tested; only the container's own width/positioning is the pre-existing issue.

**Recommendation:** open a follow-up task (Epic II or a dedicated mobile-gate cleanup epic) to
convert `NotificationBell`'s popup to a `Sheet`-based full-width bottom sheet at <640px,
consistent with the Dialog/Select/Combobox/DropdownMenu/Popover/Command bottom-sheet pattern
already established elsewhere (per `docs/agent-contract.md` clauses 11–12).

## 7. Acceptance criteria self-audit

1. Migration (deviated path, see §4) + `Notification` interface — ✅
2. `createNotification` signature extended, backward-compatible — ✅
3. Producers #1–#5 store `template_id`+`template_params`+sq title/body; `emailLocale` preserved;
   producer #6 unchanged — ✅
4. `price_change` numeric params + `Intl.NumberFormat` render-time formatting — ✅
5. `NotificationItem` render precedence + missing-key/param guards (`safeT`) + all existing
   controls (click/keyboard/unread dot/link/relative-time/icon) preserved — ✅
6. `messages/*.json` 4-locale parity + manifest registration + `check:i18n`/`check:i18n-dynamic`
   exit 0 — ✅
7. Clause 11/12 rendered matrix (28/28 PASS, screenshots + manifest) — ✅
8. Clause 9/14 tsc/build/integrity green — ✅ (this section = self-audit)
9. `docs/backlog.md` + this session log; NO git commands run by executor — ✅

## Self-validation

I read this session log before finishing: it accurately reflects the diff (`git diff --stat`
covers exactly the files in §3's table, plus this log + `docs/backlog.md`), the validation
commands were actually run with the outputs summarized in §5, and §6 documents a finding I did
NOT silently fix or ignore, per the kickoff's explicit STOP & ASK instruction. No git commands
were run.
