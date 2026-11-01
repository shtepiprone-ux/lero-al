# Task 939 — Locale leak shards green: no live Supabase client in Storybook, and the long-range Story played below 640px

Sprint 92. P1. QA profile **Q2** (two Storybook artifacts change visibly in the built Storybook: the four FavoritesShell Stories
render their content instead of the error screen, and `CustomRangeTooLong` ends on its alert below 640px; no product component,
token or runtime file changes, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01. Published on PR #12 (D7) as the task for the
four red Locale Leak Detection jobs (D8).

## 1. Mode, task type and rule bundle

Product task. **Implementer: Sonnet, fresh session (`execute-task`). Reviewer: Opus.** Types (`docs/rule-index.md`): Storybook
configuration, Story play functions, frontend and server security tests. Bundle: `.claude/rules/shared/security-testing.md`,
`security-test-quality.md`, `security-test-environment.md`, `workflow-gates.md` with its companions,
`claim-evidence-contract.md`, `task-readiness.md`, `canonical-component-reuse.md`, `mobile-adaptation-contract.md`,
`ui-token-contract.md`, `enforcement-model.md`, `storybook-proof.md`, and `docs/storybook-governance.md` §9.

## 2. Objective

On PR #12, Locale Leak Detection shards 1–4 end with an incomplete scan (C1, C2): 14 Story tuples fail to render, 12 of the four
FavoritesShell Stories and 2 of `DashboardPeriodControl / CustomRangeTooLong` at the two mobile widths (C3, C4). The detector counts
a page error or a Storybook "Error rendering story" message as a failed tuple (C5, C6) since Task 923 (C7). Both failures are real
Story defects, not detector defects:

- FavoritesShell's realtime hook creates the browser Supabase client (C9), which throws in a Storybook built without Supabase
  configuration (C8, C10, C11). A Story that runs the Supabase client breaks `docs/storybook-governance.md` §9 (C12, C13), and the
  Story's own comment claims the opposite (C14).
- `CustomRangeTooLong` plays the desktop picker only: it waits for the Next arrow (C26), which exists only in the desktop body
  (C22); below the 640px gate the picker renders its mobile body with a Confirm button (C23, C24, C25), so the play fails (C21).

The task makes Storybook resolve the browser client to an inert stub, gives the play function the mobile branch the picker already
has, and proves both with security tests, a regression comparison of every affected Story and the six detector shards.

## 3. Verified context

Storybook already uses exact-specifier stubs for server-only modules next to the `@` alias (C15, C16). Of 192 Story files, 32 reach
the browser client through their imports (C17). A probe build with an inert client aliased before `@` rendered all 130 Stories of
those 32 files: 126 identical to the CI build and 4 different, the four FavoritesShell Stories, each from failed to clean (C18, C19).
A local build keeps the local `NEXT_PUBLIC_*` values unless they are emptied, and then renders AuthSheet differently from CI (C20);
CI builds with no such values (C11). A probe of the planned mobile route (start day, end day, Confirm) on the picker shows the
localized 90-day alert at 320, 375 and 639 in four locales, and the desktop body (Next arrow, no Confirm) from 640 (C28, C29). The
favorites server actions scope every write to the session user and refuse an anonymous caller (C30, C31); their raw database
message is a known gap outside this task (C32). None of the changed files is in the reviewed Task 923 D8/D9 scope (C33), so no
scope rebase is needed. The UI receipts in §6 were run through the real write hook (C34).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | Locale Leak shard 1 on PR #12 ended with an incomplete scan. | source: `docs/sessions/evidence/task939/design/l00-ci-excerpts.txt:6-6`; observed: `Incomplete locale scan: 711/720 tuples; 3 render errors.` |
| C2 | FACT | Locale Leak shard 2 ended with an incomplete scan with five render errors. | source: `docs/sessions/evidence/task939/design/l00-ci-excerpts.txt:12-12`; observed: `Incomplete locale scan: 705/720 tuples; 5 render errors.` |
| C3 | FACT | The failed tuples include every viewport of the FavoritesShell Stories. | source: `docs/sessions/evidence/task939/design/l00-report-errors.txt:2-2`; observed: `shard1 complete=false mantine-primitives-favoritesshell--empty mobile-320 en reason=Story render/play failed` |
| C4 | FACT | CustomRangeTooLong fails at the mobile widths. | source: `docs/sessions/evidence/task939/design/l00-report-errors.txt:8-8`; observed: `patterns-mantine-dashboardperiodcontrol--custom-range-too-long mobile-320 en reason=Story render/play failed` |
| C5 | FACT | The detector counts a page error as a failed render. | source: `scripts/check-locale-leak.mjs:385-385`; observed: `page.on('pageerror', () => { runtimeFailure = true; });` |
| C6 | FACT | The detector counts a Storybook render error message as a failed render. | source: `scripts/check-locale-leak.mjs:387-387`; observed: `Error rendering story '${story.id}'` |
| C7 | FACT | The runtime-failure counting came with the Task 923 squash. | source: `docs/sessions/evidence/task939/design/p00-detector-history.txt:1-1`; observed: `d8a07a3c7 docs(Task923, Task927)` |
| C8 | FACT | The FavoritesShell Stories fail on the Supabase client in the CI Storybook. | source: `docs/sessions/evidence/task939/design/p01-render-probe.txt:2-2`; observed: `Your project's URL and API key are required to create a Supabase client!` |
| C9 | FACT | The favorites realtime hook creates the browser client inside its effect. | source: `src/modules/listings/hooks/useFavoritesRealtime.ts:54-54`; observed: `const supabase = createClient()` |
| C10 | FACT | The browser client is built from the public Supabase URL variable. | source: `src/lib/supabase/client.ts:70-70`; observed: `process.env.NEXT_PUBLIC_SUPABASE_URL!,` |
| C11 | FACT | CI builds Storybook with a plain build command. | source: `.github/workflows/governance-pr.yml:280-280`; observed: `"run": "npm run build-storybook"` |
| C12 | FACT | Storybook governance forbids the Supabase client in Stories. | source: `docs/storybook-governance.md:284-284`; observed: `Supabase client usage in stories` |
| C13 | FACT | Storybook governance forbids live API calls in Stories. | source: `docs/storybook-governance.md:283-283`; observed: `Live API calls / fetch() in stories` |
| C14 | FACT | The FavoritesShell Story claims its unmocked hooks do not throw. | source: `docs/sessions/evidence/task939/design/sources/src__stories__mantine__primitives__FavoritesShell.stories.tsx.txt:21-21`; observed: `both degrade gracefully rather than throwing` |
| C15 | FACT | Storybook resolves the `@` alias to src. | source: `docs/sessions/evidence/task939/design/sources/.storybook__main.ts.txt:30-30`; observed: `'@': path.resolve(__dirname, '../src'),` |
| C16 | FACT | Storybook already maps exact specifiers to stubs. | source: `docs/sessions/evidence/task939/design/sources/.storybook__main.ts.txt:40-40`; observed: `'next/headers': path.resolve(__dirname, './stubs/next-headers.ts'),` |
| C17 | FACT | 32 of 192 Story files reach the browser client (executed import-graph probe). | source: `docs/sessions/evidence/task939/design/p02-client-reach.txt:66-66`; observed: `32 of 192 Story files reach src/lib/supabase/client.ts` |
| C18 | FACT | With the inert client, 126 of the 130 affected Stories render identically to CI (executed probe). | source: `docs/sessions/evidence/task939/design/p04-stub-regression-probe.txt:132-132`; observed: `130 stories from 32 files: 126 identical, 4 different` |
| C19 | FACT | A differing Story goes from failed to clean with the inert client. | source: `docs/sessions/evidence/task939/design/p04-stub-regression-probe.txt:133-133`; observed: `"b":{"phase":"finished","failure":false,"len":82}` |
| C20 | FACT | A build that keeps the local public values renders AuthSheet differently from CI. | source: `docs/sessions/evidence/task939/design/p05-authsheet-diff.txt:6-6`; observed: `Security verification failed. Please try again.` |
| C21 | FACT | CustomRangeTooLong fails below 640px looking for the Next arrow. | source: `docs/sessions/evidence/task939/design/p01-render-probe.txt:67-67`; observed: `Unable to find role="button" and name "Next"` |
| C22 | FACT | The Next arrow is rendered by the desktop picker body. | source: `src/design-system/mantine/patterns/RangeDatePicker.tsx:445-445`; observed: `aria-label={t('aria_next')}` |
| C23 | FACT | The mobile picker body ends with a Confirm button. | source: `src/design-system/mantine/patterns/RangeDatePicker.tsx:818-818`; observed: `{t('confirm')}` |
| C24 | FACT | The picker switches to its mobile body below the mobile gate. | source: `src/design-system/mantine/patterns/RangeDatePicker.tsx:945-945`; observed: `const isMobile = useMediaQuery(belowMobileGateQuery(theme)) ?? false` |
| C25 | FACT | The below-gate media query is one shared function. | source: `src/design-system/mantine/belowMobileGate.ts:14-14`; observed: `export function belowMobileGateQuery(` |
| C26 | FACT | The play function waits for the Next arrow. | source: `docs/sessions/evidence/task939/design/sources/src__stories__patterns__mantine__DashboardPeriodControl.stories.tsx.txt:103-103`; observed: `storyT(l, 'common.aria_next')` |
| C27 | FACT | The play function confirms with Apply. | source: `docs/sessions/evidence/task939/design/sources/src__stories__patterns__mantine__DashboardPeriodControl.stories.tsx.txt:107-107`; observed: `storyT(l, 'common.apply')` |
| C28 | FACT | Below 640px the planned route shows the 90-day alert (executed probe, four locales, 320/375/639). | source: `docs/sessions/evidence/task939/design/p06-mobile-route-probe.txt:1-1`; observed: `PASS width=320 locale=en belowGate=true nextButtons=0 confirmButtons=1` |
| C29 | FACT | From 640px the picker shows the desktop body. | source: `docs/sessions/evidence/task939/design/p06-mobile-route-probe.txt:13-13`; observed: `DESKTOP width=640 locale=en belowGate=false nextButtons=1 confirmButtons=0` |
| C30 | FACT | Adding a favorite writes the session user's id. | source: `src/modules/listings/actions/favoriteActions.ts:32-32`; observed: `.insert({ user_id: authUser.id, listing_id: listingId })` |
| C31 | FACT | An anonymous caller is refused. | source: `src/modules/listings/actions/favoriteActions.ts:25-25`; observed: `if (!authUser) return { error: 'unauthenticated' }` |
| C32 | FACT | The raw database message of the favorites actions is a recorded gap outside the current contracts. | source: `src/modules/__tests__/noDbMessage.security.test.ts:73-73`; observed: `outside the scope of both contracts` |
| C33 | FACT | The Storybook files of this task are outside the reviewed Task 923 D8/D9 scope (executed probe). | source: `docs/sessions/evidence/task937/design/p01-reviewed-scope-membership.txt:12-15`; observed: `outside   .storybook/stubs/supabase-client.ts` |
| C34 | FACT | The four UI receipts of §6 let the real write hook allow both Story edits and are refused without them. | source: `docs/sessions/evidence/task939/design/p07-receipt-blackbox.txt:9-9`; observed: `RECEIPT BLACK-BOX PASSED` |
| C35 | FACT | The English label of the picker's Confirm button. | source: `messages/en.json:417-417`; observed: `"confirm": "Confirm",` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D8 | OWNER DECISION | Each red CI check gets its own task. | owner: 2026-11-01; decision: `A separate task for each check (Recommended)` |

## Mobile adaptation record
- Scope: visible
- Surfaces: src/design-system/mantine/patterns/RangeDatePicker.tsx — the custom period picker opened from MantineDashboardPeriodControl in the `CustomRangeTooLong` Story; src/modules/listings/components/FavoritesShell.tsx — the favorites grid and its empty, no-match and error states in the four FavoritesShell Stories
- Component families: form-picker-and-choice, filter-and-action-toolbar, media-gallery-and-listing-contact
- Pattern IDs: form-stack, inline-control, grid-media-reflow
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation, android-common-layouts, android-adapt-layouts
- Mantine mechanism: media-query-exception, responsive-props
- Mantine owner: src/design-system/mantine/patterns/RangeDatePicker.tsx, src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx, src/design-system/mantine/patterns/MantineListingCardTrack.tsx
- Mobile range and switches: inherited and unchanged — below 640px (theme.other.mobileGate / sm, `belowMobileGateQuery`, C24, C25) the picker shows its mobile body with every month of its window stacked and Confirm last; from the 640px transition the desktop body with two months, the arrows and Apply (C29); the favorites grid keeps MantineListingCardTrack's own reflow
- Mobile order: period control; then the picker sheet — month header, stacked months, Confirm; then the alert under the control. Favorites — type filter, then the cards, or the empty, no-match or error message
- Required-content treatment: no semantic loss — the alert text, the empty and error messages and the card text wrap as the owners already render them; nothing is clamped or hidden by this task
- Story and verification: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx (`CustomRangeTooLong`) and src/stories/mantine/primitives/FavoritesShell.stories.tsx (Populated, Empty, TypeFilterNoMatches, Error); the detector's 320, 375 and 1280 widths in four locales (R9), plus the owner visual matrix at 320, 390, 639, 640, 768, 1024, 1440 in sq, en, uk, it (R10)

## 4. Scope and out of scope

The final diff changes exactly: `.storybook/stubs/supabase-client.ts` (new), `.storybook/main.ts`,
`src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx`, `src/stories/mantine/primitives/FavoritesShell.stories.tsx`,
`src/tests/storybook/supabaseClientStub.security.test.tsx` (new),
`src/modules/listings/actions/__tests__/favoriteActions.security.test.ts` (new), the stage/report fields of this task's sidecar,
and evidence under `docs/sessions/evidence/task939/impl/` and `docs/sessions/evidence/task939/security/`. Edited only temporarily
for the planted breaks of R7 and restored byte-for-byte: `src/modules/listings/actions/favoriteActions.ts` and the new stub.

Out of scope: any product component, hook, action, token or message change; `scripts/check-locale-leak.mjs` and every other gate
(the detector is right, C5, C6); the 105 locale leaks shard 5 reports under the owner migration exception (`--report-only-leaks`);
the raw database message of the favorites actions (C32); the other red jobs of PR #12 (Tasks 937, 938, 942); the 931 and 940 work
in progress. If the stub changes any Story outside FavoritesShell, stop and report it.

## 5. Current and required behaviour

Preserved: every product file byte-for-byte; the desktop steps and both assertions of `CustomRangeTooLong`; every other Story's
rendered result (C18); the existing Storybook aliases and stubs. Required: no Story creates a live Supabase client in any
Storybook build; `CustomRangeTooLong` passes at every width; the six detector shards complete with zero render errors.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C8; C9; C10; C12; C13] | **Inert browser client.** New `.storybook/stubs/supabase-client.ts` exports only `createClient()` (the only export of `src/lib/supabase/client.ts` and the only name its importers use). It returns one shared object with the behaviour of the design probe (`docs/sessions/evidence/task939/design/p03-probe-supabase-client-stub.ts.txt`): `from()` gives a chain whose `single`, `maybeSingle` and `then` resolve `{ data: null, error: null }`; `rpc` resolves the same; `channel()` returns an object whose `on`/`subscribe` return itself and whose `unsubscribe` resolves `'ok'`; `removeChannel` resolves `'ok'`; `auth.getSession`/`getUser` resolve no session or user and `auth.onAuthStateChange` returns an unsubscribe. Each `createClient()` call increments `globalThis.__LERO_STORYBOOK_SUPABASE_STUB_CALLS__`. The file uses no `fetch`, `WebSocket`, `XMLHttpRequest` or `EventSource`, and its header states the reason (governance §9, Task 939) in the style of `next-headers.ts`. | P1 | AC1, AC4 |
| R2 [C15; C16; C17] | **Exact alias.** `.storybook/main.ts` maps `'@/lib/supabase/client'` to the stub, placed before `'@'` (the first matching alias wins), with a comment naming Task 939 and governance §9; no other alias changes. | P1 | AC4 |
| R3 [C14] | **FavoritesShell Story note.** The comment's claim that the realtime hook is unmocked and degrades gracefully is replaced by the truth: Storybook resolves the browser client to the inert stub, so the realtime channel never connects. No other change to the Story. | P2 | AC5 |
| R4 [C21; C22; C23; C24; C25; C26; C27; C28; C29; C35] | **Mobile branch of `CustomRangeTooLong`.** When `window.matchMedia(belowMobileGateQuery(theme)).matches` (`theme` from `@/design-system/mantine/theme`, the gate the picker itself uses), the play presses Enter on 2026-01-05, on 2026-05-05, then on the `common.confirm` button; otherwise it keeps today's desktop steps unchanged. Both branches then run the existing alert-text and `onChange`-not-called assertions. The Story comment names both branches. | P1 | AC2, AC5 |
| R5 [C8; C9; C10] | **Frontend security tests** in `src/tests/storybook/supabaseClientStub.security.test.tsx`: the real `useFavoritesRealtime` on the real stub (via `vi.mock('@/lib/supabase/client', …)` importing `.storybook/stubs/supabase-client.ts`), and the real `src/lib/supabase/client.ts` through `vi.importActual` with both public variables stubbed empty (`vi.stubEnv`). | P1 | AC1 |
| R6 [C30; C31; C32] | **Server security tests** in `src/modules/listings/actions/__tests__/favoriteActions.security.test.ts`: the real `addFavorite`/`removeFavorite` with doubles at `@/lib/auth/server` (`getUser`), `@/lib/auth/blockCheck` (`getBlockedError`), `@/lib/supabase/server` (`createClient`) and `next/cache` (`revalidatePath`). The raw-message gap (C32) is not asserted either way. | P1 | AC1 |
| R7 [C9; C30; C31] | **Planted breaks**, one at a time, then restored: P1 the stub's `subscribe` constructs `new WebSocket('ws://127.0.0.1:9')` → SEC-939-FE-STUB-DENY fails; P2 `addFavorite` loses its `if (!authUser)` guard → SEC-939-SRV-FAV-DENY fails; P3 `addFavorite` inserts `user_id: listingId` → SEC-939-SRV-FAV-ALLOW fails. Each with the failed assertion and, after restore, `git diff --exit-code -- src/modules/listings/actions/favoriteActions.ts` exit 0 and the stub's SHA-256 equal to its pre-break value. | P1 | AC3 |
| R8 [C17; C18; C19; C20] | **Regression comparison on CI-equivalent builds.** Build A from the unchanged tree and build B after R1–R4, each with every `NEXT_PUBLIC_*` name of `.env.local` set to the empty string in the build process (C20); copy A out of `storybook-static/` before building B. Run a copy of the design probe `p04-stub-regression-probe.mjs` (with `p02-client-reach.txt` rerun on the final tree) over A and B: only the four FavoritesShell Stories differ, each B result `failure:false`; in B every FavoritesShell Story reads `__LERO_STORYBOOK_SUPABASE_STUB_CALLS__` ≥ 1. | P1 | AC4 |
| R9 [C1; C2; C3; C4; C5; C6] | **Detector shards.** With build B in `storybook-static/`, `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=N/6` for N = 1…6 each exits 0, and every shard report has `complete` true and no tuple with reason `Story render/play failed`. | P1 | AC4 |
| R10 [C28; C29] | **Owner visual matrix (Q2).** From build B, screenshots of the four FavoritesShell Stories and of `CustomRangeTooLong` after its play, at 320, 390, 639, 640, 768, 1024, 1440 in sq, en, uk, it, listed as an `OWNER VISUAL QA REQUIRED` matrix of story × locale × width tuples. | P2 | AC6 |

