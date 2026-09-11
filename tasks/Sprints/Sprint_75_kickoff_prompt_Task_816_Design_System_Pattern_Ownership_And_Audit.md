# Task 816 — The design system is governed three different ways, and nobody chose that

Sprint 75 · **P1** · QA profile **Q2**

## 1. Mode and task type

`IMPLEMENTATION` — governance audit and ownership. One measured census of every design-system pattern, one runnable
re-measure command, one owner decision on the governance model, and the P3 notes Tasks 817, 818 and 819 left for this
task. **No new blocking gate**, no component migration, no product UI change.

## 2. Objective

Owner decision 1 (2026-09-11, quoted verbatim in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`)
classified eleven shared Mantine patterns as tier 3, gave each a literal allowlist entry, and assigned this task:

> Each entry needs a durable reason and owner Task 816. File Task 816 in the same state update as the
> design-system-pattern ownership/audit task. **It owns future changes to this path list and must re-measure it
> whenever a listed pattern changes.**

`FACT`, measured this session against `scripts/mantine-migration-scope.json` and
`scripts/rendered-scope-allowlist.json` — `src/design-system/mantine/patterns/` holds **33** pattern source files,
and they are governed **three different ways**:

| Governance state | Count | Which |
|---|---:|---|
| **Enrolled** in the migration manifest — covered by `check:story-coverage` and walked as a root by `check:rendered-scope` | **5** | `MantineAddItemPanel`, `MantineEmptyLoadingErrorState`, `MantineFilterSection`, `MantineHomeSection`, `MantineListingCardTrack` |
| **Tier-3 allowlisted**, owner 816 — deliberately excluded from the frontier, never enrolled | **11** | `MantineCombobox`, `MantineCopyIdButton`, `MantineCountButton`, `MantineDrawer`, `MantineDropdownMenu`, `MantineListingCardPattern`, `MantineListingContactPattern`, `MantineListingDetailPattern`, `MantineModal`, `MantinePagination`, `RangeDatePicker` |
| **Neither** — in no manifest, in no allowlist | **17** | `MantineAdminSurfacePattern`, `MantineAppShellFoundation`, `MantineAuthFormPattern`, `MantineDataTableToCards`, `MantineDialogDrawerPattern`, `MantineFormSectionStack`, `MantineListingGalleryPattern`, `MantineNavigationMenu`, `MantineNotificationPattern`, `MantinePageHeaderWithActions`, `MantinePopover`, `MantineProgress`, `MantineResponsiveActionFooter`, `MantineSelect`, `MantineTooltip`, `MantineTwoColumnForm`, `responsiveBottomSheet` |

`INFERENCE`, and it is the whole point of this task: **nobody chose that split.** The 11 are allowlisted because they
were the patterns an *enrolled root* happened to render on 2026-09-11, so they appeared in `check:rendered-scope`'s
frontier and needed a disposition. The 17 never appeared there, so nothing ever asked about them. The line between
"tier 3, owner 816" and "ungoverned" is an artefact of which surfaces were enrolled on one particular day — which is
this sprint's own thesis, arriving inside the design system.

This task measures all 33, verifies the premise under which 11 of them were allowlisted, gives decision 1's
"must re-measure" a command instead of a promise, and puts the governance model to the owner.

## 3. Verified context — read from source on 2026-09-11

### 3.1 The allowlist as it stands

`FACT` — `scripts/rendered-scope-allowlist.json` holds **13** entries: the 11 above with `owner: "816"` and an
identical `reason` string, plus `ListingFeatureIcon` and `FavoriteButton` with `owner: "813"`. The gate
(`check-rendered-scope.mjs:266-279`, `:344-350`) fails on an entry missing `reason` or `owner`, on a stale entry no
edge matches, and on any entry whose path is under `src/components/ui/` — the tier-2 rule Task 812's review added.

`FACT` — Task 812 §14.6.1's measured table: the 11 paths cover **23** rendered edges from enrolled roots; the largest
are `MantineCombobox` (4), `MantineCountButton` (4), `MantineDrawer` (4), `MantineModal` (3). **Re-measure at
execution** — that table is dated and the sprint has changed the tree four times since.

### 3.2 What the premise actually claims

Decision 1's words are *"shared design-system components **with canonical Stories**"*. Both halves are now
machine-checkable and neither has been checked for all 11:

- **shared** — more than one distinct consumer. `npm run check:rendered-scope:report`'s `allowlisted` block prints
  one line per edge with its importer, so the consumer count per path is measurable from the report. A path with one
  consumer is not shared, whatever its directory.
- **with canonical Stories** — `scripts/check-surface-census.mjs` (Task 817) prints `story:yes|no` per node, and
  Task 817 Revision 1 fixed it to resolve a story's import through a single-hop `index.ts(x)` barrel, which is how
  every pattern in this directory is consumed. Before that fix four of these eleven read `story:no` while their
  canonical Stories existed; the column can now be trusted for this exact question. `--json` (Task 819) makes it
  consumable in bulk.

### 3.3 The notes this task inherits

`FACT` — `docs/backlog.md`'s registry row assigns these to 816 at execution. They are small, they are all in the
same family — an artefact that misstates its own scope — and they are why this task touches those files at all:

| From | Note |
|---|---|
| 817 | `docs/sessions/evidence/task817/R1_AC16-favoritesshell-report.txt` holds the superseded `AppImage ui-imports:2` reading and is **not marked superseded** — a later session citing it would quote a corrected value |
| 817 | `ui-imports` counts only **rendered** `src/components/ui/*` bindings, so a non-rendered legacy import (`cn`, a variants helper) reads `0` against GR-1's fact ① |
| 817 | a node tripping two blocking rules is named twice in the `GR-1 CENSUS BLOCKED` list |
| 818 | its final gate block, `build` included, was captured before the AC16/AC18 probes and no script hash ties it to the shipped content — the fix is to record the changed file's `git hash-object` inside the gate block, which Task 819 already did |
| 818 | **`Get-Content -Raw` without `-Encoding utf8` silently mojibakes a BOM-less UTF-8 file on PowerShell 5.1** — it corrupted `check-rendered-scope.mjs` mid-probe and only the hash witness caught it |
| 819 | `map-changed-surfaces.mjs` keeps `CANDIDATE_SKIP_DIR_SEGMENTS` (`:192`) and the render graph's `SKIP_DIRS` (`:217`) as two literals synchronised only by a comment |

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Decision 1 | Re-measure the pattern census from source at execution: every `.tsx` under `src/design-system/mantine/patterns/`, each classified into exactly one of **enrolled** / **tier-3 allowlisted** / **neither**, with its rendered-edge count, its distinct-consumer count, and its own-Story status. §2's 5/11/17 table is a dated measurement to reconcile against, never to copy. | **P0** | AC1, AC2 | Confirmed |
| **R2** | Decision 1's premise | For each of the 11 allowlisted paths, state whether it is **shared** (≥2 distinct consumers) and whether a canonical Mantine Story imports **it** (directly or through the single-hop barrel). Any path failing either half is reported by name with its measurement — **not** quietly re-allowlisted, re-worded, or dropped. | **P0** | AC3 | Confirmed |
| **R3** | Decision 1, verbatim | *"must re-measure it whenever a listed pattern changes"* becomes a runnable command — `npm run audit:design-system-patterns` — that prints the R1 census and exits non-zero when an allowlist entry's premise no longer holds (path gone, single consumer, no own Story). It is an **audit command, not a CI gate**: it is not wired into any workflow by this task. Its trigger is documented beside the allowlist. | **P0** | AC4, AC5 | Confirmed |
| **R4** | §3.3 | The six inherited notes are closed: the superseded 817 transcript is marked superseded naming the final artifact; the `ui-imports` counting rule and the duplicate-in-blocked-line behaviour are each either fixed or recorded with the reason they stand; 819's two skip-set literals become one derived from the other; and the `Get-Content -Raw` hazard and the hash-in-the-gate-block rule are written into `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes". | P1 | AC6, AC7 | Confirmed |
| **R5** | Sprint exit criterion 5 | The same `orchestrator-procedures.md` edit carries the sprint's transferable paragraph: **when a check narrows its input set, the narrowing must be printed alongside the result, so a green line can never be read as a claim about the excluded set** — with this sprint's four landed commands as its evidence. Folded in here because R4 already opens that exact file; if the owner would rather it close the sprint separately, say so and drop it from this task. | P2 | AC8 | Confirmed |
| **R6** | §2 | **`STOP — OWNER DECISION REQUIRED`** on the governance model — see §5. The executor produces the measured input for it and implements **nothing** that changes which patterns are enrolled or allowlisted. | **P0** | AC9 | Confirmed |
| **R7** | 812 R9 precedent | `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`, `scripts/check-surface-census-changed.mjs`, `scripts/mantine-migration-scope.json`, `scripts/rendered-scope-allowlist.json` and both baselines are **not modified**, except 819's single skip-set de-duplication in `scripts/map-changed-surfaces.mjs` under R4. Every gate reproduces its pre-task counts and exit codes. | **P0** | AC10 | Confirmed |

## 5. Assumptions and open questions

- **`STOP — OWNER DECISION REQUIRED` — the governance model for the 33, and it is genuinely yours.** The measured
  split has no author. Three bounded options, each with what it costs:
  - **(a) Enrol the 11.** They are, by decision 1's own words, shared components with canonical Stories — which is
    exactly the manifest's admission test. Enrolling them puts them under `check:story-coverage`, shrinks the
    allowlist to the 2 Task 813 entries, and removes 23 allowlisted edges from the frontier by making them
    enrolled-to-enrolled. Cost: the manifest grows 38 → 49, and every enrolled pattern becomes a root of
    `check:rendered-scope`, so its own imports join the frontier — a one-time frontier increase that must be
    measured before, not after.
  - **(b) Keep the 11 allowlisted and give the 17 an explicit disposition.** Cheapest, and it leaves the design
    system governed by two mechanisms with a line nobody chose.
  - **(c) One rule for the whole directory** — every pattern enrolled, the allowlist reserved for components owned
    outside the design system. Most coherent, largest one-time move, and it would make decision 1's eleven entries
    temporary by design.
  The executor **measures the inputs for this decision and stops**; it does not select. Per `agent-contract` 16d the
  answer is recorded verbatim with its date in the sprint file, and whatever it is, implementing it is a **separate
  task** — this one does not migrate, enrol or de-allowlist anything.
- **`UNKNOWN`, and R1 resolves it** — the live 5/11/17 split, the per-path consumer counts, and how many of the 17
  are already reachable by Task 819's per-surface census through some changed surface. Measure it; §2's table is
  from 2026-09-11 and this sprint has changed the tree repeatedly.
- **`ASSUMPTION` (reversible, stated)** — the audit command is not wired into CI. Reason: decision 1 asks 816 to
  *own and re-measure*, not to block; and a new blocking gate is a Q4 task with planted-failure proof, which this is
  not. Rejected alternative: wiring it into the `governance` job now, which would make a P1 audit into a fifth
  blocking gate without the owner asking for one.
- **Out of scope:** migrating, enrolling, de-allowlisting or restyling any pattern · changing any gate's blocking
  behaviour · the 2 Task 813 allowlist entries · Tasks 815, 797, 743.

## 6. Pre-read rule bundle

`docs/golden-rules.md` GR-1, GR-2 and the `Enforcement status` table · `docs/agent-contract.md` clause **16d** tiers
1-3 · `docs/qa-profiles.md` (Q2) · `scripts/rendered-scope-allowlist.json` · `scripts/mantine-migration-scope.json` ·
`scripts/check-rendered-scope.mjs` — its allowlist validation at `:266-279` and `:344-350` ·
`scripts/check-surface-census.mjs` — the `story:` resolution and `--json` · `docs/storybook-governance.md` §15.5-§15.7 ·
`docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes" ·
`tasks/Sprints/Sprint_75_…md` — decision 1 verbatim and the exit criteria ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_…md` §14.6.1-§14.6.2 · this kickoff.

Do not read the rest of `docs/`.

## 7. Scope

- **New:** `scripts/audit-design-system-patterns.mjs` · its `package.json` entry ·
  `docs/design-system-pattern-ownership.md` — the census table, the premise verdict per allowlisted path, the
  re-measure trigger, and the owner-decision record.
- **Edited:** `docs/orchestrator-procedures.md` (the recurring-failure-modes section only, R4 + R5) ·
  `docs/sessions/evidence/task817/R1_AC16-favoritesshell-report.txt` (one supersession line, R4) ·
  `scripts/map-changed-surfaces.mjs` (the single skip-set de-duplication, R4) · `scripts/check-surface-census.mjs`
  **only if** R4's `ui-imports` note is closed by a fix rather than by a recorded reason — state which and why.
- **Written:** `docs/sessions/evidence/task816/*` · `docs/sessions/2026-09-11-task816-design-system-pattern-ownership.md` ·
  the concise `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5's out-of-scope list. In particular: **no allowlist entry is added, removed or reworded by this
task** — that is the owner decision's consequence, in its own task.

## 9. Current and required behavior

**Before.** 33 design-system patterns are governed three ways; 11 carry an identical allowlist reason whose premise
("shared, with canonical Stories") has never been verified for all 11; 17 are in no mechanism at all; decision 1's
"must re-measure whenever a listed pattern changes" has no command and no trigger.

**After.** One command prints the census and fails when an allowlist entry's premise no longer holds. One document
records the split, the per-path verdict, the trigger, and the owner's decision. The six inherited notes are closed,
and this sprint's transferable rule is written where the next orchestrator reads it.

## 10. Implementation requirements

1. **Measure with the real tools.** The consumer counts come from `npm run check:rendered-scope:report`'s
   `allowlisted` block; the Story status from `check-surface-census.mjs --json`; the enrolment from the manifest.
   No ad-hoc grep stands in for any of the three — `orchestrator-procedures.md`'s 710-714 corollary.
2. **A pattern file list is a measurement.** Derive the 33 from the directory at execution; do not transcribe §2.
3. **The audit command fails on a broken premise, not on debt.** A listed path that no longer exists, has a single
   consumer, or has no own Story is a failure naming it. The existence of un-governed patterns is a *finding in the
   document*, not a non-zero exit — until the owner decides the model, "ungoverned" is not yet a violation.
4. **Do not touch the allowlist.** R3's command reads it; nothing in this task writes it.
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file — Tasks 818 and 819's two
   evidence lessons. **Never read a source file back through PowerShell's `Get-Content -Raw` without
   `-Encoding utf8`** — §3.3, and it is one of the notes this task is closing.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`.

## 11. Positive and negative flows

**Positive.** Someone changes a listed pattern, runs `npm run audit:design-system-patterns`, and learns immediately
whether its allowlist entry still holds — which is the obligation decision 1 gave this task and which has had no
mechanism until now.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| A listed path no longer exists | Yes | audit fails naming it — the allowlist's own stale check would too, but only once an edge disappears |
| A listed path has exactly one consumer | Yes | audit fails naming it and its consumer; "shared" is decision 1's word |
| A listed path has no canonical Story of its own | Yes | audit fails naming it; a parent's Story is not its Story (GR-3) |
| A pattern is in **both** the manifest and the allowlist | Yes | audit fails — the two mechanisms are exclusive by construction |
| A new pattern file appears in the directory | Yes | reported as **ungoverned** in the census, not a failure — §10.3 |
| The allowlist is unparseable or an entry lacks `reason`/`owner` | Yes | audit fails; `check:rendered-scope` already fails on this and the audit must not disagree with it |
| Authorization / RLS / network / concurrent writer | **No** | a static audit over source and two JSON files |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the audit run on the current tree, then it prints one row per `.tsx` in
  `src/design-system/mantine/patterns/`, each with exactly one governance state, its rendered-edge count, its
  distinct-consumer count and its own-Story status; and the three state totals are stated. Quote the totals and
  reconcile them against §2's 5/11/17, explaining any difference.
- **AC2 [R1]** — Given the same run, then the pattern file count is derived from the directory, and the row set
  matches `Get-ChildItem` on that directory. Quote both counts.
- **AC3 [R2]** — Given the 11 allowlisted paths, then each carries a shared verdict with its consumer count and a
  Story verdict with the story file that imports it. Quote all eleven rows. Name any path that fails either half —
  and if none does, say so explicitly rather than leaving it implied.
- **AC4 [R3]** — Given `npm run audit:design-system-patterns` on the clean tree, then it exits **0** and prints the
  census. Quote the command, the totals and the exit code.
- **AC5 [R3]** — Given a temporary probe that breaks one listed path's premise — remove an allowlist entry's path
  from disk, or point the entry at a path with no Story; name which you used — then the audit exits non-zero naming
  that path and the half of the premise that failed. Restore, and retain **one** witness transcript carrying the
  `git hash-object` before, the same value after, and the explicit
  `git --no-optional-locks status --porcelain -- <path>` output.
- **AC6 [R4]** — Given `docs/sessions/evidence/task817/R1_AC16-favoritesshell-report.txt` after the change, then it
  carries one line marking it superseded and naming `R1_favoritesshell-final-report.txt`, and every other line is
  byte-identical. Quote the added line and `git diff --stat` for that file.
- **AC7 [R4]** — Given `scripts/map-changed-surfaces.mjs` after the change, then the skip-set exists as **one**
  literal with the other derived from it, and `npm run check:surface-census:changed:verify` still passes all 8 arms.
  Quote the changed lines and the self-test's arm count. And given the `ui-imports` and duplicate-blocked-line notes,
  then each is either fixed — quote the diff — or recorded in
  `docs/design-system-pattern-ownership.md` with the reason it stands; state which for each.
- **AC8 [R4, R5]** — Given `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes" after the
  change, then it carries the `Get-Content -Raw` hazard with its mitigation, the hash-in-the-gate-block rule, and the
  sprint's transferable paragraph naming its four landed commands. Quote all three. No other section of that file
  changes.
- **AC9 [R6]** — Given `docs/design-system-pattern-ownership.md`, then it states the three bounded options of §5
  with the measured input each needs, and records that the decision is the owner's and unmade. No allowlist or
  manifest file is modified: quote `git diff --stat` for both, empty.
- **AC10 [R7]** — Given the final tree, then `npm run check:rendered-scope`, `npm run check:rendered-scope:verify`,
  `npm run check:story-coverage`, `npm run check:surface-census:changed` and its `:verify` all reproduce their
  pre-task counts and exit codes; and `git diff --stat` is empty for the six named unmodified files. Capture the
  baseline **before writing any code**; quote both sets.

**GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.** AC6's and AC10's
"byte-identical"/"empty diff" are scoped to named files this task deliberately does not otherwise change, captured as
measured before/after pairs.

## 13. QA profile and verification plan

**`Q2 Standard UI`** — the sprint's own table sets Q2 for this task, and it holds: no rendered UI changes, no new
blocking gate, no change to any gate's behaviour. `docs/qa-profiles.md` reserves Q4 for a **claimed gate** with
planted-failure proof; the audit command is deliberately not wired into CI (§5), so Q4 does not apply. **If the
owner's §5 decision turns the audit into a blocking gate, that is a separate task at Q4.** AC5's planted probe is
kept anyway — a command that cannot fail is not an audit. `docs/critical-flow-registry.md` scanned: `scripts/` and
`docs/` only, no route, action, RLS policy or auth path.

### 13.1 Baseline first

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task816"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:report
npm.cmd run check:story-coverage
npm.cmd run check:surface-census:changed:verify
Get-ChildItem src\design-system\mantine\patterns -Filter *.tsx | Measure-Object
```

Expected: `win32`; the Node version; the project root; the worktree state; `check:rendered-scope` exit 0 at 29
baselined / 0 new / 0 stale; the frontier report with its `allowlisted` block, exit 0; `check:story-coverage` at its
current counts; the changed-surface self-test's 8 arms; and the live pattern-file count. **Return all of it before
writing code** — it is AC10's baseline and R1's input.

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
node.exe --check scripts\audit-design-system-patterns.mjs
node.exe --check scripts\map-changed-surfaces.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/audit-design-system-patterns.mjs scripts/map-changed-surfaces.mjs
npm.cmd run audit:design-system-patterns
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: both `--check` silent exit 0 · typecheck 0 · eslint 0 errors · the audit exit 0 with its totals · every
existing gate reproducing §13.1 · `check:stories` 0 violations · `build` **exit 0**, mandatory under
`agent-contract` clause 9 · both hygiene gates clean. **Record every exit code inside its own transcript, and the
`git hash-object` of every changed file in this block** — Tasks 818 and 819's two evidence lessons, and two of the
notes this task is closing.

### 13.3 The planted arm

AC5's probe, run and restored under §10.5's one-transcript witness rule, touching a data file or a scratch path only.

### 13.4 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline including the live pattern-file count · AC1's totals
reconciled against §2's 5/11/17 with any difference explained · AC2's two counts · AC3's eleven rows and the explicit
statement of which paths fail the premise, or that none does · AC4's exit code · AC5's probe and its single witness ·
AC6's added line and diff · AC7's changed lines, the self-test arm count, and the per-note fixed-or-recorded
disposition · AC8's three quoted texts · AC9's two empty diffs · AC10's before/after pairs · every command with its
real exit code and transcript path · the `git hash-object` of every changed file · assumptions · deviations ·
limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `PARTIALLY IMPLEMENTED`. §5's owner decision does **not**
block: measure its inputs, record them, and continue. Do not self-approve; Sonnet runs, emits and suggests no
mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this task change which patterns are enrolled or allowlisted? | **No** — R6/AC9. It measures and asks. Implementing the owner's answer is a separate task, and §8 says so. |
| Does it add a fifth blocking gate? | **No** — §5's stated assumption and §13's Q2 justification. The audit is a command, deliberately unwired. |
| Is the 5/11/17 split taken from this kickoff? | **No** — §10.2 and AC1/AC2 require deriving it from the directory and reconciling against §2, explaining any difference. |
| Could the audit be satisfied by weakening it? | Yes — by relaxing "shared" or accepting a parent's Story. R2 names both halves with their measurement source, and AC3 requires the explicit "none fails" statement rather than silence. |
| Are the inherited notes actually closed, or just listed? | R4/AC7 requires each to be **fixed with a diff** or **recorded with the reason it stands**, per note. |
| Is sprint exit criterion 5 in the right task? | It is folded in because R4 already opens that file. §5 and R5 both say the owner may pull it out. |

## 16. Git handoff — task design (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace does not start
after the 2026-09-08 Windows update, so this block is built from the paths this task design wrote. Check `git status`
before pasting. If `.git/index.lock` exists and no Git process is running, delete that exact file, confirm it is gone,
and re-run `git status --short` before staging.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_816_Design_System_Pattern_Ownership_And_Audit.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task816): kickoff filed - design-system pattern census, the re-measure command, and the governance decision"
```

No `git push` — a task-design handoff is never authorization for one.
