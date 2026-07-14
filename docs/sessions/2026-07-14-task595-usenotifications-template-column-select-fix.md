# Task 595 — `useNotifications` must SELECT `template_id` + `template_params` so notification localization actually runs

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_595_NotificationsHookSelectTemplateColumns.md`.
Owner-reported 2026-07-14: the complaint notification rendered in the WRONG language under a UA UI.

## Why

`NotificationItem.tsx` localizes template-driven notifications at render time via
`if (templateId) { displayTitle = safeT(t, \`${templateId}_title\`, …) ?? notification.title }`. But the data
source, `useNotifications.ts`, did not select `template_id`/`template_params` — so `notification.template_id`
was always `undefined` at runtime, and the component always took the non-template `else` branch, rendering the
stored (fixed-language) `title`/`body` verbatim for EVERY template-driven notification
(`saved_search_match`/`price_change`/`support_created`/`support_resolved`/`support_closed`/`report_resolved`/
`report_dismissed`). The Storybook story masked this because its fixtures pass `template_id` directly, bypassing
the hook entirely.

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/hooks/useNotifications.ts` | Added `, template_id, template_params` to the `.select()` column list (was line 19). Nothing else touched — fetch order, `PAGE_SIZE`, realtime subscription, `unreadCount` computation, `loading` gate, `refetch` handle all unchanged. |
| `src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx` (new) | Regression test per clause 15 — see below. |
| `docs/critical-flow-registry.md` | Added a `notifications` row under "P1 — Notifications display" documenting this flow + its regression test (required by the kickoff — the flow had now regressed once). |

`src/types/database.ts:460-461` already declares `template_id: string \| null` and
`template_params: Record<string, unknown> \| null` on `Notification` (added Task 319) — no type change needed,
confirmed by reading the file directly.

## Positive flow

Authed user opens the bell. Hook fetches with the two new columns → `NotificationItem` sees `template_id` →
resolves `t('<templateId>_title'/'_body', params)` in the viewer's current locale. Verified via the regression
test: the SAME notification object (`template_id: 'support_created'`) renders "Скарга на ваш акаунт" under `uk`
and "Ankesë për llogarinë tuaj" under `sq` — proving the locale switch works on identical data, not per-locale
stored strings.

## Negative flow

- `template_id=NULL` row → `else` branch unchanged → stored `title`/`body` verbatim (test 4: a `marketing`-type
  row with `template_id: null` renders "Legacy stored title"/"Legacy stored body" exactly as stored).
- Missing/malformed `template_params` → `NotificationItem`'s existing `safeT`/`resolvePriceChangeBody` guards
  (untouched by this diff) still return `null` → stored fallback, unchanged behavior — not re-tested here since
  this diff doesn't touch that logic; already covered by the Task 564 `priceChange` smoke test (still 3/3 PASS
  after this change, confirmed below).
- RLS: read-only column addition on the same `notifications` row the user already reads (no new table/policy).
  Checked `docs/rls-rules.md` for any column-level grant restriction on `notifications` — none found; the only
  `notifications`-related row concerns service-role-only INSERT, unrelated to this SELECT. No RLS change needed,
  confirming the kickoff's own assessment.

## Regression coverage (clause 15) — REQUIRED

Added the `notifications` row to `docs/critical-flow-registry.md` (Task 595, under the existing "P1 —
Notifications display" section).

**Test:** `src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx`
(4 RTL tests, mounts the REAL `NotificationItem` under REAL `NextIntlClientProvider`s, no mocks):
1. `uk`: `template_id='support_created'` → renders "Скарга на ваш акаунт", NOT the stored stub title.
2. `sq`: the SAME notification object → renders "Ankesë për llogarinë tuaj".
3. Regression guard: `template_id: null` (simulating the pre-fix hook bug) → falls back to the stored
   (wrong-language) title, NOT the localized uk string — proves the exact failure mode this task fixes.
4. Non-template row (`template_id=NULL`, a genuine legacy/marketing row) → still renders stored title/body
   verbatim — no regression for rows that never had a template.

**Red-before / green-after proof (planted violation, per clause 15):** temporarily set `template_id: null` in
the test fixture's default (simulating the exact pre-fix state) → re-ran → **tests 1 and 2 genuinely FAILed**
(`Unable to find an element with the text: Скарга на ваш акаунт` / `Ankesë për llogarinë tuaj`, DOM showed
`stub-stored-title` instead) — 2/4 FAIL. Reverted `template_id` back to `'support_created'` → **4/4 PASS**. This
is the literal AC5 requirement: "the test must FAIL if `template_id` is stripped from the object."

## Runtime evidence (AC3) — honest caveat

The kickoff asks to "manually verify in the running app at `/uk` and `/sq` that the complaint notification
switches language, and paste that runtime evidence." That specific complaint notification is a real row in the
live Supabase database, owned by a specific authenticated account — I do not have that account's login session
in this sandbox, so I could not produce a live-app screenshot of that exact row. Flagging this honestly rather
than fabricating it.

**Best available proxy evidence — the same component/code path, real `next-intl`, different locale, opened
directly from this session's own rendered-assert PNGs** (`.screenshots/rendered-assert/2026-07-14T16-01/`,
generated during Task 594's evidence run against the `NotificationBellView` story, whose 3rd fixture row uses
`template_id: 'support_created'` — the identical template as the owner's live complaint row):
- `mantine-primitives-notificationbellview--default__uk__mobile-320.png` — 3rd row title: **"Скарга на ваш
  акаунт"**.
- `mantine-primitives-notificationbellview--default__sq__mobile-320.png` — 3rd row title (same fixture data):
  **"Ankesë për llogarinë tuaj"**.

This confirms `NotificationItem`'s render-time resolver is correct and locale-reactive on the exact template
this task's fix concerns — the only thing the hook fix changes is that `template_id` now actually reaches this
component from the live Supabase fetch instead of arriving as `undefined`. Combined with the regression test's
red/green proof (which exercises the identical `template_id='support_created'` fixture with and without the
field present), this is strong evidence, but is NOT a substitute for the owner's own live `/uk` ↔ `/sq` toggle
on the real complaint row — **recommend the owner do that one manual check post-commit**, matching this
project's established pattern for live-authenticated-route evidence (e.g. Task 451/574's admin-session capture
notes in `docs/critical-flow-registry.md`).

## i18n / gates

No message keys changed — `support_*`/`price_change_*`/`saved_search_match_*` already exist in all 4 locales,
confirmed via `check:i18n` (unchanged 2147×4 parity).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Diff adds ONLY `template_id, template_params` to `.select()`; no other change | ✅ | `useNotifications.ts` diff (single line changed) |
| 2 | `Notification` type already has the fields, no type edit needed | ✅ | `src/types/database.ts:460-461` (Task 319) |
| 3 | Runtime proof: same notification uk vs sq | ⚠️ partial — see "Runtime evidence" above (proxy evidence via rendered PNGs + regression test, live-app screenshot of the real row needs owner session) |
| 4 | Non-template row still renders verbatim | ✅ | Test 4 |
| 5 | Regression test in registry, red on planted `template_id` strip, green after | ✅ | `docs/critical-flow-registry.md` row + red/green proof above |
| 6 | Gates green | ✅ | See Self-validation |
| 7 | Session log: AC self-audit, Files Changed, UX flow trace, registry row, no git run | ✅ | This file |

## UX flow trace

1. User opens the bell → `NotificationBellView` → `useNotifications()` fires `fetchAll()` →
   `supabase.from('notifications').select(...)` now includes `template_id`/`template_params`.
2. Each returned row is typed `Notification` (fields already declared) and passed to `NotificationCenter` →
   `NotificationItem`.
3. `NotificationItem` reads `notification.template_id` — now a real string for template-driven rows instead of
   `undefined` — takes the `if (templateId)` branch, resolves `t(\`${templateId}_title\`)`/`_body` in the
   viewer's active `next-intl` locale via `safeT`.
4. Locale switch (`/uk` → `/sq`) re-renders `NotificationItem` under a different `NextIntlClientProvider`
   locale — same `notification.template_id`, different resolved string — no refetch needed, matching the
   regression test's proof.
5. Rows without a `template_id` (legacy/marketing) are unaffected — `else` branch unchanged.

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/modules/notifications/hooks/useNotifications.ts
src/modules/notifications/components/__tests__/NotificationItem.templateLocalization.smoke.test.tsx` = clean (no
output). `npm run check:i18n` = PASSED, 2147×4 keys (unchanged). `npm run check:file-integrity` = PASSED, 5
files clean. `npm run check:mojibake` = PASSED, 0 artifacts in 1702 files. `npx vitest run
src/modules/notifications/components/__tests__/` = **7/7 PASS** (3 pre-existing `priceChange` tests + 4 new
`templateLocalization` tests) — confirms zero regression on the adjacent Task 564 coverage.

Git NOT run by this session (single-writer rule). Files Changed table above is for the orchestrator/owner to
review before staging/committing.

**Verdict: Task 595 is functionally complete**, with one honest open item: AC3's live-app `/uk`/`/sq` screenshot
of the actual complaint notification row needs the owner's own authenticated session (I don't have those
credentials in this sandbox). The fix itself is a trivially-correct one-line column addition to an already-typed
`.select()`, backed by a red/green-proven regression test that exercises the exact `template_id='support_created'`
template the live bug concerns, plus proxy rendered evidence (Storybook PNGs, same component/code path, real
`next-intl`) showing the identical fixture switches language uk↔sq. HELD for orchestrator review — not
committed.
