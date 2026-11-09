# Task 953 — The five React Compiler lint rules are on, and their 55 findings are fixed

Sprint 93. Priority P1. Owner decision through Opus, 2026-11-06: the five rules stay off in Task 952 and come back here,
before PR #19 merges (`docs/backlog.md`, Sprint 93 row). Implementer: Sonnet, on `governance/reset-2026-11-06`, after Task
952 is committed. Reviewer: Opus. Human owner of the change: the owner.

## Goal

`eslint-config-next@16` brings `eslint-plugin-react-hooks@7.1.1` with five rules that had 55 findings in 39 files, so
Task 952 switched them off in one block (`eslint.config.mjs`, `task-952/react-hooks-v7-compiler-rules-off`). The list is
`docs/sessions/2026-11-06-task952-react-hooks-v7-findings.json`: `set-state-in-effect` 39, `refs` 10, `purity` 2,
`incompatible-library` 3, `immutability` 1. A rule that is off finds nothing, so a render that reads a ref, a clock read
during render and a state set in an effect pass review today. After the task all five are errors, no finding is left and
no behaviour changes.

## Scope

- Every file of the findings list, fixed at the cause, one rule at a time:
  - `purity`: `src/app/[locale]/listings/[slug]/page.tsx:272`, `src/app/admin/listings/[id]/preview/page.tsx:76`. These
    two can hide a security decision (an expiry compared with the clock); the value moves out of render and keeps
    its meaning.
  - `immutability`: `src/app/[locale]/favorites/page.tsx:58`.
  - `refs` (10): `src/hooks/useSwipeTrackSync.ts`, `src/modules/auth/context/AuthContext.tsx`,
    `src/modules/cabinet/hooks/useCabinetListingsRealtime.ts`, `src/modules/listings/components/ImageUpload.tsx`,
    `src/modules/listings/components/ListingInquiryDialog.tsx`, `src/modules/listings/hooks/useFavoritesRealtime.ts`.
    The "latest value in a ref" pattern moves into an effect or `useEffectEvent`.
  - `set-state-in-effect` (39): derive during render, key the component, or read through `useSyncExternalStore`
    (`src/hooks/useIsMobile.ts`). The fix for a data-loading effect is moving its synchronous part (`setLoading(true)`)
    to the event or the initial state.
  - `incompatible-library` (3): `src/components/admin/AdminUserCreate.tsx:129`, `src/components/admin/AdminUserProfile.tsx:173`,
    `src/modules/contacts/components/ContactForm.tsx:38` (`react-hook-form` `watch`): `useWatch` in its place.
- `eslint.config.mjs`: the named block keeps only `rules-of-hooks` and `exhaustive-deps`; the five rules become `"error"`.
- `src/__tests__/eslintConfig.test.ts`: its second test asserts that no `react-hooks/` rule is off.
- Remove the findings file when the rules are on; it has no reader after that.
- No `eslint-disable` of these rules. A finding that truly cannot be fixed stops the task and is reported to Opus.
- Dependencies: none. Out of scope: turning on the React Compiler itself, any visible change.
- **Revision 1 (review of 2026-11-08, findings F1 to F5).** Fixes only these:
  - R1 (F1) `src/components/shared/Combobox.tsx:302`: typing that opens the portal dropdown places it in the same handler
    (`updateDropdownPosition()`), as focus and click do, so a dropdown reopened after Escape and a scroll is not drawn at the old place.
  - R2 (F2) `src/hooks/useIsMobile.ts`: `getSnapshot` reads `window.matchMedia(query).matches`; no module-level `lastEvent` or
    subscriber count. The test double in `src/hooks/__tests__/simpleHooks.test.ts` keeps `matches` in step with `fire()`, as a browser does.
  - R3 (F3) The two tests that make the CI unit job fail now and then: `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`
    unmounts each `hydrateRoot` root inside `act` before it removes the container; `src/lib/auth/__tests__/googlePopup.test.ts`
    waits with `vi.waitFor` (a time limit), not 500 promise turns. Assertions stay as they are.
  - R4 (F4) `check:surface-census:changed` reports no new block for `src/components/admin/AdminUsersTable.tsx` and
    `src/lib/navigation/ClientLink.tsx`: each goes through the census's own path (its message names enrolment with a Story or an
    allowlist row with a reason and an owning task), never into the baseline.
  - R5 (F5) `src/modules/listings/lib/isListingNew.ts`: the comment says what is true: the page still reads the clock while it
    renders, which is right for a Server Component rendered per request; the function exists so a test can set `now`.
