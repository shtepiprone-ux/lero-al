# Sprint 18 — Task 295 kickoff (Lint Baseline Burn-down — Sprint-17 17-problem baseline → 0/0)

> **Mandatory rules — non-negotiable:**
> - `docs/agent-contract.md` **clauses 1, 2, 6a, 9, 10**.
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Include a "Files Changed" table in the session log. Do NOT emit `git add`/`git commit`. NEVER run git. The orchestrator (Opus) emits explicit-path commit commands during review.
> - **No new baseline.** This task EXISTS to eliminate the baseline. Do NOT widen the ignore list, do NOT add `eslint-disable` without explicit orchestrator approval, do NOT downgrade rule severity, do NOT introduce `eslintignore`/`.lintstagedrc` skip patterns, do NOT change the governance scan to mask findings. A "baseline" is precisely the failure mode this task burns down. **If you cannot fix a finding without one of the above, STOP & ASK — do not invent the exception.**

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **hygiene/governance burn-down** task that touches code across UI components, server actions, hooks, Storybook, and the email layer — pre-read the bundles below. No scope change; STOP & ASK if ambiguous; literal AC; self-validate (Note 18); preserve every existing control (Note 20) and every UX branch (Note 19).

---

```
Type:        hygiene / governance burn-down (lint baseline elimination)
Priority:    HIGH (trust-restoring — until this lands, every "0 new errors" claim sits behind 17 known findings)
Area:        cross-cutting — Storybook stories, server actions, contact CTA components, admin manager unused imports, hooks dep arrays, AppImage permanent-exception decision
```

## Pre-read (from `docs/rule-index.md`)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.

**Required for this task (mixed UI + server-action + governance):**
- `docs/ai-behavior.md` → Notes 14 (Global change), 18 (Self-validation), 19 (UX flow preservation), 20 (Existing-control preservation).
- `docs/component-rules.md` — for the contact-CTA and AdminFooterManager / AdminInquiriesManager touches.
- `docs/data-access-rules.md` + `docs/domain-rules.md` — for the `contacts/actions/index.ts` `.update({ status })` findings (these write `ContactStatus`, not `ListingStatus` — see "Known-tricky finding C" below).
- `docs/qa-rules.md` — for pre-commit validation discipline.
- `docs/storybook-governance.md` — for the `PasswordInput.stories.tsx` `react-hooks/rules-of-hooks` fix pattern.
- `docs/eslint-debt-taxonomy.md` — historical context for the AppImage warning + useFavoritesRealtime warning. Note: the doc treats those as "Permanent exception" / "Deferred". This task RE-EVALUATES that classification — do not assume the doc's verdict is final, but also do not ignore it.
- `eslint.config.mjs` — to understand the flat-config structure, `LISTING_STATUS_IGNORES`, `IMAGE_RENDER_EXCEPTIONS`, and the override rule. **Do NOT edit `eslint.config.mjs`** to silence findings; if you believe a config change is the right fix (e.g. adding `src/modules/contacts/**` to `LISTING_STATUS_IGNORES` because `ContactStatus ≠ ListingStatus`), STOP & ASK with the proposed diff in the question.

**Only if relevant:** `docs/governance-enforcement.md` (only if the orchestrator approves a `LISTING_STATUS_IGNORES` addition). `docs/env.md` (only if the `window.location.href` fix needs `NEXT_PUBLIC_SITE_URL` — it does NOT for `tel:` schemes, see below).

**Out of scope from pre-read:** `docs/responsive-screenshot-governance.md`, `docs/state-authority.md`, `docs/rls-rules.md`, `docs/integrations.md`, `docs/performance.md`, `docs/analytics-rules.md`. This task does not touch responsive layouts, RLS, integrations, performance, or analytics behavior.

## Why this task exists (measured, 2026-05-29)

After Task 282 closed, `npm run lint` still reports **17 problems (7 errors, 10 warnings)** — the Sprint-17 baseline that Tasks 288, 290, 291, 292, 293 each acknowledged as "pre-existing, 0 new". Every "0 new" claim now sits behind a 17-finding wall, which makes every future executor report mutually self-confirming but unverifiable from `npm run lint` alone. The owner has decided: **stop accepting the baseline, burn it down**.

