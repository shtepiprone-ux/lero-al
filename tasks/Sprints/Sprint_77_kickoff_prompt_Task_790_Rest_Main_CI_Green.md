# Sprint 77 — Task 790 (rest): `main` CI goes green — every red step of the push-triggered gate, decided per failure

**Sprint:** 77 (`tasks/Sprints/Sprint_77_The_Full_Test_Suite_Nobody_Runs.md`) · **Priority:** P1 · **QA:** Q1 (+ gate
self-test proof) · **Status:** `KICKOFF FILED` 2026-10-07 · **Executor:** Sonnet (`@executor`, `execute-task`)

**Owner instruction, 2026-10-07** (verbatim, answering Opus's proposal to file "Restore green main" in the fitting
sprint, covering every red item except `theme.d69-18`): *"оформлюй"*.

**Owner decision O790-1, 2026-10-07** (AskUserQuestion, option chosen verbatim): *"Виключити docs/** з vitest
(Recommended)"* — add an `exclude` for `docs/**` to `vitest.config.ts`; evidence-folder tests are frozen records, not
regression tests; the file stays in place as evidence. This is the owner decision Sprint 77 exit criterion 3 requires
for removing a test from the suite.

---

## 1. Mode and task type

`TASK DESIGN` → implementation task. Type: **test-suite and CI-gate repair** (non-UI). No visible artifact changes.
Rule bundles: Always Required + "Docs / Governance / Task Template" + "Regression / Critical Flow Coverage" (for the
test-vs-source decisions).

## 2. Objective

Make `.github/workflows/governance-pr.yml` green on `main` for every failure observed in the first two push-triggered
runs, except `theme.d69-18` (owned by Task 859, §5), by deciding **per failure** whether the **test/gate** or the
**source** is wrong and fixing that side — never by skipping, loosening or deleting a check without an owner decision
quoted with its date. Then run every gate step that has never executed on `main` since 2026-08-16 and report each
one's result, so the next red step is known before the owner pushes.

## 3. Verified context

All `FACT` rows were read by Opus on 2026-10-07 from CI logs (`gh run view … --log-failed`) or the repository.