- **Revision 2 (review of 2026-11-08, findings F6 to F8), the last one allowed.** Fixes only these:
  - R6 (F6) `scripts/surface-census-baseline.json`: the four rows the census reads as stale once this diff is committed
    (`ListingContact.tsx :: ui/input.tsx`, `ListingFormShell.tsx :: StatusChangeControl.tsx`, `:: StatusChangeHistory.tsx`,
    `:: Combobox.tsx`; neither file imports them any more) are removed through the census's own path
    (`node scripts/check-surface-census-changed.mjs --base main --update-baseline`).
    The file's diff removes lines only; nothing is added (R4 stands).
  - R7 (F7) `src/components/shared/Combobox.tsx:176`: the comment names typing among the openings that place the dropdown.
  - R8 (F8) `src/stories/patterns/mantine/ClientLink.stories.tsx`: the `Button` carries no `variant` or `color` the app does
    not use; it renders as `src/app/admin/users/page.tsx:99` does (a Story makes no visual decision).

## Attack surface

Unchanged: no entry point, session, data flow or permission changes. `AuthContext.tsx` and the two pages of `purity`
change only where a value is computed; their existing tests keep passing unchanged.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Authentication: not applicable — `AuthContext.tsx` changes where a ref is written, not how a session is checked.
- Authentication_Patterns: not applicable — no authentication code is added; the same Supabase client is used.
- Authorization: not applicable — the changed pages keep their server guards; only a value moves out of render.
- Authorization_Decisions_And_Output_Handling: not applicable — no access decision or returned field changes in this task.
- Authorization_Patterns: not applicable — no guard moves; the preview page keeps its staff check.
- Authorization_Regression_Testing: not applicable — no permission changes; the existing action tests run unchanged.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; no authorization rule changes here.
- Cookie_Theft_Mitigation: not applicable — no cookie is read, written or changed by these lint fixes.
- Credential_Stuffing_Prevention: not applicable — the sign-in flow keeps its captcha and calls; `AuthSheet.tsx` changes state timing only.
- Cross_Site_Scripting_Prevention: not applicable — no output path changes; the pages keep rendering text through React.
- DOM_based_XSS_Prevention: not applicable — no sink, `eval` or computed URL is added by these fixes.
- Denial_of_Service: not applicable — no limit or expensive path changes; `ImageUpload.tsx` changes only a ref update.
- File_Upload: not applicable — the upload contract stays as Task 952 left it; signed uploads are Task 957.
- Injection_Prevention: not applicable — the words come from the census command of R6; no query, command or interpreter input changes.
- OS_Command_Injection_Defense: not applicable — R6 runs a repository script by hand; no product code starts a process.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL run on every changed file, and the five rules become errors — AC1, AC4.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- OAuth2: not applicable — R3 changes only how a test waits; the Google sign-in flow and its state check stay as they are.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — no Server Action changes; `serverEntryGuards.test.ts` runs unchanged — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input; Opus reruns each command — AC4.
- Session_Management: not applicable — the session refresh and its cookies are untouched; `AuthContext.tsx` only reads the user.
- User_Privacy_Protection: not applicable — no personal data flow changes; only render timing changes.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC4.
- WebSocket_Security: not applicable — the realtime hooks keep their channels and filters; only a ref update moves.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no `innerHTML` is added; lint (react/no-danger) fails on one — AC1, AC4.

## UI

No visible change. A visual difference in Storybook or the click-shield run is a stop-and-report.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The five rules are errors and lint passes — test: `src/__tests__/eslintConfig.test.ts` (no `react-hooks/` rule is
  off, the five are severity 2) and `npm run lint`.
- AC2 No suppression hides a finding — test: `src/__tests__/eslintConfig.test.ts`, new case: no file under `src/` has an
  `eslint-disable` comment that names one of the five rules.
