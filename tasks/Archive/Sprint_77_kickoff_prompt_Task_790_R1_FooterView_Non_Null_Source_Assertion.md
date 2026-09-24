# Task 790 · Revision 1 — `theme.d69-18` contract check tolerates TypeScript non-null assertions

**Sprint:** 77 — [`Sprint_77_The_Full_Test_Suite_Nobody_Runs.md`](Sprint_77_The_Full_Test_Suite_Nobody_Runs.md)
**Priority:** P1 · **QA profile:** Q1 Targeted · **Executor:** Sonnet (`execute-task`) · **Author:** Opus, 2026-09-18

> **Owner instruction, 2026-09-18, verbatim:** *"напиши задачу для Sonnet в рамках Task 790, як revision 1, щоб
> Sonnet виправила тест, після виправлень нехай запустить тести"*.
>
> **On the label "Revision 1".** No earlier Task 790 kickoff exists — 790 was reserved on 2026-09-05 with a backlog
> row only (FACT: no `tasks/**` file is 790's kickoff). "Revision 1" is the owner's name for this **first executable
> slice** of 790, so it is written here as **790 R1**. It is not an amendment of a prior kickoff, and there is no
> Revision 0 to read. Everything else 790 covers stays reserved (§8).

---

## 1. Mode and task type

- **Mode:** TASK DESIGN → implementation kickoff for Sonnet.
- **Task type:** test fix. The only file changed is one Vitest file. No product source, no UI, no story, no theme
  value, no script. **Execution state:** `from-scratch`.
- **Surface / Story classification.** No visible artifact changes. `FooterView.tsx` is **read** by the test and
  temporarily edited by one reversible probe (§10.4), which must be restored byte-identical. So:
  - GR-1: not applicable. No visible surface is changed.
  - GR-3 / GR-3a: not applicable. No Story is created, extended or retained.
  - Clause 16c/16d: not applicable, for the same reason.

## 2. Objective

The contract check in `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` has one test that is red for a
reason unrelated to the design contract:

`src/components/layout/FooterView.tsx resolves theme.other.layout.footerGridGap`

`FooterView.tsx` does read the token correctly. The test fails only because the source writes it with TypeScript
non-null assertions (`theme.other!.layout!.footerGridGap`), and the test does a plain substring match against
`theme.other.layout.footerGridGap`.

Fix the **test** so it compares code with the type-only `!` removed. The fixed test must still fail when the token
read is actually missing. After the fix, run the targeted test file and then the full suite, and report both
results.

## 3. Verified context

All `FACT` rows were measured by the orchestrator on 2026-09-18 in native Windows (`win32`, Node `v22.22.3`) at
`HEAD` `81d334463` with a clean worktree. Evidence is kept in `docs/sessions/evidence/task790/r1-design/`.

| # | Claim | Label | Evidence |
|---|---|---|---|
| 3.1 | `FooterView.tsx:71` reads `spacing={theme.other!.layout!.footerGridGap}`. `theme` is the direct import `@/design-system/mantine/theme` at `:3`. | FACT | file read |
| 3.2 | The `!` operators came from outage hotfix `34faa47a9`, *"FooterView is a Server Component - read theme directly instead of useMantineTheme"*. Task 784's `useMantineTheme()` in this Server Component took `lero.al` down. The direct import is the fix, and the `!` are needed because `other`/`layout` are optional on the imported theme object's type. | FACT (commit message, diff stat) / INFERENCE (reason for `!`) | `git show --stat 34faa47a9` |
| 3.3 | The same `theme.other!.x!` form is used in production elsewhere: `app/[locale]/page.tsx:20-22`, `app/[locale]/layout.tsx:53`, `FavoritesShell.tsx:150/168/195`, `ListingBackButton.tsx:40`. It is the project's normal pattern, not a defect in `FooterView`. | FACT | `grep 'theme\.other!'` |
| 3.4 | The token exists: `theme.ts:197` types `footerGridGap: number`, and `theme.ts:578` defines `footerGridGap: 40`. The runtime check `theme.d69-18.test.tsx:134` (`typeof t.other.layout.footerGridGap === 'number'`) **passes**. | FACT | file read + test run |
| 3.5 | Failing mechanism: `CONTRACT_CONSUMERS` (`:160-271`) entry `:256-260` has `mustContain: ['theme.other.layout.footerGridGap']`. The loop at `:273-282` runs `expect(readSource(file)).toContain(needle)`. `readSource` (`:59-61`) returns the raw file text. | FACT | file read |
| 3.6 | Targeted run: `npx vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx` gives **1 failed / 54 passed (55)**. The only failure is the one in §2. | FACT | orchestrator run 2026-09-18 |
| 3.7 | Full suite: `npx vitest run` (the same as `npm run test`) exits 1 with **Test Files 3 failed / 86 passed (89); Tests 4 failed / 1638 passed (1642)**. Failing tests: (a) the `FooterView` test above; (b) `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` › `BLOCKED: listing.hoverClass is still the literal Tailwind string…`; (c) and (d) `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` › `archived listing renders the archived badge + dimmed card`, once in the vertical branch and once in the horizontal branch. | FACT | `r1-design/00-full-suite-design.txt` |
| 3.8 | The suite is **not deterministic**. 810's review saw 5/9/9/10 failures over four runs with no source change, and 822's review saw `ListingGallery.portal.smoke` ×4 (jsdom `ResizeObserver`). Neither appeared in 3.7's run. Any count here is a snapshot. | FACT (backlog row 790) | `docs/backlog.md` row 790 |
| 3.9 | Normalisation probe over all **22** `CONTRACT_CONSUMERS` entries / **33** needle rows. After removing `!` only where it sits between an identifier character, `)` or `]` and a following `.`, **all 33** needles match, `FooterView` included. No needle contains `!`. `FooterView.tsx` has exactly 2 such `!` sites and 0 `!=`. | FACT | `r1-design/01-needle-normalization-probe.{mjs,txt}` |
| 3.10 | **Separate blind spot, out of scope here:** needle `theme.breakpoints.lg` for `MantineListingContactPattern.tsx` matches **only inside a comment** (`:119`), so that entry passes on comment text. If comments are stripped as well, that entry turns red. **So R1 must not strip comments in the contract loop.** This is filed in 790's remaining scope (§8). | FACT | same probe (`codeOnly=false`) |
| 3.11 | The compactTrigger test (`:299-310`) is a **negative** substring check: `not.toContain('boxSize.compactTrigger')`, run after removing comments. A live `theme.other.boxSize!.compactTrigger` would get past it for the same reason. `MantineTooltip.tsx` has the name only in a comment (`:95`), so the normalised check still passes today. | FACT (file read) / INFERENCE (it evades) | grep |
| 3.12 | `scripts/map-changed-surfaces.mjs:188,194,204` classifies `*.test.tsx` and `__tests__/` paths as `excluded: story-or-test-file`. A diff that changes only this test file maps to no surface. `check:surface-census:changed` is a CI gate and is not part of this task's local verification. | FACT (source read) / INFERENCE (CI outcome) | file read |
| 3.13 | `theme.d69-18` is not in `docs/critical-flow-registry.md`. | FACT | grep, 0 hits |

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-09-18 | The contract loop compares each needle against the consumer source **with TypeScript non-null assertions removed**. `FooterView.tsx resolves theme.other.layout.footerGridGap` passes without any change to `FooterView.tsx`. | P1 | AC1 | Confirmed |
| R2 | Task design (§3.9) | The normaliser removes **only** a `!` that directly follows an identifier character, `)` or `]` **and** directly precedes `.`. It leaves `!==`, `!=`, logical-not `!x` and `!(…)` unchanged. It has its own tests in the same file. | P1 | AC2 | Confirmed |
| R3 | Recurring failure mode (orchestrator-procedures, "two-armed plant") | The fixed check still **fails** when the consumer no longer reads the token. This is proved by a reversible probe on `FooterView.tsx` with a hash witness. | P1 | AC3 | Confirmed |
| R4 | Task design (§3.10) | Needle strings, the `file` list and the number of `CONTRACT_CONSUMERS` entries stay the same. The raw-dimension `describe` (`:284-297`) still scans **raw** `readSource()` output. Nothing is skipped or marked todo. No `it.fails`. Comments are not stripped in the contract loop. | P1 | AC4 | Confirmed |
| R5 | Task design (§3.11) | The compactTrigger negative check applies the same normaliser after comment stripping, so a `boxSize!.compactTrigger` form is caught too. | P3 | AC5 | Confirmed |
| R6 | Owner ("виправила тест") + clause 1 | No production source, theme, script, story or config file changes. | P0 | AC6 | Confirmed |
| R7 | Owner ("після виправлень нехай запустить тести") | After the fix, run the targeted file and the **full suite**, and report actual counts, exit codes and the failing-test names. No failure outside the executor's own I0 failing set is introduced. | P1 | AC7 | Confirmed |
| R8 | Q1 profile, clause 9 | `typecheck`, eslint on the changed file, `check:mojibake`, and the final `npm run build` exit 0. | P1 | AC8 | Confirmed |
| R9 | Clause 10, GR-5 | `docs/backlog.md` row 790 and the Sprint 77 Tasks row record R1's state. A session log with an accurate "Files Changed" table exists. | P2 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **ASSUMED:** the non-null form is the only syntax gap the owner wants closed. Optional chaining
  (`theme.other?.layout?.x`) would be a false red for the same reason. No consumer in `CONTRACT_CONSUMERS` uses it
  today (FACT, §3.9 probe: all needles match after `!` removal alone), so it is **out of scope** and must not be
  added.
- **UNKNOWN:** whether the non-deterministic group (§3.8) fails in the executor's runs. R7 handles both outcomes
  (§11, §12 AC7).
- No owner decision is pending for this slice.

## 6. Pre-read rule bundle

Read these, and only these, before editing:

1. `docs/golden-rules.md`
2. `docs/agent-contract.md`: clauses 1, 9, 10 and 14
3. `docs/qa-profiles.md`: the `Q1 Targeted` row
4. `docs/qa-rules.md`: "Encoding hygiene (UTF-8, mojibake gate — Task 428)"
5. `docs/orchestrator-procedures.md`: the "Corollary (818/819)" paragraph on `Get-Content -Raw` mojibake and hash
   witnesses, which binds the §10.4 probe
6. `docs/backlog.md`: row **790**
7. This kickoff and `tasks/Sprints/Sprint_77_The_Full_Test_Suite_Nobody_Runs.md`

## 7. Scope

**Write set (exact):**

| Path | Change |
|---|---|
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` | Add the normaliser and its tests. Apply it in the contract loop and in the compactTrigger check. |
| `docs/backlog.md` | Row 790: R1 state only. |
| `tasks/Sprints/Sprint_77_The_Full_Test_Suite_Nobody_Runs.md` | Tasks table, `790 · R1` row: State cell only. |
| `docs/sessions/<execution-date>-task790r1-footerview-non-null-source-assertion.md` | New session log. |
| `docs/sessions/evidence/task790/r1/*` | New evidence transcripts. |

**Temporarily touched, then restored byte-identical:** `src/components/layout/FooterView.tsx`, by the §10.4 probe
only. It must not appear in the final `git status --porcelain`.

## 8. Out of scope

Do not do any of the following. Report them if you see them, but do not fix them.

- Any change to `FooterView.tsx` or any other product file. This includes removing its `!` or going back to
  `useMantineTheme()`. The second one re-creates the 2026-09-04 production outage (§3.2).
- Adding the needle text as a comment in `FooterView.tsx`, or editing any needle, so that the substring matches.
- Stripping comments in the contract loop. §3.10 shows this turns `MantineListingContactPattern` red. That
  comment-only match is a known blind spot and belongs to **790's remaining scope**.
- Optional-chaining support (§5).
- The other full-suite failures: `appimage-config-class-assertions`, `ListingCard.smoke` archived ×2,
  `ListingGallery.portal.smoke`, `css-var-resolvability`, and the non-deterministic group. All of them stay in 790's
  remaining scope.
- The standing-gate decision for the full suite (Sprint 77, exit criterion 4).
- Any mutating git command (clause 10).

## 9. Current and required behavior

| | Current (`HEAD` `81d334463`) | Required after |
|---|---|---|
| `FooterView.tsx resolves theme.other.layout.footerGridGap` | ✗: substring not found, because of `!` | ✓ |
| Other 32 contract-needle rows | ✓ | ✓ unchanged (same needles, same files) |
| Contract check when a consumer stops reading its token | ✗ (correct) | ✗ (still correct; proved by §10.4) |
| Raw-dimension `describe` | scans raw source | scans raw source (unchanged) |
| compactTrigger negative check | blind to `boxSize!.compactTrigger` | catches it |
| `theme.d69-18.test.tsx` totals | 1 failed / 54 passed (55) | 0 failed; total = 55 + the new normaliser tests |
| Full suite | red: 4 failures in the §3.7 snapshot | still red for the out-of-scope failures only; the `FooterView` test is gone from the failing set |

## 10. Implementation requirements

### 10.1 I0: baseline before any edit

1. Record `node.exe -p process.platform` (must be `win32`), the Node version, the working directory, `git
   --no-optional-locks status --porcelain` and `git hash-object` of the test file and of `FooterView.tsx`.
2. Run the targeted file and then the full suite (§13.1). Keep both transcripts. The **I0 failing set** is the set
   of failing test full names from **your** full-suite run. Do not use §3.7's list for this: §3.8 says the suite
   varies between runs.
3. **STOP → `BLOCKED`** if the targeted run's failures are anything other than exactly the `FooterView` test, or if
   `FooterView.tsx:71` no longer reads `theme.other!.layout!.footerGridGap`. Either means the premise has drifted.

### 10.2 The normaliser

Add one module-level helper next to `readSource`, with a short comment giving the reason (type-only syntax, and the
hotfix `34faa47a9`). The observable contract (R2):

- `'theme.other!.layout!.footerGridGap'` → `'theme.other.layout.footerGridGap'`
- `'fn()!.x'` → `'fn().x'`; `'arr[0]!.x'` → `'arr[0].x'`
- `'a !== b'`, `'a != b'`, `'!x.y'`, `'if (!theme.other) {}'`, `'!(a).b'` → unchanged

One regex that satisfies this is `/(?<=[\w)\]])!(?=\.)/g`, the same one used by the design probe in §3.9. You may use
an equivalent, but the tests below decide whether it is correct.

Add a `describe` block that asserts every mapping above, one `expect` each. Do not use a raw design value in this
block; these are syntax fixtures only.

### 10.3 Wiring

- Contract loop (`:273-282`): compare the needle against `normalise(readSource(file))`. The needles stay
  byte-identical.
- compactTrigger check (`:299-310`): apply the normaliser **after** comment stripping and before
  `not.toContain`.
- Raw-dimension `describe` (`:284-297`): **no change**. It must keep passing raw `readSource(file)` to
  `scanContent`.
- Keep the file's existing header doc comment accurate. Point 4(a) (`:18-20`) says the source text "contains a
  reference". Add that type-only non-null assertions are removed first.

### 10.4 Absence arm: reversible probe on `FooterView.tsx` (R3)

Prove the fixed check still goes red when the read is really gone. Use Node for all I/O, never `Get-Content -Raw`,
per the Corollary (818/819).

1. `git hash-object src/components/layout/FooterView.tsx` → record as **pre-probe hash**.
2. Copy the file byte-for-byte (`fs.copyFileSync`) to a path **outside the repository**, such as `os.tmpdir()`.
3. In the working file, replace the single occurrence of `theme.other!.layout!.footerGridGap` with `40`. The script
   must exit non-zero if the replacement did not happen.
4. Run `npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx -t "FooterView.tsx resolves"`.
   **Expected: exit ≠ 0**, and the failure is the `FooterView … footerGridGap` test. Keep the transcript.
5. Restore with `fs.copyFileSync` from the saved copy. Re-run `git hash-object` and confirm it equals the pre-probe
   hash. Confirm `git status --porcelain -- src/components/layout/FooterView.tsx` is empty. Keep both outputs.
6. If step 4 exits 0, the fix is vacuous: **STOP → `BLOCKED`**, restore anyway, and report.

## 11. Positive and negative flows

**Positive flow:**

1. I0 is red on exactly one test.
2. Add the normaliser and its tests.
3. Wire it in.
4. The targeted file is fully green.
5. The probe goes red.
6. Restore, and the hash matches.
7. The full suite's failing set is the I0 set minus the `FooterView` test.
8. All Q1 gates pass.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Consumer stops reading its token | **Yes** | R3 | Contract test fails | §10.4 transcript |
| `!=` / `!==` / logical `!` in a consumer | **Yes** | R2 | Not altered by the normaliser | §10.2 tests |
| Live `boxSize!.compactTrigger` in `MantineTooltip.tsx` | **Yes** | R5 | Negative check fails | Normaliser test covers the syntax. No probe on `MantineTooltip.tsx` is required. |
| Full suite shows a failure **not** in the I0 set | **Yes** (§3.8) | R7 | **Do not fix it.** Re-run that single file in isolation twice and record both results. If it passes in isolation, label it `UNATTRIBUTED — non-deterministic`. If it still fails, check whether it imports or reads `theme.d69-18.test.tsx` (it should not). Report it as `UNATTRIBUTED` in the session log, with status `PARTIALLY IMPLEMENTED`. | transcripts |
| Validation / Authorization-RLS / Offline / Concurrent writer | No | — | No runtime code changes | — |

## 12. Acceptance criteria

- **AC1 [R1]**
  - **Given** `FooterView.tsx` byte-identical to `HEAD` (§10.1 hash)
  - **when** the targeted file runs (§13.2)
  - **then** `src/components/layout/FooterView.tsx resolves theme.other.layout.footerGridGap` is reported passed,
    and the file reports 0 failed.
- **AC2 [R2]**
  - **Given** the new normaliser `describe`
  - **when** the targeted file runs
  - **then** each §10.2 mapping has its own passing assertion, and the mappings listed as "unchanged" assert
    equality with their input.
- **AC3 [R3]**
  - **Given** the §10.4 probe replacing the token read with `40`
  - **when** the filtered run executes
  - **then** it exits non-zero on the `FooterView … footerGridGap` test
  - **and**, after restore, `git hash-object` equals the pre-probe hash and `FooterView.tsx` is absent from `git
    status --porcelain`.
- **AC4 [R4]**
  - **Given** the final diff of the test file
  - **when** it is inspected
  - **then**:
    - no `mustContain` string, `file` value or `contract` value changed
    - `CONTRACT_CONSUMERS` has 22 entries
    - the raw-dimension `describe` still calls `scanContent(readSource(file), …)` on unnormalised text
    - the file contains no `.skip`, `.todo`, `it.fails` or `.only`.
- **AC5 [R5]**
  - **Given** the compactTrigger test
  - **when** it is inspected and run
  - **then** its assertion subject is the normalised, comment-stripped source, and it passes on the unchanged
    `MantineTooltip.tsx`.
- **AC6 [R6]**
  - **Given** the final `git status --porcelain`
  - **when** it is compared against §7's write set
  - **then** every listed path is in the write set, and no path under `src/` other than the test file appears.
- **AC7 [R7]**
  - **Given** the final full-suite run (§13.2)
  - **when** its failing test names are compared with the I0 failing set
  - **then**:
    - the `FooterView … footerGridGap` test is absent from the failing set
    - every remaining failure is either in the I0 set or reported under §11's `UNATTRIBUTED` branch with its
      isolation re-runs
    - the transcript shows the actual `Test Files` / `Tests` lines and exit code.
- **AC8 [R8]**
  - **Given** the final tree
  - **when** §13.2's gates run
  - **then** `npm run typecheck`, `npx eslint` on the test file, `npm run check:mojibake` and `npm run build` each
    exit 0, and the changed and created text files are UTF-8 without BOM.
- **AC9 [R9]**
  - **Given** the session log
  - **when** its "Files Changed" table is compared with `git status --porcelain`
  - **then** they list the same paths
  - **and** `docs/backlog.md` row 790 and the Sprint 77 `790 · R1` row both state `IMPLEMENTED - AWAITING ORCHESTRATOR
    REVIEW` (or the honest lower status)
  - **and** `docs/backlog.md` is at most 80 lines, with its baseline taken from `git show HEAD:docs/backlog.md`.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.`
(AC3's hash equality and AC4's "no needle changed" check equality with a recorded input. They are not absolutes that
a correct implementation could break. AC7 allows a non-deterministic failure through a reported branch instead of
requiring a green suite.)

## 13. QA profile and verification plan

**Q1 Targeted.** This task changes a test only, with no rendered behavior. So: targeted test, typecheck, lint of the
touched file, mojibake gate, and the final zero-exit `npm run build`. No rendered or visual evidence is needed, and no
owner visual QA matrix applies (no visible artifact changes). `screenshots:assert` is not used.

Store every transcript under `docs/sessions/evidence/task790/r1/` as UTF-8 without BOM. Each transcript must include
the platform, Node version, working directory, exact command and actual exit code.

### 13.1 I0: before any edit

```powershell
$test = "src/design-system/mantine/__tests__/theme.d69-18.test.tsx"
$footer = "src/components/layout/FooterView.tsx"
node.exe -p "process.platform + ' ' + process.version"
git --no-optional-locks status --porcelain
git hash-object $test
git hash-object $footer
npx.cmd vitest run $test
npx.cmd vitest run
```

Expected results:

- `win32`.
- Clean status, or a status you record in full.
- Two hashes.
- The targeted run shows 1 failed / 54 passed, with the only failure being the `FooterView` test.
- The full suite exits 1. Its failing set is your **I0 failing set**.

### 13.2 Final gates, after the edit and after the §10.4 probe is restored, in one pass

```powershell
$test = "src/design-system/mantine/__tests__/theme.d69-18.test.tsx"
$footer = "src/components/layout/FooterView.tsx"
node.exe -p "process.platform + ' ' + process.version"
npx.cmd vitest run $test
npx.cmd vitest run
npm.cmd run typecheck
npx.cmd eslint $test
npm.cmd run check:mojibake
npm.cmd run build
git hash-object $test
git hash-object $footer
git --no-optional-locks status --porcelain
```

Expected results:

- The targeted run shows 0 failed. Total = 55 + the normaliser tests.
- The full suite's failing set is the I0 set minus the `FooterView` test, with §11's reported branch for anything
  else. Exit 1 is expected while the out-of-scope failures remain.
- `typecheck`, `eslint`, `check:mojibake` and `build` each exit 0.
- The test file's hash differs from I0.
- `FooterView.tsx`'s hash equals I0.
- Status lists only §7's write set.

## 14. Completion report contract

Return this, and write it in the session log as well:

- **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.
- **Files changed:** a table that matches `git status --porcelain`.
- **Requirements completed:** R1–R9, with the AC that proves each one.
- **Commands run:** exact command, exit code and evidence path for every command in §13.1, §10.4 and §13.2.
- **Targeted results:** before and after counts for `theme.d69-18.test.tsx`.
- **Full suite:**
  - the I0 failing set and the final failing set, as full test names
  - the difference between them
  - any `UNATTRIBUTED` entries, with their isolation re-runs.
- **Probe:** pre-probe hash, post-restore hash, the red run's transcript path.
- **Assumptions, deviations, limitations, unresolved issues.** State explicitly that the comment-only
  `theme.breakpoints.lg` match (§3.10) is untouched and still owned by 790's remaining scope.
- No mutating git command is run, suggested or emitted.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session without chat context | Yes. Premise, line numbers, regex contract, probe and commands are all in this file. |
| Every requirement has a binary AC and a verification method | R1–R9 → AC1–AC9 |
| Existing behavior protected | §9 lists the 32 unchanged needle rows, the raw-dimension scan and `FooterView.tsx` (hash witness) |
| Two-armed control | Pass arm is AC1. Absence arm is AC3 (§10.4). The false-red arm is the I0 run itself. |
| Detector scope stated (GR-2) | The contract check inspects source text after type-only `!` removal. It **cannot** tell code from comments (§3.10), and it cannot prove runtime values (that is `:134` and the I2 browser suite). |
| Measured facts re-derived, not quoted | §3.6, §3.7 and §3.9 were run by the orchestrator on 2026-09-18. I0 re-measures them because the suite is non-deterministic (§3.8). |
| No invented command | Every command exists in `package.json` (`test`, `typecheck`, `lint`, `build`, `check:mojibake`) or is `npx vitest`/`npx eslint` against a path read in this session. |
| Q1 includes the final build | §13.2 |
| Sprint assigned | Sprint 77, opened in the same edit |

---

## 16. Review 1 (2026-09-18): `NEEDS REVISION`, evidence-only Revision 1

**The implementation is not reopened.** The reviewer re-read the test-file diff and re-ran natively (`win32`) the
targeted file, the full suite, `typecheck`, `eslint`, `check:mojibake` and `npm run build`. Every command gave the
expected result, and `build` exited 0. AC1–AC7 hold on the real diff:

- targeted run: 63/63 passed;
- the probe went red and was restored (FooterView hash `69994cd6…` before and after);
- `CONTRACT_CONSUMERS` still has 22 entries, with no needle, `file` or `contract` value changed;
- the raw-dimension scan still reads raw source;
- the full suite's failing set equals the I0 set minus the `FooterView` test.

**Do not edit `src/`, and do not re-run any capture.** The I0 arm cannot be re-captured now that the test is fixed,
so the existing transcripts are the only baseline and must be preserved.

### 16.1 Findings

- **F1 — P2 [R8, AC8, clause 14].** Of the 23 files under `docs/sessions/evidence/task790/r1/`, **15 start with a
  UTF-8 BOM (`EF BB BF`)**, which breaks AC8's "UTF-8 without BOM". `check:mojibake` does not detect BOMs, so its
  green result does not cover this (GR-2). The files are:
  - `00-platform.txt`, `01-git-status-i0.txt`, `02-hash-test-i0.txt`, `03-hash-footer-i0.txt`
  - `04-targeted-i0.txt`, `05-full-suite-i0.txt`, `06-targeted-after-fix.txt`, `09-probe-red-run.txt`
  - `13-targeted-final.txt`, `14-full-suite-final.txt`, `15-typecheck.txt`, `16-eslint.txt`, `17-mojibake.txt`
  - `18-build.txt`, `22-mojibake-final-all-files.txt`
- **F2 — P2 [R9, AC9, §14].** The session log says things the evidence contradicts:
  - "Commands run" (`:35`) says every transcript is BOM-free and that *each* one records the platform, Node version,
    working directory, exact command and exit code. F1 disproves the first part. For the second, transcripts such as
    `05-full-suite-i0.txt` and `13-targeted-final.txt` start with the Vitest banner and have no
    platform/cwd/command header. Platform, Node and cwd are recorded once, in `00-platform.txt`.
  - "Files changed" says the evidence folder has "21 files"; it has **23**.

### 16.2 Revision 1: exact actions

1. **Remove the BOM from exactly the 15 paths in F1, and nothing else.**
   - Use Node I/O only.
   - Before any write, the script prints the 15-path manifest and checks that every path exists and starts with
     `EF BB BF`. If the count is not 15, or a path is missing, or a path has no BOM, the script prints
     `SCOPE GUARD FAILED` and writes nothing.
   - For each path, record `git hash-object` before the write, then write `bytes.subarray(3)`, then record the hash
     after.
2. **Correct the session log in place:**
   - Replace the `:35` sentence with a true one: transcripts are UTF-8 without BOM *after the Revision 1 BOM strip*.
     Platform, Node version and cwd are recorded once, in `00-platform.txt`. Each transcript's exact command and exit
     code are recorded in the "Commands run" table.
   - Change "21 files" to "23 files".
   - Add a short "Revision 1" section that names F1/F2, the 15-path manifest, the before/after hashes, and the
     evidence file from step 3.

   **§13's instruction that every transcript must carry its own header is waived for this task only**, by the
   orchestrator who wrote that instruction. It is a reporting instruction, not an AC. Do not add headers to existing
   transcripts after the fact.
3. **Run the verification below** and save its output as `docs/sessions/evidence/task790/r1/23-rev1-bom-and-mojibake.txt`,
   written through Node as UTF-8 without BOM.
4. **State records:**
   - Set `docs/backlog.md` row 790 and the Sprint 77 `790 · R1` row back to
     `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Revision 1)`.
   - `docs/backlog.md` stays at 80 lines or fewer.

### 16.3 Revision 1 acceptance criteria

- **AC-R1 [R8]**
  - **Given** the evidence folder, the session log, and the test file
  - **when** the verification block runs
  - **then** it prints `BOM files: 0`.
- **AC-R2 [R8]**
  - **Given** the 15 manifest paths
  - **when** you compare the pre-strip and post-strip bytes
  - **then**, for every path, the post-strip content equals the pre-strip content with only the first 3 bytes removed
  - **and** no other file's `git hash-object` changes.
  - The Node script asserts this and exits non-zero on any mismatch.
- **AC-R3 [R9]**
  - **Given** the corrected session log
  - **when** you compare it against the folder listing and the transcripts
  - **then** its file count matches the actual count
  - **and** no sentence claims a property that a transcript lacks.
- **AC-R4 [R6]**
  - **Given** the final `git status --porcelain`
  - **when** you compare it against §7's write set
  - **then** no path under `src/` appears except the test file
  - **and** the test file's hash still equals `dc744262ef46d8263dfead87de9657a22791991e`.

### 16.4 Verification

Run from the project root:

```powershell
$ev = "docs/sessions/evidence/task790/r1"
$test = "src/design-system/mantine/__tests__/theme.d69-18.test.tsx"
node.exe -p "process.platform + ' ' + process.version"
node.exe -e "const fs=require('fs'),p=require('path');const d='docs/sessions/evidence/task790/r1';const files=fs.readdirSync(d).map(f=>p.join(d,f)).concat(['docs/sessions/2026-09-18-task790r1-footerview-non-null-source-assertion.md','src/design-system/mantine/__tests__/theme.d69-18.test.tsx']);const bom=files.filter(f=>{const b=fs.readFileSync(f);return b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF});console.log('files scanned: '+files.length);console.log('BOM files: '+bom.length);bom.forEach(f=>console.log('  '+f));process.exit(bom.length?1:0)"
npm.cmd run check:mojibake
git hash-object $test
git --no-optional-locks status --porcelain
```

Expected results:

- The platform is `win32`.
- The BOM check prints `BOM files: 0` and exits 0.
- `check:mojibake` exits 0.
- The test file's hash is `dc744262ef46d8263dfead87de9657a22791991e`.
- `git status --porcelain` lists only §7's write set.

No `build` or test re-run is required: Revision 1 changes no source or test file, and the test file's hash
witness above proves it.

## 17. Review 2 (2026-09-18): `APPROVED`

The Revision 1 work closes F1 and F2:

- AC-R1: the reviewer's own scan of 29 files reports `BOM files: 0`.
- AC-R2: for all 15 manifest paths, the reviewer re-derived both hashes — the current bytes with the BOM put back
  reproduce the pre-strip hash, and the current bytes reproduce the post-strip hash. Hashing used git's path filters
  (`text=auto eol=lf`).
- AC-R3: the session log's file count (25) and its provenance sentence match the folder.
- AC-R4: the test file hash is still `dc744262…` and `FooterView.tsx` is still `69994cd6…`.

The review 1 findings on AC1–AC7, and the reviewer's `build` (exit 0) at the same test-file hash, still apply. The task
is archived, and the rest of Task 790 stays reserved in Sprint 77.