| # | Fact | Evidence |
|---|---|---|
| C1 | **FACT** — `governance-pr.yml` has run on every push to `main` since `dc58dc97d` (governance fix, 2026-10-07). Before that it ran on `pull_request` only, and no PR was opened after 2026-08-16, so the gate did not run for seven weeks. | `docs/sessions/2026-10-07-governance-scheduled-scan-false-positives.md` |
| C2 | **FACT** — Run **37668475795** (SHA `80f72bbc0`, 2026-10-07) — four jobs red. | `gh run view 37668475795 --repo shtepiprone-ux/lero-al` |
| C3 | **FACT** — Job *Governance Check*, step *Gate unit tests* (`npm test` = `vitest run`, `package.json:10`): **5 failed / 143 passed (148 files)**. Every later step of that job was skipped and has **not run on `main` since 2026-08-16**. | run log |
| C4 | **FACT — F1** `scripts/__tests__/css-var-resolvability.test.ts` › *matches the committed ownership snapshot (Task 743 Rev 1)*. Same root as C8. | run log |
| C5 | **FACT — F2** `scripts/__tests__/mantine-story-scope.test.ts:20` › *enrols an exact title …* asserts `isCanonicalMantineTitle('Admin/AdminUsersTable') === true`. Registry row 790: red since Task 896 emptied the exact-title hatch (857 review 4, 2026-10-02). | file read; `docs/backlog.md` row 790 |
| C6 | **FACT — F3** `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` › *lightbox: … no frameClip* and *BLOCKED: listing.hoverClass …*. `vitest.config.ts` has no `include`/`exclude`, so vitest's default glob picks up `docs/**`. It is the only `*.test.*` under `docs/`. Later approved work changed both facts deliberately (764 folded the hover into the card pattern; 886 clipped the lightbox). | `vitest.config.ts`; `find docs -name "*.test.*"` → 1; `git log -- src/design-system/media/appImageConfig.ts` |
| C7 | **FACT — F5** `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx:501` › *'mobile <640 bottom sheet' › Confirm commits one onChange … (AC2)* — `Test timed out in 5000ms` (5087 ms). Registry row 790 records a non-deterministic, timeout-shaped group (26–31 s files) across repeated runs with no source change. | run log; row 790 |
| C8 | **FACT** — Job *Click-Shield Gate*, step *CSS var() resolvability gate* (`npm run check:css-vars`): `Ownership snapshot drift (R3) — added (1): --width-content`. `--width-content: 48rem` is defined at `src/app/globals.css:303`, added by Task 869 (`34b2a37a1`); `scripts/css-var-ownership-snapshot.json` last changed `1da38ec47` (2026-09-16). The gate prints its own remedy: `npm run check:css-vars:update-snapshot`. Steps after it in that job did not run. | run log (log visible since `80f72bbc0`'s logging fix) |
| C9 | **FACT** — Job *Homepage Grid Validation*, step *Card-track monotonicity gate self-test* (`npm run check:card-track-monotonicity:verify`): arm `b-grid-1024` *plant did not apply: produced width 960px, expected 864px*; arm `c-rail-1280` *produced width 936px, expected 1000px*. The expectations are constants at `scripts/check-card-track-monotonicity.mjs:515-540` (`expectedProducedWidth: 864` / `1000`). The non-plant gate itself passed on every in-scope Story. Steps after it did not run. | run log; file read |
| C10 | **FACT** — Job *Locale Leak Detection* was cancelled at its `timeout-minutes: 45` (`governance-pr.yml:290`) inside `npm run check:locale-leak:mantine-only`. The step is `continue-on-error: true` (non-blocking by Task 625), but the job timeout still fails the job. The same job took **19 m 26 s** in the last green PR run (31954550755, 2026-08-16). | `gh run view 31954550755 --json jobs`; run log |
| C11 | **FACT — F4, not this task's.** `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` › *MantineListingCardPattern.tsx resolves theme.spacing.micro/tight/compact* — stale after Task 741. Commit `58719f5d8` assigns it to **Task 859 Revision 3** (*"vitest red (stale d69-18 row after 741)"*), and the file is modified in the uncommitted 859 worktree. 790's comment-only `theme.breakpoints.lg` needle in the same file (row 790, R1 design) stays open and is **sequenced after 859 lands** (§8). | commit message; `git status` |
| C12 | **FACT** — Registry row 790 also lists `ListingCard.smoke` ×2 and `ListingGallery.portal.smoke` ×4 (jsdom `ResizeObserver`) and `filtersPanelShell` / `filtersRangeDatePicker` / `heroSearch` as non-deterministic. **None of them failed in run 37668475795.** Their status today is `UNKNOWN` until re-measured (§10 Phase 1). | run log; row 790 |
| C13 | **FACT** — The worktree is dirty with uncommitted Task 859 Revision 3 work (≈90 modified/untracked paths, incl. `.github/workflows/governance-pr.yml`, `package.json`, `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `src/design-system/mantine/__tests__/theme.d69-18.test.tsx`). | `git status --short` 2026-10-07 |

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | C4, C8 | `check:css-vars` and the snapshot test pass because the snapshot records `--width-content` — a token that is defined and used — via the gate's own writer, not a hand edit | P1 | `npm run check:css-vars` exit 0; `vitest run scripts/__tests__/css-var-resolvability.test.ts` exit 0 | Confirmed |
| R2 | C5 | `mantine-story-scope.test.ts` proves the exact-title enrolment mechanism without depending on a production title that 896 legitimately removed (test wrong) | P1 | file passes; a planted counter-example still fails it | Confirmed |
| R3 | C6, O790-1 | `vitest.config.ts` excludes `docs/**`; the evidence file stays untouched on disk | P1 | `vitest list` contains no `docs/` path; file hash unchanged | Confirmed |
| R4 | C7, C12 | Every non-deterministic or timeout-shaped failure is **characterised** (alone vs in the full suite, 3 runs each) and fixed at its cause; no per-test or global timeout increase without an owner decision | P1 | characterisation table; 3 consecutive full-suite runs | Confirmed |
| R5 | C9 | The card-track self-test's plant-applied check is correct for today's geometry, and the self-test still fails when the plant is absent or wrong | P1 | `check:card-track-monotonicity:verify` exit 0; negative arm evidence | Confirmed |
| R6 | C10 | The locale-leak job finishes inside its limit **without dropping coverage**; the cause of the 19 → 45+ min growth is measured first | P1 | local duration + per-story timing; CI duration on the owner's push | Confirmed (route gated by §5 STOP) |
| R7 | C3, C8, C9 | Every gate step that has not run on `main` since 2026-08-16 is executed locally and its result recorded | P1 | Phase-1/Phase-4 census table | Confirmed |
| R8 | Sprint 77 exit 3 | No test deleted, skipped (`.skip`, `.todo`, `it.fails`) or loosened except R3 under O790-1 | P0 | `git diff` review | Confirmed |
| R9 | `orchestrator-role` → governance contract | `npm.cmd run governance` pre-write and final, no new HIGH/CRITICAL, baseline current | P1 | receipts | Confirmed |

## 5. Assumptions and open questions

- **STOP — locale-leak route (R6).** If Phase 1 shows the growth is a **hang** (one Story/locale/locator that never
  settles), fix that cause. If it is **linear growth** in the number of in-scope Stories, do **not** choose between
  sharding the job, raising `timeout-minutes`, or narrowing scope — stop, report the per-story timing table, and
  return `PARTIALLY IMPLEMENTED` for R6 only. Opus files the decision.
- **STOP — new red step.** A step found red in Phase 1/4 that is not in §3 is **not** fixed in this task: record
  it (step, command, first error lines, test-vs-source hypothesis) and continue the rest. Opus dispositions it.
- **STOP — timeout or assertion loosening.** If the only fix for F5 (or any timeout-shaped test) is a longer timeout
  or a weaker assertion, stop for an owner decision (Sprint 77 exit criterion 3).
- **ASSUMPTION** — `theme.d69-18` (F4) is fixed by Task 859 Revision 3. If 859's review rejects that part, Opus moves
  it here by amending this kickoff.
- **UNKNOWN** — whether steps after *Gate unit tests* that need Supabase (grant checks, `test:rls-guards`) can run
  locally; a step that cannot run for a missing secret is recorded `NOT RUNNABLE LOCALLY — <reason>`, never `PASS`.

## 6. Pre-read rule bundle

1. `docs/golden-rules.md` (GR-2, GR-4, GR-5, GR-7 — receipts)
2. `docs/agent-contract.md` (clauses 9, 9a, 10, 14)
3. `docs/governance-enforcement.md` §2, §3 ("Scanner correctness"), §9
4. `docs/qa-profiles.md` (Q1, Q4 planted-violation line)
5. `docs/qa-rules.md`
6. `docs/critical-flow-registry.md` (only to confirm none of the changed tests is a critical-flow guard)
7. `docs/orchestrator-dirty-worktree-manifest-template.md`
8. `tasks/Sprints/Sprint_77_The_Full_Test_Suite_Nobody_Runs.md` (goal, exit criteria)
9. `docs/backlog.md` → registry row **790**

## 7. Scope

Write paths owned by this task (nothing else):

| Path | For |
|---|---|
| `scripts/css-var-ownership-snapshot.json` | R1 — **only** through `npm run check:css-vars:update-snapshot` |
| `scripts/__tests__/mantine-story-scope.test.ts` | R2 |
| `vitest.config.ts` | R3 |
| `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` and/or the test setup it uses (`src/tests/setup.ts`) | R4 — only if the characterisation shows the test is wrong |
| `scripts/check-card-track-monotonicity.mjs` | R5 |
| `scripts/check-locale-leak.mjs` | R6 — only on the hang branch |
| `.github/workflows/governance-pr.yml` | R6 — only if a workflow change is the hang fix; **mixed file** (C13): deliver the change as `docs/sessions/evidence/task790/rest/workflow.patch` against the `HEAD` blob, never as a staged edit |
| `docs/sessions/2026-10-07-task790-rest-main-ci-green.md`, `docs/sessions/evidence/task790/rest/**` | session log, evidence |
| `docs/backlog.md` row 790 (state only) | completion record |

## 8. Out of scope

- `theme.d69-18.test.tsx` — all of it, including 790's `theme.breakpoints.lg` comment-only needle (C11). It is
  dirty with 859 work; the needle is a follow-up after 859 lands.
- Any source change under `src/` other than the R4 test file and its setup. A failure classified *source wrong* that
  needs a `src/` change is a **STOP** (§5), not an in-task fix.
- Node 20 → 22/24, action version bumps, `scan-primitives.mjs` legacy wording (named in the 2026-10-07 session log).
- Every path in the pre-write `git status --porcelain` snapshot that is not in §7.

## 9. Current and required behavior

| Item | Current | Required |
|---|---|---|
| `check:css-vars` | exit 1, snapshot drift `+--width-content` | exit 0; snapshot written by the gate's writer |
| `vitest run` | 5 red files (C3) | only `theme.d69-18` red (859's); exit 0 once 859 lands |
| evidence test | run by vitest | not collected; file unchanged |
| card-track self-test | arms b/c fail "plant did not apply" | all arms pass; a plant that does not apply still fails |
| locale-leak job | cancelled at 45 min | finishes inside its limit (hang branch) or measured and stopped (§5) |
| un-run gate steps | unknown since 2026-08-16 | each run locally, result recorded |

**Preserve:** every other vitest assertion; `check:css-vars`'s fail-on-drift behaviour (a *removed* referenced
token still fails); the card-track gate's real (non-plant) sweep; locale-leak coverage (every in-scope Story ×
locale); `continue-on-error` on the locale-leak step (Task 625 policy).

## 10. Implementation requirements

**Phase 0 — preflight (before any write).**
1. `node.exe -p process.platform` = `win32`.
2. Save `git status --porcelain` → `evidence/task790/rest/00-status-before.txt`; complete the dirty-worktree manifest
   for every entry; `git hash-object` every §7 path that exists.
3. GR-7 execution audit into `docs/sessions/evidence/task790/research-exec/` (§16).
4. `npm.cmd run governance` → `01-governance-before.txt`.

**Phase 1 — census (no writes).**
1. `npm.cmd test` three times → `02-vitest-run{1,2,3}.txt`. Table: file × run → pass/fail/duration.
2. For each failing or timeout-shaped file: run it alone three times (`npx.cmd vitest run <file>`) → table.
3. Run, in `governance-pr.yml` order, **every** step of the *Governance Check* job after *Gate unit tests*, and every
   step of *Click-Shield*, *Homepage Grid* and *Locale Leak* (build/Storybook prerequisites included), continuing
   past failures → `03-gate-census.txt` with step · command · exit · first error lines · `NOT RUNNABLE LOCALLY —
   reason` where applicable.
4. Locale leak: run `npm.cmd run check:locale-leak:mantine-only` with timing; record total time, in-scope Story
   count, per-Story/locale durations, and the slowest 10 → `04-locale-leak-timing.txt`.

**Phase 2 — fixes, one failure at a time, each with its disposition (`test wrong` / `source wrong`) in the log.**
- **R1** `npm.cmd run check:css-vars:update-snapshot`; the diff must add exactly `--width-content` and nothing else.
- **R2** Rewrite the exact-title case so it tests the mechanism, not today's production enrolment: assert
  `isCanonicalMantineTitle` against a fixture enrolment map (or a pure helper the module already exports) where one
  exact title is enrolled and its siblings are not; keep the substring/partial-match negatives. Prove it is not
  vacuous: temporarily make the exact-match accept a sibling → the test fails → restore (hash witness).
- **R3** Add `exclude: [...configDefaults.exclude, 'docs/**']` (import `configDefaults` from `vitest/config`) with a
  comment citing O790-1. `npx.cmd vitest list` contains no `docs/` path; evidence file hash unchanged.
- **R4** Fix the cause found in Phase 1 (e.g. an un-awaited transition, a real timer in a mobile Drawer path, test
  order pollution). Forbidden without an owner decision: raising `testTimeout`/per-test timeouts, `retry`, weakening
  an assertion.
- **R5** Replace the constant `expectedProducedWidth` with a value derived in the run from the **unplanted** measured
  width at the same rung minus `2 × paddingPx` (or the equivalent geometry the arm actually changes), and keep the
  column-count-drop assertion. Negative arm: a plant whose padding is ignored (e.g. a selector that matches nothing)
  must still fail with "plant did not apply". Record both.
- **R6** Hang branch only (§5): fix the hanging Story/locator in `check-locale-leak.mjs` without removing it from
  scope; otherwise STOP.

**Phase 3 — integrity.** `npm.cmd run check:file-integrity`, `npm.cmd run check:mojibake` on touched files.

**Phase 4 — final.** `npm.cmd test` three consecutive times; repeat the Phase 1 step-3 census for every step;
`npm.cmd run governance` → `09-governance-after.txt`; `npm.cmd run build` → `10-build.txt`; `git status --porcelain`
→ `11-status-after.txt` compared with `00` (no non-§7 path changed; hash witnesses for pre-dirty paths).

## 11. Positive and negative flows

**Positive:** on the owner's push, *Gate unit tests*, *CSS var() resolvability*, *Card-track self-test* go green, and
every step after them runs.

| Negative flow | Applies | Handling |
|---|---|---|
| A genuinely removed referenced token | Yes | the gate must still fail on it: `npm.cmd run check:css-vars:verify` (the gate's own plant self-test, temp copies only) exits 0 after R1 |
| Exact-title enrolment broken | Yes | R2 negative proof |
| Card-track plant silently not applied | Yes | R5 negative arm |
| Test pollution between files | Yes | R4 characterisation (alone vs suite) |
| A new red step appears | Yes | §5 STOP, recorded |
| Missing Supabase secret locally | Yes | `NOT RUNNABLE LOCALLY`, never PASS |
| UI / locale / auth / RLS behaviour | No | no product source changes in scope |

## 12. Acceptance criteria

- **AC1 [R1]** Given the current `globals.css`, when `npm.cmd run check:css-vars` runs, then it exits 0 and the
  snapshot diff adds only `--width-content`.
- **AC2 [R1]** Given the snapshot update, when `npx.cmd vitest run scripts/__tests__/css-var-resolvability.test.ts`
  and `npm.cmd run check:css-vars:verify` run, then both exit 0 (the drift and missing-token plants still fail
  inside the self-test).
- **AC3 [R2]** Given the rewritten test, when the exact-match is planted to accept a sibling title, then the test
  fails; when restored (hash equal to pre-plant), it passes.
- **AC4 [R3]** Given `vitest.config.ts`, when `npx.cmd vitest list` runs, then no listed path starts with `docs/`, and
  the evidence file's `git hash-object` equals its Phase-0 value.
- **AC5 [R4]** Given the Phase-1 characterisation, when the fix lands, then each previously failing or timeout-shaped
  file passes in 3/3 isolated runs and 3/3 full-suite runs, and no timeout/retry/assertion was relaxed.
- **AC6 [R5]** Given today's Storybook build, when `npm.cmd run check:card-track-monotonicity:verify` runs, then it
  exits 0; and a plant that does not change geometry makes its arm fail with "plant did not apply".
- **AC7 [R6]** Given the timing table, then either the hang is fixed and the local run's duration is recorded with
  every in-scope Story still covered, or the task stops per §5 with the table.
- **AC8 [R7]** Given Phase 4, then the census lists every step of the four jobs with exit code or
  `NOT RUNNABLE LOCALLY — reason`, and any red step not in §3 is reported, not fixed.
- **AC9 [R8]** Given the final diff, then it contains no `.skip`, `.todo`, `it.fails`, removed `it(`/`test(`,
  raised timeout or `retry`, except the R3 exclude.
- **AC10 [R4, R8]** Given Phase 4, when `npm.cmd test` runs three consecutive times with no change between them,
  then the only failing file in each run is `theme.d69-18.test.tsx` (or none, if 859 has landed).
- **AC11 [R9]** `npm.cmd run governance` before and after: no new HIGH/CRITICAL, no stale entry, exit 0.
- **AC12 [all]** `npm.cmd run build` exits 0 on the final tree.

`GR-4 AC AUDIT — 12 criteria; each states an observable property; absolutes: none.`

## 13. QA profile and verification plan

**Q1** — tests and gates, no rendered UI change; plus the Q4 planted-violation line for every changed gate/test
(AC3, AC6). Final production build is a hard gate.

```powershell
node.exe -p process.platform
npm.cmd run governance
npm.cmd test
npx.cmd vitest list
npm.cmd run check:css-vars
npm.cmd run check:css-vars:verify
npx.cmd vitest run scripts/__tests__/css-var-resolvability.test.ts scripts/__tests__/mantine-story-scope.test.ts src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx
npm.cmd run build-storybook
npm.cmd run check:card-track-monotonicity:verify
npm.cmd run check:locale-leak:mantine-only
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build
```

Expected: `win32`; governance exit 0; `npm test` red only on `theme.d69-18` (or green); `vitest list` without
`docs/`; css-vars exit 0; the three targeted files pass; Storybook builds; card-track verify exit 0; locale-leak
finishes (duration recorded); integrity/mojibake/build exit 0. **The CI proof is the owner's push:** Opus reads the
push-triggered run per `docs/orchestrator-procedures.md` → "Main-branch CI receipt".

## 14. Completion report contract

Changed files (must equal §7 ∩ diff) · R/AC status · each command with its actual exit code and evidence path ·
per-failure disposition table (`test wrong` / `source wrong` + why) · Phase-1 and Phase-4 census tables · locale-leak
timing table · dirty-worktree manifest and hash witnesses · assumptions, deviations, STOPs hit · status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` — never self-approval; no git
commands. Update `docs/backlog.md` row 790 state and write `docs/sessions/2026-10-07-task790-rest-main-ci-green.md`.

## 15. Task quality gate

- Executable without chat context: yes — every failure has its log line, file and line (§3).
- Every requirement has an AC and a verification (§4 ↔ §12).
- Scope protects 859's uncommitted work: §7 paths only; `governance-pr.yml` via patch (C13).
- No fact first verified by the executor: §3 rows are Opus-read; C12 is explicitly `UNKNOWN` with a re-measure.
- STOP points are bounded (§5); no multi-route choice is left to Sonnet.
- GR-1 / GR-3 / GR-10 / GR-11: **not applicable** — no visible surface, Story or rounded object changes (no file
  under `src/` changes except a test and its setup).
- GR-0: **not applicable** — no visible component, Story or style is created.

## 16. Reference research (GR-7)

**Subject:** CI test-suite and gate repair. **Library:** `docs/research/references/2026-10-04/` (Lahomes 106 pages,
Kamr 62, Omah 339, TailAdmin 88 inspected; 0 blocked) — no row concerns CI, test suites or build pipelines.
**Live check (Opus, 2026-10-07, Playwright):**

| Reference | Entry URL reached | Links on entry | Subject present | vs library |
|---|---|---|---|---|
| Lahomes | `…/lahomes/admin/index.html` ("Analytics \| Lahomes") | 106 | No | unchanged |
| Kamr | `/login` → signed in `demo@example.com` → `/dashboard` | 66 | No | **difference: login now succeeds** (library: "login failed with both credential sets") — re-crawl owed for UI tasks; does not affect this subject |
| Omah | `…/xhtml/index.html` | 73 | No | unchanged |
| TailAdmin | `demo.tailadmin.com/` ("eCommerce Dashboard") | 88 | No | unchanged |

**Chosen 2026 practice:** none applicable — the references are UI templates and show nothing about CI; the task
follows the repository's own gate conventions (two-armed plants, remove-only baselines, fail-closed gates).
**lero.al data map:** not applicable (no entity, action, route or UI changes). The executor repeats this live check
into `docs/sessions/evidence/task790/research-exec/` before the first write (GR-7 execution moment).

## Mobile adaptation record
- Scope: none