- AC3 Each changed hook and component behaves as before — test: `src/__tests__/reactHooksV7Behaviour.test.tsx` (new) or
  the file's own `__tests__/` test, for every file of the findings list that has none: the behaviour the finding touched,
  passing on the unchanged code and on the fixed code. The `purity` pair: `src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts`
  gains a case with a mocked clock on either side of the expiry.
- AC4 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`, `npm run build-storybook`,
  `node scripts/quality/changed-lines-coverage.mjs --base main` and `node scripts/quality/check-files.mjs --worktree`
  exit 0.
- AC5 `node scripts/quality/product-gates.mjs` has no new failure compared with before (lists before and after).
- AC6 Revision 1: typing reopens the portal dropdown at the field — test: `src/components/shared/__tests__/Combobox.portal.test.tsx`
  (new): portal Combobox, focus, Escape, the field moved (`getBoundingClientRect` mocked), a key typed: the dropdown's top and left
  follow the new rectangle.
- AC7 Revision 1: `useIsMobile` follows the browser's answer — test: `src/hooks/__tests__/simpleHooks.test.ts` (the double's
  `matches` follows `fire()`; an event whose `matches` disagrees with the query gives the query's value; two hooks agree).
- AC8 Revision 1: the unit job is stable — test: `src/components/layout/__tests__/header-hydration-id-parity.test.tsx` and
  `src/lib/auth/__tests__/googlePopup.test.ts` pass 20 runs in a row (`for i in $(seq 20); do npx vitest run <both> || exit 1; done`),
  and the CI job "Unit and component tests" of PR #19 is green on the revision commit.
- AC9 Revision 1: no new census block — test: `node scripts/check-surface-census-changed.mjs --base main`
  (PR #19 with this diff maps 65 surfaces; the default limit is 200 since Task 963 AC14, owner decision O-CS1) lists no block for the two files of R4.
- AC10 Revision 2: the census passes on the committed change — test: `node scripts/check-surface-census-changed.mjs --base main`
  exits 0 (no new block, no stale row), and `git diff --numstat -- scripts/surface-census-baseline.json` shows 0 added lines.

## Route

1. Tests first: AC3 on the unchanged code, green; they pin today's behaviour. AC1 and AC2 fail until the end.
2. Turn the rules on one at a time, in the order of Scope; fix that rule's findings; run lint and the tests of those files.
3. Remove the findings file. Run AC4 and AC5.
4. Report: each command, exit code and relevant output, one line per finding (file, rule, the fix, its test), and the
   deliberate break of AC1 and AC2. Build with `SENTRY_AUTH_TOKEN=` empty.

## Review

**Review 1 of the working tree on `governance/reset-2026-11-06` at `0d53a41ae` — NEEDS REVISION**

Scope: diff review of all 53 changed and 12 new files (`git diff HEAD`, 709+ / 678-); entry points: none changed (`AuthContext`, the realtime hooks and the two `purity` pages read through).
Tools (rerun by the reviewer, 2026-11-08): `owasp sync` and `check` 0; `check-ruleset` 0; `npm run lint` 0; the five rules forced on: 0 findings (55 on HEAD); `npm run typecheck` 0; `SENTRY_AUTH_TOKEN= npm run build` 0; `npm test -- --coverage` 0, 369 files, 6114 tests; `changed-lines-coverage --base main` 0; `check-files --worktree` 0; `ac-tests --base main` PASS; `product-gates` 31 of 34 (see F4). CI of PR #19 on `0d53a41ae` read with `gh run view` (F3).
Findings: Critical 0, High 0, Medium 0, Low 4, Info 1. Revision 1 of at most 2.
Overall risk: low; the fixes are sound and tested, one behaviour changed that the kickoff says must not.

Measured beyond the report:
- The three sessionStorage reads moved into initializers do not mismatch hydration: `LoginView` mounts only after `Header` opens the sheet on the client (`authOpen` starts false); `returnUrl` and `scrollTargetSlug` are never rendered. The move into `.ts` files is safe here for that reason, not because the scanner stopped seeing it.
- `useNotifications` keeps its cross-user guard (`userIdRef` is written before `loadFor` runs); sign-out now empties the list in the same render.
- Deliberate breaks, each red, files restored byte for byte: one rule back to off (AC1), a `react-hooks/purity` disable comment (AC2), `useStateFromProp` no longer following its prop (21 tests in 9 files), the `isListingNew` edge flipped (6 tests in 3 files).
- `git diff HEAD -- src` adds no innerHTML, eval, Function or navigation call.

Claims of the report that do not hold:
- "surface-census and backlog-active are not related to my change": `check:backlog-active` failed on the reviewer's own `APPROVED` marker for Task 952 in `docs/backlog.md`, fixed by the reviewer in this turn (31 of 34 now); the census blocks are `AdminUsersTable.tsx`, which this diff changes, and `ClientLink.tsx` from Task 952, which the 952 review could not see because the census reads committed files only (F4).
- "No visible change expected": the Combobox reopen path changed (F1). Storybook and click-shield stay unrun; Review 2 measures them.

F1 — Typing reopens the portal dropdown where it was last placed
Severity: Low   Category: Behaviour (the kickoff's "no behaviour changes")   Location: `src/components/shared/Combobox.tsx:302`
Description: the open effect no longer places the dropdown; focus (`:303`) and click (`:317`) do, typing (`:302`) does not. After focus, Escape and a scroll (the scroll listener is off while closed), a key opens the dropdown at the old coordinates. Reproduction: those steps with `portal`. Recommendation: R1. Status: fixed by Revision 1, verified in Review 2 (working tree, not yet committed).
F2 — `useIsMobile` holds module state shaped by a test double
Severity: Low   Category: Code quality   Location: `src/hooks/useIsMobile.ts:5-24`
Description: `lastEvent` and `subscribers` exist because the double in `simpleHooks.test.ts` does not update `matches`, which a browser does: state shared across hook instances for a test's sake. Reproduction: the report ("the test I did not touch, I made the hook fit"). Recommendation: R2. Status: fixed by Revision 1, verified in Review 2 (working tree, not yet committed).
F3 — The CI unit job fails now and then
Severity: Low   Category: Tests   Location: `header-hydration-id-parity.test.tsx:168`, `googlePopup.test.ts:39-41`
Description: every test passes, yet the job exits 1: on `aa8ef7c20` and `0d53a41ae` an unhandled `ReferenceError: window is not defined` after teardown (the `hydrateRoot` roots are never unmounted); on `8a40c38a7` two `googlePopup` cases ran out of 500 promise turns; `abfc664b4` was green. AC4's `npm test` is not reliably 0. Reproduction: `gh run view 42463339826`, `42460858858`, `42455177615`. Recommendation: R3. Status: fixed by Revision 1, verified in Review 2 (working tree, not yet committed).
F4 — Two new census blocks, and the report's claim about them
Severity: Low   Category: Governance (GR-1, GR-3)   Location: `src/components/admin/AdminUsersTable.tsx`, `src/lib/navigation/ClientLink.tsx`
Description: `check:surface-census:changed` fails with `tier1-unenrolled-or-unstoried` for both. Reproduction: `node scripts/quality/product-gates.mjs`. Recommendation: R4. Status: fixed by Revision 1, verified in Review 2 (working tree, not yet committed). The census cannot see uncommitted files during a local review; Task 963 carries that (its AC11).
F5 — The `isListingNew` comment says the clock left the render
Severity: Info   Category: Documentation   Location: `src/modules/listings/lib/isListingNew.ts:5-8`
Description: the page still reads the clock while it renders; for a per-request Server Component that is correct, and the comment should say so. Recommendation: R5. Status: fixed by Revision 1, verified in Review 2 (working tree, not yet committed).

**Review 2 of Revision 1, working tree on `governance/reset-2026-11-06` at `3ec61742a` — NEEDS REVISION**

Scope: the eleven files Revision 1 wrote after `3ec61742a` (mtime census: `Combobox.tsx`, `useIsMobile.ts`, `isListingNew.ts`, `mantine-migration-scope.json`, three new Stories, the AC6 test and three changed tests), read whole; the rest of the diff is unchanged since Review 1. Entry points: none.
Tools (rerun by the reviewer, 2026-11-08): `owasp sync`, `check`, `check-ruleset` 0; `npm run lint` 0; `npm run typecheck` 0; `npm test -- --coverage` 0, 370 files, 6119 tests; `SENTRY_AUTH_TOKEN= npm run build` 0; `npm run build-storybook` 0; `changed-lines-coverage --base main` 0; `check-files --worktree` 0, 72 files; `ac-tests --base main` PASS; `npm audit --omit=dev --audit-level=high` 0; `product-gates` 32 of 34, the two failures (`check:design-tokens:strict`, `check:enrolled-tailwind`) are in files outside this diff and are Task 948's Scope 1 and 2. CI of PR #19 (run 42465743137, `3ec61742a`): the browser jobs fail installing Chromium, not on this code (filed below). CodeQL and the change report cannot see an uncommitted diff.
Findings: Critical 0, High 0, Medium 0, Low 1, Info 2. Revision 2 of at most 2.
Overall risk: low; R1-R5 are correct and their tests fail without them; the committed change would turn the census red.

Measured beyond the report:
- Deliberate breaks, files restored and sha-checked: `updateDropdownPosition()` dropped from `onChange` (AC6: 2 of 3 red, `144px` for `344px`, `''` for `244px`); `useIsMobile.ts` put back to `HEAD` (AC7: the disagreeing-event case red); the three manifest rows removed (AC9: 3 new blocks, `cabinet/page.tsx`, `admin/users/page.tsx`, `ClientLink.tsx`).
- AC8: 20 runs in a row of both files, 11 of 11 each, no unhandled error, while Storybook was being built on the same machine. `vi.waitFor` advances fake timers by its 5 ms interval once the window opens; the poll and timeout tests keep their counts (500 ms polls, 5 minutes).
- Every way to open the dropdown now places it: focus, click, typing, `defaultOpen` (`Combobox.tsx` has no other `setOpen(true)`).
- Storybook: no Story renders on `next@16.4.3` with `@storybook/nextjs-vite@10.4.2` (`useRouter` reads `LayoutRouterContext.parentRenderTree.data`, the mock sets `parentTree` only; the report's cause is right). With that one field added to the mock in `node_modules` (restored, sha-checked), both `HEAD` and this tree were built and all 592 Stories rendered at 1280 and 375 px: 0 render or play failures, the three new Stories' play included. Same environment on both sides: 0 pixel differences beyond the jitter `HEAD` shows against itself (charts, `AuthSheet` logo). The UI section's "no visible change" holds.
- Click-shield on this tree's production build (`CLICK_SHIELD_CI_FIXTURE=1`, as CI): 48 cells, 1368 elements, 0 interceptions.

Claims of the report that do not hold:
- "surface-census:changed now passes": it passes only because it reads committed files. Run on this tree (`--base main`, limits widened), it shows 0 new blocks and 4 stale baseline rows; committed, it fails (F6).
- "The four stale ListingFormShell rows are Opus's work": they appear because this diff reaches those surfaces, and the census's own message sends them to `--update-baseline`, which only removes paid-off rows (R4 forbade adding rows). They belong to this task (R6).

Gaps found outside this task, filed in the same turn:
- CI runs on `ubuntu-26.04` since `ubuntu-latest` moved, and Playwright 1.60 refuses it, so no Story or page has been rendered in CI since Next 16.4.3: Task 963 AC13.
- The census limit of 60 surfaces: PR #19 with this diff maps 65, so it fails closed whatever the code: Task 963 AC14, owner decision O-CS1.
- Storybook 10.4.2 against Next 16.4.3: Task 939 AC5 (the four packages to `10.6.3`).
- AC9's command could not run as written (limit exceeded): a design error of the kickoff, corrected here in AC9 and AC10.

F6 — The committed change fails the census on four stale baseline rows
Severity: Low   Category: Governance (GR-1, AC5)   Location: `scripts/surface-census-baseline.json` (rows of `ListingContact.tsx` and `ListingFormShell.tsx`)
Description: once committed, the census reaches `ListingContact.tsx` and `ListingFormShell.tsx`, which no longer import `ui/input.tsx`, `StatusChangeControl.tsx`, `StatusChangeHistory.tsx` or `Combobox.tsx`; their four baseline rows are stale and the census fails. Reproduction: `node scripts/check-surface-census-changed.mjs --base main --max-surfaces 200 --max-changed-files 5000` → "FAIL 4 stale baseline entr(ies)". Recommendation: R6. Status: fixed by Revision 2, verified in Review 3 (working tree, not yet committed).
F7 — The Combobox comment omits typing
Severity: Info   Category: Documentation   Location: `src/components/shared/Combobox.tsx:176`
Description: "every other opening (focus, click)"; typing places the dropdown too since R1. Recommendation: R7. Status: fixed by Revision 2, verified in Review 3 (working tree, not yet committed).
F8 — The ClientLink Story picks a Button look the app does not use
Severity: Info   Category: UI rules (one visual contract, no visual decision in a Story)   Location: `src/stories/patterns/mantine/ClientLink.stories.tsx:33`
Description: `variant="outline" color="gray"`; the app's `Button component={ClientLink}` (`src/app/admin/users/page.tsx:99`) sets neither. Recommendation: R8. Status: fixed by Revision 2, verified in Review 3 (working tree, not yet committed).

OWASP verdicts per sheet: [docs/security/owasp/reviews/Task_953.json](../../docs/security/owasp/reviews/Task_953.json).

**Review 3 of Revision 2, working tree on `governance/reset-2026-11-06` at `b23104b14` — APPROVED**

Scope: the three files Revision 2 wrote (`scripts/surface-census-baseline.json`, `Combobox.tsx:176`, `ClientLink.stories.tsx:33`; mtime census: nothing else changed after Review 2), read whole; the rest of the diff is unchanged since Review 2. Entry points: none.
Tools (rerun by the reviewer, 2026-11-08): `owasp sync`, `check`, `check-ruleset` 0; `npm run lint` 0; `npm run typecheck` 0; `npm test -- --coverage` 0, 370 files, 6119 tests; `SENTRY_AUTH_TOKEN= npm run build` 0; `npm run build-storybook` 0; `changed-lines-coverage --base main` 0; `check-files --worktree` 0, 77 files; `ac-tests --base main` PASS; `node scripts/check-surface-census-changed.mjs --base main` 0 (65 surfaces, 0 new, 0 stale); `product-gates` 32 of 34, the two failures are Task 948's (`MantineListingGalleryPattern.tsx`, outside this diff). CI of PR #19 on `b23104b14` (run 42494046985, before this diff): every job on `ubuntu-24.04`, Unit and component tests green; the census fails there on F4's two blocks, whose fix is this uncommitted diff.
Findings: Critical 0, High 0, Medium 0, Low 0. F1-F8 fixed.
Overall risk: low; the five rules are errors with no finding left, behaviour and rendering unchanged as measured in Review 2.

Measured: the baseline diff removes exactly the four keys of R6 (`--numstat` 0 added, 12 deleted) and adds nothing; one key put back makes the census report 1 stale row on that key, file restored by sha. The report's claims reproduce.
Condition carried by AC8: its second half (the CI job "Unit and component tests" green on the commit that holds this diff) can only be read after the commit; Opus reads that run, and a red job reopens this review.

OWASP verdicts per sheet: [docs/security/owasp/reviews/Task_953.json](../../docs/security/owasp/reviews/Task_953.json).

**Review 3 addendum, CI of the commit `263cbf642` (PR #19 run 42499113506) — APPROVED WITH NOTES**

- AC8 met: "Unit and component tests" green on the commit that holds this diff; `check:surface-census:changed` passes in CI (F4 closed).
- N1 (Low, AC5): `check:ui-contract` fails in CI on the three components R4 enrolled (`AdminUsersTable.tsx`, `ClientLink.tsx`,
  `CabinetEmailChangeSection.tsx`): "newly enrolled component lacks an explicit UI contract". The local runs of the executor and
  the reviewer showed 32 of 34 because the gate reads committed `base..head` only. Both revisions are used (flow.md §3), so the
  fix is split off: Task 948 Goal 3 and AC6 (the three registry entries). The blind spot is Task 963 AC11 (every diff-based
  product gate reads the working tree in a local run). Status: task 948.