The exact, measured baseline is below. **Re-run `npm run lint` BEFORE starting** and paste the full output verbatim into the session log under "BEFORE" — if the count or files differ from this kickoff, STOP & ASK before editing anything.

### Baseline — 7 errors (must be 0)

| # | File:line | Rule | Notes |
|---|-----------|------|-------|
| 1 | `src/components/ui/PasswordInput.stories.tsx:40` | `react-hooks/rules-of-hooks` | `useState` called inside a `render: () => …` arrow whose name is lowercase. |
| 2 | `src/components/ui/PasswordInput.stories.tsx:68` | `react-hooks/rules-of-hooks` | same pattern, different story. |
| 3 | `src/components/ui/PasswordInput.stories.tsx:96` | `react-hooks/rules-of-hooks` | same pattern, third story. |
| 4 | `src/modules/contacts/actions/index.ts:164` | `no-restricted-syntax` (B3 — listing-status mutation gateway) | Writes `contact_inquiries.status` — a `ContactStatus`, NOT a `ListingStatus`. Rule false-positive. See "Known-tricky finding C". |
| 5 | `src/modules/contacts/actions/index.ts:236` | `no-restricted-syntax` (B3) | Same — `contact_inquiries.status` move-to-`in_progress` after first reply. |
| 6 | `src/modules/listings/components/ListingContact.tsx:87` | `no-restricted-syntax` (C — window.location) | `window.location.href = \`tel:${digits}\`` — fires the phone dialer. NOT in-app navigation; `router.push()` is the wrong fix. See "Known-tricky finding A". |
| 7 | `src/modules/listings/components/ListingMobileCTA.tsx:40` | `no-restricted-syntax` (C) | Same `tel:` dialer pattern as #6. |

### Baseline — 10 warnings (must be 0)

| # | File:line | Rule | Notes |
|---|-----------|------|-------|
| 1 | `src/components/admin/AdminFooterManager.tsx:13` | `@typescript-eslint/no-unused-vars` | `cn` imported but never used. |
| 2 | `src/components/admin/AdminFooterManager.tsx:141` | `@typescript-eslint/no-unused-vars` | `locale` destructured but never used inside the body. |
| 3 | `src/components/admin/AdminInquiriesManager.tsx:76` | `@typescript-eslint/no-unused-vars` | `tp` assigned via `useTranslations('admin.pages')` but never read. |
| 4 | `src/components/admin/AdminInquiriesManager.tsx:89` | `@typescript-eslint/no-unused-vars` | `mailboxes` derived from inquiries but never read (likely dead since `mailboxScope` arrived in Task 252). |
| 5 | `src/components/shared/Combobox.tsx:124` | `react-hooks/exhaustive-deps` | `useCallback` missing `dropdownMinWidth`. See "Known-tricky finding D". |
| 6 | `src/components/shared/FiltersPanel.tsx:23` | `@typescript-eslint/no-unused-vars` | `Combobox` import unused. Task 282 did NOT introduce this — pre-existing. |
| 7 | `src/components/ui/AppImage.tsx:130` | `@next/next/no-img-element` | The canonical `<img>` render site. See "Known-tricky finding B". |
| 8 | `src/modules/listings/components/ListingsFilters.tsx:20` | `@typescript-eslint/no-unused-vars` | `Combobox` import unused. Same pattern as #6. |
| 9 | `src/modules/listings/hooks/useFavoritesRealtime.ts:133` | `react-hooks/exhaustive-deps` | `useEffect` missing `displayedIdsRef`. A **ref** in a dep array is a known false-positive — refs don't trigger re-renders. See "Known-tricky finding E". |
| 10 | `src/modules/notifications/lib/sendTemplatedEmail.ts:91` | `@typescript-eslint/no-unused-vars` | `userId` parameter destructured but never used. |

## Goal

`npm run lint` reports **0 errors / 0 warnings** at the end of this task, with **no new baseline** introduced via any of: ignore-list expansion, `eslint-disable` comments (except where the orchestrator explicitly approves a narrowly justified exception), severity downgrades, rule deletion, or governance-scan exceptions. Every finding must be fixed at its actual source.

## Known-tricky findings — read BEFORE writing code