## Acceptance criteria

- **AC1 [R1; R5; R6].** SEC-939-FE-STUB-ALLOW, SEC-939-FE-STUB-DENY, SEC-939-FE-CLIENT-ERROR, SEC-939-SRV-FAV-ALLOW, SEC-939-SRV-FAV-DENY, SEC-939-SRV-FAV-BLOCKED-DENY and SEC-939-SRV-FAV-ERROR pass; `npx vitest run` on the two new files reports 0 failed and 0 skipped.
- **AC2 [R4].** In build B, `CustomRangeTooLong` finishes without a render error at 320, 375, 639, 640 and 1280 in sq, en, uk and it, and the alert text equals `dashboard.period.error_longer_than_90_days` of that locale (transcript under `docs/sessions/evidence/task939/impl/`).
- **AC3 [R7].** Three planted-break transcripts under `docs/sessions/evidence/task939/impl/sensitivity/`, each showing the named case failing with an assertion and passing after restore, with the restoration proofs of R7.
- **AC4 [R1; R2; R8; R9].** The R8 comparison output shows exactly four differing Stories, all FavoritesShell, each B `failure:false`, and the stub counter ≥ 1 on each; the six R9 shard runs exit 0 with complete reports and no render-failure tuple.
- **AC5 [R3; R4].** `git diff` of the two Story files shows only the R3 comment and the R4 play branch and comment; no `args`, `parameters`, decorator, style or presentation change.
- **AC6 [R10].** The matrix file `docs/sessions/evidence/task939/impl/owner-visual-qa.md` lists all 140 tuples with their screenshot paths; the owner's verdict is recorded by the reviewer, not by Sonnet.
- **AC7 [R1–R10].** Full suite `npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json` then `node scripts/workflow-gates/cli.mjs unit-report` exit 0 (if failures remain only in the seven files of Task 931 while 931 is unmerged, report them by name; they are not this task's); `npm run typecheck` exits 0; `npx eslint .storybook/main.ts .storybook/stubs/supabase-client.ts <the two Story files> <the two test files>` exits 0; `npm run check:ui-contract`, `npm run check:file-integrity` and `npm run check:mojibake` report nothing for this task's files; `npm run build` exits 0; the report harness writes `docs/sessions/evidence/task939/security/report.json` and `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented. Reviewer: after the owner's push, the six PR #12 Locale Leak Detection jobs are green.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The browser Supabase client factory (`src/lib/supabase/client.ts`) and its Storybook replacement (`.storybook/stubs/supabase-client.ts`); the realtime consumer `useFavoritesRealtime`; the favorites write boundary `addFavorite`/`removeFavorite` (`src/modules/listings/actions/favoriteActions.ts`) behind `getUser`, `getBlockedError` and the server client. |
| Frontend security | Real `useFavoritesRealtime` on the real stub: it subscribes only the session user's channel and removes it on unmount (SEC-939-FE-STUB-ALLOW); the stub opens no socket and sends no request (SEC-939-FE-STUB-DENY); the real client refuses to start without its public configuration, which is why a Story must never reach it (SEC-939-FE-CLIENT-ERROR). |
| Server security | Real favorites actions with explicit doubles at the auth, block, database-client and cache boundaries: owner-scoped writes (SEC-939-SRV-FAV-ALLOW), anonymous refusal before any client (SEC-939-SRV-FAV-DENY), blocked refusal without a write (SEC-939-SRV-FAV-BLOCKED-DENY), a failed write that revalidates nothing (SEC-939-SRV-FAV-ERROR). |
| Database/integrations | No runtime, SQL, RLS or provider change. The real favorites table policies are unchanged and not exercised here; this task adds no critical case. |
| Cases | The seven SEC-939 cases of the sidecar; full names are `<describe> <it>` with the `[ID]` at the start of the `it` title. |
| Fixtures and environment | In-memory doubles, synthetic ids (`user-939`, `listing-939`), `vi.stubEnv` restored after each test, `fetch` and `WebSocket` replaced by spies and restored, no network, no credentials, unit project only; no database rows, so cleanup is trivially zero. |
| Sensitivity proof | The three planted breaks of R7 with restoration proof (AC3). |
| Execution | Report harness `docs/sessions/evidence/task939/security/report.mjs` modelled on `docs/sessions/evidence/task923/security/owner-fixes-report.mjs` (unit project only, the gate's own `runMappedTests`), then `node scripts/workflow-gates/cli.mjs verify --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_939_Locale_Leak_Shards_Green.security.json`; native Windows, Node 22.22.3; QA Q2. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): commit this kickoff set on
   `task/935-governance-approval-route` with the command Opus gives (D7).
2. **Sonnet, fresh session:** `node scripts/workflow-gates/cli.mjs receipt --contract <this sidecar>`. Build A (R8) from the unchanged
   tree in Git Bash: `EMPTY=""; for k in $(grep -oE "^NEXT_PUBLIC_[A-Z0-9_]+=" .env.local | tr -d '='); do EMPTY="$EMPTY $k="; done; env $EMPTY npm run build-storybook`,
   then copy `storybook-static/` to a directory outside the repository (for example under the session's temp directory) and record
   its path. Never set the variables with PowerShell `$env:X = ''` (that deletes them, so the local values come back).
3. R1, R2, then the frontend tests of R5.
4. Before the first Story edit, register these four receipts exactly, each through the PowerShell tool as the only statement of its
   command (validated against the real hook, C34):
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt 'GR-0 CANONICAL REUSE PREFLIGHT - request: Task 939 CustomRangeTooLong play below the 640px gate and the FavoritesShell Story note; semantic queries: RangeDatePicker mobile body, belowMobileGateQuery, DashboardPeriodControl Story; inspected candidates: src/design-system/mantine/patterns/RangeDatePicker.tsx, src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx, src/design-system/mantine/belowMobileGate.ts; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts other.mobileGate through src/design-system/mantine/belowMobileGate.ts; new hardcoded visual values: NONE; rationale: the Stories follow the picker body the owner already renders below 640px; no component or token changes.'`
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind UiContract -Receipt 'UI CONTRACT PREFLIGHT COMPLETE - scope: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx, src/stories/mantine/primitives/FavoritesShell.stories.tsx (play function and documentation comment only); canonical owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx.'`
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/design-system/mantine/patterns/RangeDatePicker.tsx custom period picker opened from MantineDashboardPeriodControl; component families: form-picker-and-choice, filter-and-action-toolbar; pattern IDs: form-stack, inline-control; standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation; mantine mechanism: media-query-exception; mantine owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: period control, then the picker sheet with its months stacked and Confirm last; required content: no semantic loss; verification: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx CustomRangeTooLong across actual <640px thresholds 320, 375, 639 and the 640px transition x sq,en,uk,it.'`
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind StorybookProof -Receipt 'STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx, src/stories/mantine/primitives/FavoritesShell.stories.tsx; production component: MantineDashboardPeriodControl with RangeDatePicker, FavoritesShell; allowed public states: the existing Story args and render data only; local presentation: NONE.'`
5. R3 and R4; then R6.
6. R7: three planted breaks with transcripts and restoration proof.
7. Build B the same way as A; R8, AC2, R9, R10.
8. The report harness and `cli.mjs verify`; every AC7 command; set stage `implemented`; write
   `docs/sessions/evidence/task939/impl/completion-report.md`; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git command.
9. **Opus reviewer:** review, including the owner's visual verdict on the R10 matrix; on approval, the review block and stage
   `reviewed`; the explicit-path commit command and the branch push. PR #12 merges only after all required checks are green.

## 7. Completion report

Per requirement: changed files, evidence, status; each SEC-939 case with its result; the three planted-break transcripts; the R8
comparison summary line and the four differing Story ids; the six shard exit codes and report paths; the AC2 transcript; the R10
matrix path; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows from retained snapshots and executed probes under `docs/sessions/evidence/task939/design/`. |
| `security-testing.md` | Frontend and server allow/deny/error rows on the real consumer, the real stub and the real actions; planted breaks. |
| `canonical-component-reuse.md` | REUSE: no component changes; the play follows the picker's own mobile body and gate. |
| `mobile-adaptation-contract.md` | `Scope: visible`, inherited adaptation with its families, patterns, standards, mechanisms and owners; proof below 640 and at 640. |
| `storybook-proof.md`, governance §9 | Stories keep their data and public props; the stub removes the forbidden live client instead of hiding the error. |
| `role-boundaries.md` | Sonnet implements product work; no policy path in scope; Opus reviews. |
| `git-publication.md` | Commit on PR #12's branch (D7); push only after approval; merge only after green checks. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35; owner decisions: D7, D8; blocked claims: NONE.
