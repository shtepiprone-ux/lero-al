# Task 595 — `useNotifications` must SELECT `template_id` + `template_params` so notification localization actually runs

Sprint 44 (Epic MM Phase-2 / i18n correctness). Owner-reported 2026-07-14: the complaint notification
renders in the WRONG language (Albanian fallback under a UA UI). Orchestrator root-caused it below.

## Pre-read (per `docs/rule-index.md`)

Primary type = **DB / data-access + i18n**. Always: `docs/agent-contract.md`, `docs/backlog.md`,
`docs/critical-flow-registry.md` (scan — add a row, see below). Required: `docs/data-access-rules.md`,
`docs/qa-rules.md`, `docs/ai-behavior.md` → Localization (i18n) Rules. Reference (do not modify):
`src/modules/notifications/components/NotificationItem.tsx` (the render-time template resolver, Task 319).

## Why (root cause — verified by the orchestrator)

`NotificationItem.tsx` localizes template-driven notifications at render time:
`const templateId = notification.template_id; if (templateId) { displayTitle = safeT(t, \`${templateId}_title\`, …) ?? notification.title; … }`.
But the data source — `src/modules/notifications/hooks/useNotifications.ts` line 19 —
**does not select `template_id` or `template_params`**:

```
.select('id, user_id, type, title, body, link, is_read, created_at')
```

So at runtime `notification.template_id` is always `undefined` → `NotificationItem` ALWAYS takes the non-template
`else` branch → renders the stored `title`/`body` verbatim (a fixed language) and NEVER localizes. This silently
breaks localization for EVERY template-driven notification (`saved_search_match`, `price_change`, `support_created`
/`support_resolved`/`support_closed`, `report_resolved`/`report_dismissed`). The Storybook story masked it because
its fixtures pass `template_id` directly. (The one legacy `template_id=NULL` row was separately repointed at
`support_created` via an owner-run SQL UPDATE on 2026-07-14; this hook fix is what makes that — and all others —
localize.)

`src/types/database.ts:460-461` already declares `template_id: string | null` and
`template_params: Record<string, unknown> | null` on `Notification`, so no type change is needed.

## Scope (one line of product code)

In `src/modules/notifications/hooks/useNotifications.ts`, add `template_id` and `template_params` to the
`.select(...)` column list (line 19). Nothing else. Do NOT touch `NotificationItem.tsx`, the realtime subscription,
`PAGE_SIZE`, ordering, or the return shape.

After:
```
.select('id, user_id, type, title, body, link, is_read, created_at, template_id, template_params')
```

## Current behavior to preserve

- Fetch order (`created_at` desc), `limit(PAGE_SIZE)`, realtime re-fetch on `postgres_changes`, `unreadCount`
  computation, `loading` gate, `refetch` handle — all unchanged.
- Non-template (legacy `template_id=NULL`) notifications still render their stored `title`/`body` verbatim (the
  `else` branch is unchanged) — no regression for rows without a template.

## Required after behavior

- Every notification object returned by the hook now carries `template_id` + `template_params`.
- A template-driven row (e.g. the `support_created` complaint) renders localized per the **viewer's** locale:
  UA → Ukrainian ("Скарга на ваш акаунт"), SQ → Albanian ("Ankesë për llogarinë tuaj"), EN → English, IT → Italian.
- `price_change` / `saved_search_match` rows now localize AND consume their `template_params` (prices, counts,
  search name) — previously they fell back to stored strings.

## Positive flow

Authed user opens the bell. Hook fetches with the two new columns. `NotificationItem` sees `template_id` →
resolves `t('<templateId>_title'/_body', params)` in the current locale → localized title/body; date already
localizes via `formatDistanceToNow`. Switch `/uk` ↔ `/sq` → the SAME notification's text switches language.

## Negative flow

- `template_id=NULL` row → `else` branch → stored `title`/`body` verbatim (unchanged).
- Missing/malformed `template_params` (e.g. price row without numeric prices) → `NotificationItem`'s existing
  `safeT`/`resolvePriceChangeBody` guards return `null` → falls back to stored `body` (unchanged guard behavior).
- Missing template key in a locale → `safeT` returns `null` → stored fallback (unchanged).
- Empty list / loading / realtime insert → unchanged.
- RLS: the added columns are on the same `notifications` row the user already reads; no new table/policy — confirm
  `docs/rls-rules.md` needs no change (read-only column addition on an already-selectable row).

## Regression coverage (clause 15) — REQUIRED

Add a `notifications` row to `docs/critical-flow-registry.md` (notification localization is user-facing and has now
regressed once). Add a test that asserts a template-driven notification renders the **localized** title for a given
locale (e.g. render `NotificationItem` with `template_id='support_created'` under `uk` → "Скарга на ваш акаунт";
under `sq` → "Ankesë për llogarinë tuaj"). The test must FAIL if `template_id` is stripped from the object (proves
it guards this exact bug). Run it before (red on the bug) and after (green). Cite the command in the log.

## i18n / gates

No message keys change (`support_*`/`price_change_*`/`saved_search_match_*` already exist in all 4 locales —
verify parity with `check:i18n`). Gates: `tsc=0`, eslint clean on the file, `check:i18n`, `check:file-integrity`,
`check:mojibake` green; the new regression test green (+ red on planted violation). This is not a visual/story
change, but manually verify in the running app at `/uk` and `/sq` that the complaint notification switches language,
and paste that runtime evidence.

## Acceptance criteria

1. Diff adds ONLY `template_id, template_params` to the `.select()` in `useNotifications.ts`; no other change. (`file:line`)
2. `Notification` type already has the fields (no type edit needed) — cite `src/types/database.ts:460-461`.
3. Runtime proof: same notification renders Ukrainian under `/uk` and Albanian under `/sq` (screenshots or copied text). (Positive flow)
4. Non-template row still renders verbatim (Negative flow) — unchanged `else` branch.
5. New regression test in `docs/critical-flow-registry.md`'s named test: green after, red on planted `template_id` strip. (clause 15)
6. Gates green (tsc/eslint/check:i18n/file-integrity/mojibake + test). Flag any blocker honestly.
7. Session log: AC self-audit, Files Changed table, UX flow trace, registry row, no git run (single-writer).

## Hard contract

No scope change; no invented architecture; STOP and ASK if ambiguous. Do NOT emit `git add`/`git commit`. Update
`docs/backlog.md` + add `docs/sessions/2026-07-14-task595-*.md`. The orchestrator reviews the real diff + runtime
evidence and emits the commit.