These five findings cannot be fixed by mechanical "delete the line" cleanups. The proposed strategy below is the orchestrator's current best guess — if you find a better fix that preserves runtime behavior and does NOT introduce a new exception/disable, take it and document why; if any of these strategies turn out to require an `eslint-disable` or a config change, **STOP & ASK** with the exact proposed diff in your question.

### A. `window.location.href = \`tel:${digits}\`` in `ListingContact.tsx:87` + `ListingMobileCTA.tsx:40`

`tel:` is NOT an in-app route. `router.push('tel:…')` is the WRONG fix (Next.js router targets app routes; it does not invoke the phone dialer). The ESLint rule (`no-restricted-syntax` selector C — see `eslint.config.mjs`) targets the literal `window.location.href = …` assignment pattern AND `window.location.assign/replace(…)` calls.

**Preferred fix:** replace the `window.location.href = …` assignment with a programmatic anchor click — this is semantically what a `tel:` link is, and it bypasses the regex selector because there is no `window.location` reference:

```ts
const a = document.createElement('a')
a.href = `tel:${digits}`
a.rel = 'noopener noreferrer'
a.click()
```

This preserves exact runtime behavior (the OS phone dialer opens) and is allowed under the governance rule because the rule's intent is to prevent SPA-routing-via-`window.location` (which Next.js needs to handle through `router.push`). A `tel:` URL is not SPA routing.

**Alternative fix (worse — discuss before using):** convert the entire CTA from a button-with-onClick into an `<a href={`tel:${digits}`}>` anchor. This eliminates the JS entirely, BUT it requires the digits to be known at render time — and the digits are currently fetched async via `getListingOwnerContact(listingId)` after the button is clicked (auth-gated). Switching to an anchor would either (a) leak the phone number to anonymous users (regression vs. Task 289's authenticated-only fix) or (b) require a two-step UX (click to reveal → render anchor → click again to dial), which is a UX flow change. Do NOT take this path without orchestrator approval.

**Behavior to preserve (Note 19 + 20):**
- Auth-gated dialer: the click handler still calls `getListingOwnerContact(listingId)` first; only on success does the dial trigger.
- `setContactLoading(true) / finally setContactLoading(false)` lifecycle preserved.
- WhatsApp branch (in `ListingContact.tsx`) — DO NOT touch; it uses `window.open(`https://wa.me/…`, …)` which is a permitted external navigation pattern (NOT a `window.location` assignment) and is not in the baseline.
- Analytics: `trackListingContactEvent({ … channel: 'whatsapp' })` (WhatsApp branch) preserved; if the `tel:` branch currently does NOT fire an analytics event, do NOT add one (would be a scope change vs. Task 277/289 contract).
- Toast on no-digits / contact_load_failed preserved exactly.
- `ListingMobileCTA`: the WhatsApp branch (also `window.open`) preserved untouched. Only the phone-dial branch changes.

### B. `<img>` element in `AppImage.tsx:130` (`@next/next/no-img-element`)

`AppImage` IS the canonical render site for raw `<img>` — `next/image` is project-wide banned (see `eslint.config.mjs` import governance). The `no-restricted-syntax` rule for raw `<img>` already exempts `AppImage.tsx` via `IMAGE_RENDER_EXCEPTIONS`. The `@next/next/no-img-element` warning is a SEPARATE Next.js plugin rule that recommends `next/image`. Since `next/image` is banned, this warning is fundamentally contradictory with project policy.

`docs/eslint-debt-taxonomy.md` calls this "Permanent exception". To clear it to 0 warnings without introducing a baseline, the only correct mechanism is a **single, narrowly-targeted `// eslint-disable-next-line @next/next/no-img-element` comment** on the offending line (line 130), with an explanatory comment above citing `eslint.config.mjs` `IMAGE_RENDER_EXCEPTIONS` and the `next/image` project-wide ban.

**This requires explicit orchestrator approval.** STOP & ASK with the proposed comment text BEFORE adding it. Do NOT pre-emptively add the disable on the assumption it will be approved.

If the orchestrator declines the disable, the alternative is to update `eslint.config.mjs` to project-wide disable `@next/next/no-img-element` (the rule is structurally incompatible with this project's image strategy). That ALSO requires explicit approval.

### C. `.update({ status })` in `src/modules/contacts/actions/index.ts:164,236`

`contact_inquiries.status` is `ContactStatus` (`new` / `in_progress` / `resolved` / `archived`), NOT `ListingStatus`. The ESLint rule B3 (`Property[key.name='status']` in any `.update()` call) was written specifically for the `listings.status` mutation gateway (`applyListingTransition`) — `contact_inquiries` has no such gateway and does not need one (different domain, different invariants).

The `LISTING_STATUS_IGNORES` array in `eslint.config.mjs` already exempts every other non-listing-status domain — `src/modules/notifications/**`, `src/lib/auth/**`, `src/modules/auth/**`, `src/app/admin/support/**`, `src/app/api/cron/**`, `src/app/api/presence/**`. **`src/modules/contacts/**` was omitted by oversight**, not by design.

**Preferred fix:** add `src/modules/contacts/**` to `LISTING_STATUS_IGNORES` in `eslint.config.mjs`, with a comment matching the existing pattern (`// Contacts module — writes ContactStatus, not ListingStatus`). This is consistent with the existing canonical exemption mechanism — it is NOT "weakening the rule"; the rule was never intended to fire on `contact_inquiries`.

**This requires explicit orchestrator approval.** STOP & ASK with the proposed `eslint.config.mjs` diff (just the one-line addition + comment) BEFORE editing the config.

**Do NOT** introduce a `contact_inquiries` "mutation gateway" mimicking `applyListingTransition` — that is unwarranted architecture invention (clause 2).
**Do NOT** rename the column or restructure the update — behavior must be preserved (clause 5).
**Do NOT** add `eslint-disable-next-line` for B3 on these lines — the ignore-list path is the canonical fix.

### D. `Combobox.tsx:124` `useCallback` missing `dropdownMinWidth`

Open the surrounding code and decide:
- If `dropdownMinWidth` is read inside the `useCallback` body, the dep is genuinely missing — add it. Trace the call sites to confirm no infinite-update loop is created.
- If `dropdownMinWidth` is referenced but only used as a constant from props (does not change after first render in any consumer), adding it to the array is still the correct fix — React will not re-invoke unnecessarily.
- If adding the dep causes a measurable regression (re-position loops on resize/scroll), STOP & ASK — do not add `eslint-disable-next-line`.

The orchestrator's best-guess fix: add `dropdownMinWidth` to the dep array. Justify the choice in the session log.

### E. `useFavoritesRealtime.ts:133` `useEffect` missing `displayedIdsRef`

`displayedIdsRef` is a **React ref** — refs are stable across renders and do NOT need to be in dep arrays (the docs explicitly say refs are exempt). The exhaustive-deps rule has a known false-positive here.

**Preferred fix:** the comment on the dep array (`// re-subscribe only if userId changes`) documents the runtime intent. If `displayedIdsRef.current` is read inside the effect body, the canonical pattern to satisfy the rule WITHOUT changing behavior is to capture the ref into a local at effect entry — but that may not help here because the rule wants the ref OBJECT itself in deps. The cleanest legitimate fix is to ensure the ref read happens via `displayedIdsRef.current` inside any inner callbacks (refs read by .current are stable; the LINTER may still complain).

If the rule continues to fire after a clean refactor, this is the second case (alongside finding B) where a single narrow `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining "ref deliberately excluded; re-subscribe only on userId" may be the correct answer. **STOP & ASK** before adding it.

`docs/eslint-debt-taxonomy.md` marks this as "Deferred — requires realtime subscription behavior testing". This task RE-EVALUATES that classification. If you find a way to refactor the effect so the rule is satisfied with no behavior change AND no disable, that is the preferred outcome.

## Straightforward findings (no orchestrator approval needed)

- **`PasswordInput.stories.tsx` ×3** — extract each `render: () => { … useState … }` into a properly-cased component (e.g. `function WithHintIdleRender() { … }`) and reference it via `render: () => <WithHintIdleRender />`. This satisfies the rule-of-hooks AND keeps every story visible in Storybook with identical behavior. Do not delete any story. Preserve the `parameters.docs.description.story` text exactly.
- **`AdminFooterManager.tsx` `cn` unused (line 13)** — delete the import.
- **`AdminFooterManager.tsx` `locale` unused (line 141)** — investigate first: if the destructured prop is genuinely never read, remove it from the destructure (and from the prop type if it was a `LocaleTab` type-level entry never threaded through). If a consumer passes it, leave the consumer alone — only delete the unused entry on the receiver side.
- **`AdminInquiriesManager.tsx` `tp` (line 76)** — delete the unused `useTranslations` call. Verify nothing else in the body actually uses it.
- **`AdminInquiriesManager.tsx` `mailboxes` (line 89)** — investigate: this was likely live-then-dead after Task 252's `mailboxScope` prop added (server-side mailbox filtering). If no JSX references `mailboxes`, delete the declaration. If a hidden client-side fallback uses it, leave it AND STOP & ASK.
- **`FiltersPanel.tsx` `Combobox` unused (line 23)** — delete the import.
- **`ListingsFilters.tsx` `Combobox` unused (line 20)** — delete the import.
- **`sendTemplatedEmail.ts` `userId` (line 91)** — investigate: the function signature claims `userId?: string` is consumed for tracking/audit. If it really is dead (no use in body), delete it from `SendTemplatedEmailOptions` AND audit every call site (Note 14 — global change rule) to remove the `userId:` field. If even one caller passes `userId` for a future-planned audit feature, STOP & ASK before deleting — the dead-but-reserved param may need to stay with an `_userId` underscore prefix or a `void userId` no-op to satisfy the linter while keeping the API surface.

## Required investigation (PASTE outputs in the session log)

```
npm run lint                                     # capture FULL output verbatim (NOT tail) — BEFORE
sed -n '40,140p' src/components/ui/PasswordInput.stories.tsx
sed -n '150,260p' src/modules/contacts/actions/index.ts
sed -n '75,95p'  src/modules/listings/components/ListingContact.tsx
sed -n '30,50p'  src/modules/listings/components/ListingMobileCTA.tsx
sed -n '10,18p;135,150p' src/components/admin/AdminFooterManager.tsx
sed -n '70,100p' src/components/admin/AdminInquiriesManager.tsx
sed -n '110,140p' src/components/shared/Combobox.tsx
sed -n '125,150p' src/components/ui/AppImage.tsx
sed -n '20,30p'  src/components/shared/FiltersPanel.tsx
sed -n '15,25p'  src/modules/listings/components/ListingsFilters.tsx
sed -n '120,140p' src/modules/listings/hooks/useFavoritesRealtime.ts
sed -n '85,100p' src/modules/notifications/lib/sendTemplatedEmail.ts
grep -rn "userId" src/modules/notifications/   # if planning to drop the param
grep -rn "sendTemplatedEmail(" src/             # all call sites of #10
grep -rn "dropdownMinWidth" src/components/shared/Combobox.tsx
grep -rn "displayedIdsRef" src/modules/listings/hooks/
```

After each known-tricky finding (A–E), paste your proposed fix as a diff in the session log BEFORE applying it. For A, C, D, E, this can proceed without approval if your strategy matches the kickoff's "preferred fix" exactly. For B (AppImage `eslint-disable`) and C (LISTING_STATUS_IGNORES addition), STOP & ASK is mandatory.

## Scope (files Sonnet may touch)

- The 9 source files containing the 17 findings (listed in the baseline tables above).
- `eslint.config.mjs` — **ONLY if the orchestrator approves the `LISTING_STATUS_IGNORES` addition** (finding C). Untouched otherwise.
- `docs/eslint-debt-taxonomy.md` — to update the "Current Lint Status" section from "0 errors / 6 warnings" (stale post-Task-71) to "0 errors / 0 warnings" once the burn-down is complete, plus a brief paragraph crediting this task with eliminating the Sprint-17 re-accumulated 17-problem baseline.
- `docs/backlog.md` (closure entry — a NEW row in the Session Archive table; do NOT rewrite the "Last Session" block, do NOT touch unrelated rows).
- `docs/sessions/2026-05-29-task-295-lint-baseline-burn-down.md` (NEW).

## Out of scope (do NOT touch)

- **Task 283's files:** any Tailwind entropy debt (button-like className clones, `py-10`, arbitrary font-sizes). Even if you SEE such patterns in the files you edit, leave them — that is 283's burn-down.
- **Task 294's files:** any filter selection/counting logic in `FiltersPanel.tsx` or `ListingsFilters.tsx` beyond removing the unused `Combobox` import. Do not rewire selection, counters, chips, or URL sync.
- **Production auth, RLS, server-action business logic, migrations, locale files, governance scans, governance reports.**
- **Any visual redesign, spacing change, color change, copy change, new feature, or new locale key.** This task should add ZERO new locale keys.
- **WhatsApp branches** in `ListingContact.tsx` and `ListingMobileCTA.tsx` (already-correct `window.open` patterns; NOT in the baseline; do NOT refactor them).
- **`AppImage.tsx` rendering logic** beyond the single line with the warning. Do NOT migrate to `next/image` (banned).
- **`useFavoritesRealtime.ts` subscription logic** beyond the dep-array fix. Do NOT change channel subscription, optimistic updates, deletedDuringFetch dedup, or the `userId` re-subscribe semantic.
- **`PasswordInput.tsx`** itself. This task only refactors `.stories.tsx`.
- **The `applyListingTransition.test.ts` direct-status-write errors** (already pre-existing in baseline at unrelated lines per Task 288's session — NOT in this kickoff's baseline list). If you see them, they are out of scope.

## Positive flow (happy path)

Actor: developer running `npm run lint` locally or in CI.
1. Developer runs `npm run lint`.
2. ESLint scans the codebase.
3. Output: `✔ 0 problems (0 errors, 0 warnings)` (exit code 0).
4. Post-condition: no source file has a new `eslint-disable` comment that was not approved by the orchestrator; `eslint.config.mjs` is unchanged OR has the single approved `LISTING_STATUS_IGNORES` addition for `src/modules/contacts/**`; every runtime behavior in the 9 touched source files is preserved (the dial still dials, the Storybook stories still render with the same UI, the contact-inquiry status transitions still write the same DB values, the admin manager UIs still render with the same content, the realtime favorites still re-subscribe on `userId` change only).

## Negative flow (every off-happy-path branch)

- **A new lint finding surfaces during the fix** (e.g. extracted Storybook render component introduces a new unused-var warning, or `document.createElement('a').click()` triggers a different rule): STOP and re-fix — do not accept a new finding as "fine, we netted out". The task acceptance is exactly 0/0; any non-zero count = fail.
- **A behavior regression appears** (tel: dialer doesn't fire on iOS Safari; Storybook story renders blank; contact-inquiry status update silently no-ops; combobox dropdown position now glitches on scroll): STOP and rollback the change for that finding; STOP & ASK with the regression evidence.
- **Orchestrator declines the AppImage `eslint-disable`** (finding B): your options are (a) accept the warning as remaining baseline (which CONTRADICTS this task — fail) OR (b) project-wide disable `@next/next/no-img-element` in `eslint.config.mjs`. Both require approval; STOP & ASK with the two diffs presented as alternatives.
- **Orchestrator declines the `LISTING_STATUS_IGNORES` addition** (finding C): the only remaining options are to refactor the `contact_inquiries.status` writes through a synthetic indirection (e.g. an object literal built piecewise so the AST doesn't match B3's selector) — which is ugly architecture invention (clause 2) — OR to widen the rule selector to listing-table-only. Both require approval; STOP & ASK with the proposed diff.
- **`useFavoritesRealtime` refactor introduces a re-subscription loop** (channel torn down + re-opened on every render): STOP and rollback; the original behavior MUST be preserved exactly.
- **Removing `userId` from `sendTemplatedEmail` breaks even one caller's typecheck**: STOP — the dead-but-reserved param needs the `_userId` underscore-prefix treatment, NOT an API-shape change. Do not propagate the deletion through call sites.
- **The Storybook stories' visual output changes after extraction** (different padding, missing label, etc.): STOP — the extraction must be transparent (`render: () => <WithHintIdleRender />` produces the same DOM as `render: () => { … inline JSX … }`).
- **Cancel/dismiss / loading / error states in `ListingContact` or `ListingMobileCTA` change behavior**: STOP — preserve `setContactLoading(false)` in `finally`, preserve `toast.error(t('contact_load_failed'))` paths, preserve the early-return on missing digits.

## Acceptance criteria (literal)

- `npm run lint` reports **exactly `✔ 0 problems (0 errors, 0 warnings)` and exit code 0**.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run governance:primitives` → no regression vs. post-Task-282 state (`C0/H2/M0` — the 2 `window.location` HIGH violations should now ALSO be 0 because finding A's fix eliminates them). State `C0/H0/M0` in the session log AFTER block.
- `npm run governance:report` (or each governance:* scan individually if `report` does not exist) → no NEW violations vs. current baseline. Paste the baseline-comparison output in the session log. If `governance:report` does not exist as a script, run each `governance:*` script individually and state which ones you ran.
- `npx vitest run` → all currently-passing suites continue to pass (no test regression from your changes; the previously-failing suites do not need to start passing, but the previously-passing 368 must not drop).
- **No new `eslint-disable*` comment in any source file** UNLESS the orchestrator explicitly approved it (finding B). Each approved disable must be (a) `eslint-disable-next-line`, not file-wide; (b) name the specific rule, not blanket; (c) carry a comment line above explaining WHY.
- **No new entry in any ignore/allowlist** UNLESS the orchestrator explicitly approved it (finding C — `LISTING_STATUS_IGNORES` addition for `src/modules/contacts/**`).
- **No ESLint rule severity downgraded, deleted, or moved to `warn`** from its current level.
- **No `eslint.config.mjs` change** other than the approved `LISTING_STATUS_IGNORES` addition (if approved).
- **No new locale key, no copy change, no visual change.**
- Every existing control on every touched surface preserved (Note 20 — admin manager rows, Storybook stories, contact CTA buttons, AppImage variants, realtime favorites updates).
- Every UX branch on every touched surface preserved (Note 19 — loading/error/success/cancel for the contact CTA; subscribe/teardown for realtime favorites; dialog/sheet behavior NOT in scope since not touched).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict line: `Self-validation: lint=0/0 · tsc=0 · build=passes · governance=no-regression · vitest=no-regression · scope=clean · PASS`.

## Required deliverable — session log (`docs/sessions/2026-05-29-task-295-lint-baseline-burn-down.md`)

1. **BEFORE block** — the full `npm run lint` output verbatim (NOT `tail -15`). Must match this kickoff's baseline tables; if it does not, STOP & ASK before editing.
2. **AFTER block** — the full `npm run lint` output verbatim. Must be `✔ 0 problems (0 errors, 0 warnings)`.
3. **Per-finding resolution table** — one row per finding (17 rows):

   | # | File:line | Rule | Strategy | Why behavior preserved | Approval needed |
   |---|-----------|------|----------|------------------------|-----------------|
   | 1 | … | … | … | … | none / orchestrator-approved (link to approval) |

4. **Files Changed table** (Task 264) — one row per touched path + 1-line rationale per file.
5. **Note 18 self-validation table** — every AC bullet → ✅ + file:line OR runtime step.
6. **Governance verification** — paste `governance:primitives` BEFORE and AFTER counts; paste `governance:report` output (or each governance:* script individually if `report` script is absent).
7. **Test verification** — `npx tsc --noEmit` output (last 5 lines), `npm run build` last 10 lines, `npx vitest run` summary line.
8. **Confirmation lists** — confirm Task 282 / Task 283 / Task 294 files were NOT touched outside the lint-fix scope; confirm no new locale keys added; confirm no copy/visual change.
9. **Self-validation verdict line.**

## Final report required

After the session log lands, in your final response to the orchestrator state:
1. Final lint count (must be 0/0).
2. Which (if any) findings required orchestrator approval and what was approved.
3. Files Changed table (mirroring the session log).
4. Confirmation that `tsc`, `build`, `governance:primitives`, `governance:report`, `vitest` all pass with no regression.
5. Confirmation that NO new `eslint-disable` was added without approval AND NO ignore-list entry was added without approval AND NO config-rule severity change was made.

Do NOT emit git commands. Do NOT run git. Do NOT redesign UI. Do NOT touch Task 283 / 294 files beyond the lint-fix scope. Do NOT introduce new architecture for `contact_inquiries`. Do NOT migrate `AppImage` to `next/image`. STOP & ASK on findings B and C BEFORE editing. STOP & ASK on any finding where the proposed fix doesn't match this kickoff's "preferred fix" exactly.
