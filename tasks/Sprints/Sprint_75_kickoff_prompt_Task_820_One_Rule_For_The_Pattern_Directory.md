# Task 820 — One rule for the pattern directory: enrol the 28, retire the 11, and make the rule self-enforcing

Sprint 75 · **P0** · QA profile **Q4**

**Status: `NEEDS REVISION` — Revision 2 of the review, 2026-09-11; owner decisions recorded verbatim in §17.7 the
same day. Read §17, then §17.6 and §17.7, which supersede §17.2. Revision 0's implementation is retained: R1-R5,
R7-R10 verified and must not be redone. R12 is closed. R11/AC15 is BLOCKED on Task 813 (owner select (A2)).
R13/AC17 is executable now and is the only executor work owed. AC3 stays `NOT VERIFIABLE` pending owner visual QA.**

## 1. Mode and task type

`IMPLEMENTATION` — governance. Enrol every remaining design-system pattern, add the one missing canonical Story,
retire the eleven transitional tier-3 allowlist entries, bring both blocking gates' baselines back to a true state,
and add a parity check that makes the rule enforce itself. No product UI behaviour changes.

## 2. Objective

Owner decision 5 (2026-09-11, quoted verbatim in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`
and in `docs/design-system-pattern-ownership.md` §4):

> **Decision — select (c), 2026-09-11.** Every current and future `.tsx` file under
> `src/design-system/mantine/patterns/` is governed as an enrolled design-system pattern. The eleven Task 816 tier-3
> allowlist entries are transitional and must be removed by a separate implementation task; no baseline is approved
> for the three single-consumer paths. That task must enrol the remaining 28 paths, add a canonical Story for
> `responsiveBottomSheet.tsx` before enrolment, measure the expanded frontier before modifying it, and add a
> CI-safe, planted-failure parity check that fails when a pattern-directory file is not enrolled. It resolves the
> audit's current red state by eliminating the invalid tier-3 premise, not by weakening or baselining the audit.

Task 816 measured the state this resolves: **5** enrolled, **11** tier-3 allowlisted, **17** in neither — a line
drawn by which surfaces happened to be enrolled on the day Task 812 first walked the frontier. After this task there
is one rule: a file in that directory is enrolled, and a check fails when one is not.

## 3. Verified context — measured 2026-09-11, re-measure at execution

### 3.1 The work is smaller than the numbers suggest

`FACT`, from `docs/sessions/evidence/task816/Rev0_audit-json.json`, read this session — **32 of the 33 patterns
already have their own canonical Mantine Story.** The single exception is `responsiveBottomSheet.tsx`
(`ownStory: false`). So decision 5's Story work is **one file**, not twenty-eight, and `check:story-coverage` —
whose whole admission test is "a canonical Mantine story imports this exact path" — will accept the other 27 the
moment they are enrolled.

`FACT` — `responsiveBottomSheet.tsx` is a **mixed module**, which is why it was never storied. Read this session, it
exports: `bottomSheetDrawerStyles` (a style object, `:11`), `useResponsiveDropdown` (a hook, `:50`), `DragHandle`
(`:69`), `ResponsiveBottomSheetProps` (`:92`), `ResponsiveBottomSheet` (`:127`), `SheetContentProps` (`:217`) and
`SheetContent` (`:235`). It is also the **most-consumed file in the directory after `MantineCombobox` and
`MantineListingCardTrack`: 8 distinct consumers.** The kickoff does not tell you which export to render — R2 does,
and it matters, because `check:story-coverage` is satisfied by a story importing the **path** while GR-3 is about
proving the component.

### 3.2 The two blocking gates this task moves under

`FACT` — `check:rendered-scope` (Task 818, blocking) walks **every manifest entry as a root**. Enrolling 28 patterns
therefore adds 28 new roots, and each one's own rendered local imports become frontier edges that did not exist
before. Its baseline (`scripts/rendered-scope-baseline.json`, `version: 1`, 29 edge keys) will not contain them, so
they are **new** and the gate fails until they are recorded. Its `--update-baseline` **refuses to record a new
`tier2-legacy-primitive` edge** (818 R4) — which is the one thing that could stop this task dead.

`FACT`, and it is the measurement that says this is safe — **zero** pattern-directory surfaces carry a
`tier2-legacy-primitive` block in Task 819's 690-block `scripts/surface-census-baseline.json`. The whole-`src`
per-surface census already covered these files as surface roots, and none of them imports a `src/components/ui/*`
primitive. `INFERENCE` from that: enrolling them should add tier-1 edges only, and `--update-baseline` should accept
all of them. **Re-measure before touching anything — §13.1 — because if even one of the 28 does import a legacy
primitive, the refusal fires and this task stops for an owner decision rather than working around it.**

`FACT` — `check:surface-census:changed` (Task 819, blocking) carries its own baseline of **690** blocks across 268
surfaces, keyed `"<surface> :: <node> :: <reasonCode>"`. Enrolling a pattern flips its census row from `manifest:no`
to `manifest:yes`, so every `tier1-unenrolled-or-unstoried` block naming an enrolled pattern **stops being
produced** — and a baseline entry whose surface this run censuses and whose block no longer appears is **stale**,
which fails. Both baselines must land in the same change as the enrolment.

### 3.3 The allowlist after this task

`FACT` — `scripts/rendered-scope-allowlist.json` holds 13 entries: the 11 with `owner: "816"` and
`ListingFeatureIcon` / `FavoriteButton` with `owner: "813"`. Decision 5 retires the 11; the 2 remain, because they
are owned outside `src/design-system/`. An allowlist entry whose path becomes enrolled produces no frontier edge, so
leaving one in place would make it **stale** and fail the gate — removal is not optional tidying, it is required by
the gate's own rule.

`FACT` — three of the 11 (`MantineCopyIdButton`, `MantineListingCardPattern`, `MantineListingDetailPattern`) have
exactly **1** consumer each, which is why `npm run audit:design-system-patterns` exits 1 today. Decision 5 resolves
that by enrolment: the manifest has no "shared" admission test, so the invalid premise disappears with the entry.
**No baseline, no reworded `reason`, no relaxed premise is available** — the owner said so explicitly.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Decision 5 | Re-derive the directory census at execution: every `.tsx` under `src/design-system/mantine/patterns/`, its current governance state, and its own-Story status. §3's 33 / 5 / 11 / 17 / 32-storied figures are a dated measurement to reconcile against and explain, never to copy. | **P0** | AC1 | Confirmed |
| **R2** | Decision 5 | `responsiveBottomSheet.tsx` gets a canonical Mantine Story **before** it is enrolled. The Story renders `ResponsiveBottomSheet` as the real production component with `SheetContent` and `DragHandle` in their real composition — not a stand-in — and covers its open and closed states at a mobile and a desktop width, per GR-3 and `agent-contract` 16c. Its `meta.title` satisfies `isCanonicalMantineTitle`. | **P0** | AC2, AC3 | Confirmed |
| **R3** | Decision 5 | **Measure the expanded frontier before modifying it.** With the 28 enrolled in a scratch copy of the manifest — or by an equivalent read-only projection that does not write the tracked file — record how many new frontier edges appear, their tiers, and whether any is `tier2-legacy-primitive`. Report that before changing any tracked file. | **P0** | AC4 | Confirmed |
| **R4** | Decision 5 | `scripts/mantine-migration-scope.json` gains the **28** remaining pattern paths: **38 → 66**, not 71 — five are already enrolled. Report the before and after counts and the 28 added paths. | **P0** | AC5 | Confirmed |
| **R5** | Decision 5, §3.3 | The **11** `owner: "816"` entries are removed from `scripts/rendered-scope-allowlist.json`, leaving exactly the **2** `owner: "813"` entries. No entry is reworded, and no new entry is added. | **P0** | AC6 | Confirmed |
| **R6** | §3.2 | Both blocking baselines are brought to a true state **in the same change**, each through its own `--update-baseline`, never by hand: `scripts/rendered-scope-baseline.json` records the new tier-1 frontier edges; `scripts/surface-census-baseline.json` drops the blocks that enrolment eliminated. Neither writer's tier-2 refusal is bypassed, and no tier-2 entry is added to either. | **P0** | AC7, AC8 | **Revision 1: AC7 verified; AC8 NOT met — superseded by §17.1 / R11 / AC15. Do not re-attempt R6's second half from this row; §17.1 is the route.** |
| **R7** | Decision 5 | A **parity check** fails when a `.tsx` under `src/design-system/mantine/patterns/` is not in the manifest, and passes when every one is. It is CI-safe — no server, no browser, no network, no write to a tracked file — wired into the `governance` job as a **blocking** step, and carries a self-test with a **planted failure** proving it can fail, in the shape the four existing `*:verify` steps use. The exit decision comes from one pure function the real run and the self-test both call. | **P0** | AC9, AC10, AC11 | Confirmed |
| **R8** | Decision 5 | `npm run audit:design-system-patterns` exits **0** after this task, because the three invalid tier-3 premises no longer exist — not because the audit changed. `scripts/audit-design-system-patterns.mjs`'s logic is **not modified**; if the audit still fails, that is a finding to report, never a reason to edit it. | **P0** | AC12 | Confirmed |
| **R9** | Sprint exit 2 | `docs/golden-rules.md`'s `Enforcement status` table, `docs/storybook-governance.md` and `docs/design-system-pattern-ownership.md` record the new rule and the parity check. No GR-n rule body, no `Command` block, no receipt string changes, and nothing claims an enforcement state the measurements do not support. | P1 | AC13 | Confirmed |
| **R11** | Revision 1, §17.1 | `scripts/surface-census-baseline.json` carries **20 entries across 15 surfaces** as measured 2026-09-11 (**18 across 13** once Task 813 lands — §17.6's arithmetic update; re-derive at execution) whose node is now an enrolled, storied pattern and whose `reasonCode` is `tier1-unenrolled-or-unstoried`. `check-surface-census.mjs:544` emits that block only when `!(n.manifest && n.story)`, so none of the 20 can be produced again; `check-surface-census-changed.mjs:155` marks a baseline entry `stale` the first time its surface is censused, and `evaluateGateExitCode` (`:243`) turns one stale entry into exit 1. Resolve per the owner decision in §17.2 so that no future PR's diff inherits a red blocking gate it did not cause. | **P0** | AC15 | **BLOCKED on Task 813 — owner decision §17.6 select (A2), recorded verbatim in §17.7. Do not re-attempt until Task 813 is `APPROVED`; then re-run per §17.7 item 3.** |
| **R12** | Revision 1, §17.3 | `docs/sessions/2026-09-11-task820-one-rule-for-the-pattern-directory.md` §14 and the `Limitations` bullet state that `check:file-integrity --all` fails on **one** file, `docs/sessions/evidence/task778/plant-T6.txt`. Its own transcript (`Rev2_file-integrity_all.txt`) names **57** files across `task765/`, `task767/` and `task778/`. Correct both statements to the measured 57 and name the three evidence directories. Do not fix the 57 files — they stay out of scope. | P1 | AC16 | **VERIFIED — closed by Revision 3; session log line 215 and its Limitations bullet both read 57 / task765(24) / task767(1) / task778(32). Re-checked against the transcript this turn.** |
| **R13** | Revision 2 of the review, §17.6 | `docs/sessions/2026-09-11-task820-one-rule-for-the-pattern-directory.md` is a GR-5 state artifact and currently contradicts reality on three counts: its `Status:` line still reads `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; its last `Assumptions, deviations, limitations` bullet still reads "No `CONFLICT`/`BLOCKED — OWNER DECISION REQUIRED` fired"; and it carries no Revision 3 record at all, while its `Files Changed` row for `scripts/surface-census-baseline.json` still describes only the Revision 1 no-op. Bring all three to the measured state and index the `Rev3_*` transcripts. | **P0** | AC17 | **Open — executor** |
| **R10** | 812 R9 precedent | `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`, `scripts/check-surface-census-changed.mjs`, `scripts/map-changed-surfaces.mjs` and `scripts/audit-design-system-patterns.mjs` are **not modified**. Every existing gate and self-test passes with its counts explained by this task's changes and nothing else. | **P0** | AC14 | Confirmed |

## 5. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated)** — the parity check is a **new small script**
  (`scripts/check-pattern-enrolment.mjs`, `npm run check:pattern-enrolment`) rather than an arm inside
  `audit-design-system-patterns.mjs`. Reason: R8 forbids touching the audit, the two ask different questions
  (is the premise still true vs is every file enrolled), and a blocking CI step should not share an exit code with an
  audit that is deliberately unwired. Rejected alternative: a flag on the audit, which couples a blocking gate to a
  command the owner chose not to block on.
- **`UNKNOWN`, and R3 resolves it before anything is written** — the size and tier composition of the expanded
  frontier. §3.2's zero-tier-2 measurement says it should be tier-1 only; it is an inference from Task 819's
  baseline, not a direct measurement of this change.
- **`CONFLICT` to surface, not to resolve alone.** If R3's measurement shows **any** new
  `tier2-legacy-primitive` edge, `--update-baseline` will refuse it (Task 818 R4) and the blocking gate will be red
  with no sanctioned way to record it. Stop for `BLOCKED — OWNER DECISION REQUIRED`, name the pattern and the
  primitive, and do not work around it: the options are the owner's — migrate that primitive first, defer that one
  pattern's enrolment, or something else — and none of them is an executor's call.
- **`ASSUMPTION` (reversible, stated)** — "every current and future `.tsx`" includes `responsiveBottomSheet.tsx`
  despite its lowercase name and mixed exports, because the owner named it explicitly. It excludes `index.ts` (not
  `.tsx`), `__tests__/`, and `.module.css`. State the file list you derived and the rule you applied.
- **Out of scope:** migrating, restyling or changing the behaviour of any pattern · the 2 Task 813 allowlist
  entries · editing any existing gate's logic · Tasks 815, 797, 743.

## 6. Pre-read rule bundle

`docs/golden-rules.md` in full, GR-1 · GR-2 · GR-3 and the `Enforcement status` table · `docs/agent-contract.md`
clauses **9, 13, 16c, 16d** · `docs/qa-profiles.md` (Q4) · `docs/design-system-pattern-ownership.md` in full,
decision 5 included · `scripts/mantine-migration-scope.json` · `scripts/rendered-scope-allowlist.json` ·
`scripts/check-rendered-scope.mjs` — its root walk, its baseline writer and the tier-2 refusal ·
`scripts/check-surface-census-changed.mjs` — its `carried`/`stale` split and its baseline writer ·
`scripts/check-story-coverage.mjs` — the admission test the 28 must satisfy · `scripts/lib/mantine-story-scope.mjs` ·
`src/design-system/mantine/patterns/responsiveBottomSheet.tsx` in full · one existing pattern Story as the shape to
follow, e.g. `src/stories/mantine/primitives/Drawer.stories.tsx` · `.github/workflows/governance-pr.yml`, the
`governance` job · `docs/storybook-governance.md` §15.5-§15.7 · this kickoff.

## 7. Scope

- **New:** `src/stories/…/ResponsiveBottomSheet.stories.tsx` (R2 — place it beside its siblings and say which
  directory and title you chose) · `scripts/check-pattern-enrolment.mjs` and its two `package.json` entries.
- **Edited:** `scripts/mantine-migration-scope.json` (+28) · `scripts/rendered-scope-allowlist.json` (−11) ·
  `scripts/rendered-scope-baseline.json` and `scripts/surface-census-baseline.json` (both via their own
  `--update-baseline`) · `.github/workflows/governance-pr.yml` (two steps) · `docs/golden-rules.md`
  (`Enforcement status` table only) · `docs/storybook-governance.md` · `docs/design-system-pattern-ownership.md`.
- **Written:** `docs/sessions/evidence/task820/*` · `docs/sessions/2026-09-11-task820-one-rule-for-the-pattern-directory.md` ·
  the concise `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5's list. In particular: **no pattern's source is edited**. If enrolling one would require changing
it, that is the `CONFLICT` above, not a small fix.

## 9. Current and required behavior

**Before.** 33 patterns, three governance states, 11 transitional allowlist entries of which 3 rest on a premise the
audit shows is false, and `npm run audit:design-system-patterns` exits 1.

**After.** Every `.tsx` in the directory is enrolled; the allowlist holds only the 2 entries owned outside the
design system; both blocking baselines are true; `npm run check:pattern-enrolment` fails if a pattern file is ever
added without enrolment; and the audit exits 0 because its finding was fixed, not silenced.

## 10. Implementation requirements

1. **Order is load-bearing.** Story for `responsiveBottomSheet.tsx` → R3's read-only frontier measurement →
   manifest +28 → allowlist −11 → both baselines → parity check → CI. Enrolling before the Story exists makes
   `check:story-coverage` red on that one path; measuring after the manifest changes destroys the "before" number
   decision 5 asked for.
2. **Never hand-edit a baseline.** Both are written by their own `--update-baseline`, which is also what keeps the
   tier-2 refusals intact.
3. **The parity check reads the directory, not a list.** A hard-coded set of 33 names would pass while the rule it
   enforces silently stops applying to file 34.
4. **Print the narrowing.** Per this sprint's own transferable rule, the parity check states on every run what it
   inspected and what it cannot see — a pattern added outside that directory, a `.ts` file, a file excluded by its
   own rule.
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file. **Never read a source or
   data file back through PowerShell's `Get-Content -Raw` without `-Encoding utf8`** — it has now corrupted a script
   and a data file in this sprint; read and write through Node for every plant-and-restore probe.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`.

## 11. Positive and negative flows

**Positive.** Someone adds a new pattern to the directory and opens a PR; `check:pattern-enrolment` fails until it
is enrolled and storied — the rule decision 5 chose, enforcing itself.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| A pattern file is not in the manifest | Yes | parity check fails naming it — R7 |
| A manifest entry points at a pattern path that no longer exists | Yes | parity check fails naming it; the directory is the source of truth in both directions |
| An enrolled pattern has no canonical Story of its own | Yes | `check:story-coverage` fails — unchanged behaviour, and why R2's Story comes first |
| A newly enrolled pattern renders an unenrolled component | Yes | new tier-1 frontier edge → recorded by `--update-baseline` — R6 |
| A newly enrolled pattern imports `@/components/ui/*` | Yes | `--update-baseline` **refuses** it → `BLOCKED — OWNER DECISION REQUIRED`, §5's `CONFLICT` |
| An allowlist entry survives for a now-enrolled path | Yes | stale → `check:rendered-scope` fails; R5 removes all 11 |
| `index.ts`, `__tests__/`, `.module.css` in that directory | Yes | excluded, with the rule stated in the parity check's own output |
| Authorization / RLS / network / concurrent writer | **No** | manifest, allowlist, two baselines, one Story and one static script |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the census re-derived at execution, then the file count, the three governance-state counts and
  the own-Story count are stated and reconciled against §3's 33 / 5 / 11 / 17 / 32, with any difference explained.
  Quote the totals.
- **AC2 [R2]** — Given the new Story, then its `meta.title` satisfies `isCanonicalMantineTitle`, it statically
  imports `src/design-system/mantine/patterns/responsiveBottomSheet.tsx`, and it renders `ResponsiveBottomSheet`
  with `SheetContent` and `DragHandle` in their real composition. Quote the title, the import line and the render.
- **AC3 [R2]** — Given the Story, then it covers the sheet open and closed at one mobile and one desktop width.
  Name the four tuples and how each is expressed.
- **AC4 [R3]** — Given the read-only projection with all 28 enrolled, then the new frontier edge count and their
  tiers are reported **before** any tracked file changed, and the `tier2-legacy-primitive` count among them is stated
  explicitly. Quote the measurement and the command that produced it. If that count is not zero, stop per §5.
- **AC5 [R4]** — Given `scripts/mantine-migration-scope.json` after the change, then it holds **66** entries, the 28
  added are exactly the pattern paths not previously enrolled, and no other entry changed. Quote the before/after
  counts and the added list.
- **AC6 [R5]** — Given `scripts/rendered-scope-allowlist.json` after the change, then it holds exactly the **2**
  `owner: "813"` entries, byte-identical to their pre-task content. Quote the file and its `git diff`.
- **AC7 [R6]** — Given `npm run check:rendered-scope` after both baselines are updated, then it exits **0** with
  `0 new` and `0 stale`, and its baselined count is stated against the previous 29 with the delta explained. Quote
  the scope block.
- **AC8 [R6]** — **Revision 1: superseded by AC15.** Revision 0 satisfied its literal text (gate exit 0, 8/8 arms,
  690 → 690 stated) while leaving the baseline factually false; a green diff-scoped run is not evidence that the
  ledger is true. Do not re-run this criterion as written.
- **AC15 [R11]** — *(count updated by review Revision 3 — see §17.6's arithmetic update: Task 813 already dropped 2
  of the original 20, so the expected starting point is **18 entries across 13 surfaces** against a **676**-entry
  baseline. Re-derive both at execution; never copy either figure.)* Given the final tree, then **zero**
  `scripts/surface-census-baseline.json` entries have a node
  that is present in `scripts/mantine-migration-scope.json` **and** carry `reasonCode`
  `tier1-unenrolled-or-unstoried` — or, where the owner chose §17.2 option (B), that count is stated exactly, each
  of the 15 surfaces is named, and the deferred breakage is carried as its own numbered backlog task. Quote the
  count, the command that produced it, and — for option (A) — the `--update-baseline` transcript that wrote it,
  with `check:surface-census:changed` and `check:surface-census:changed:verify` re-run to exit 0 / 8 arms afterwards.
- **AC17 [R13]** — Given the session log after the fix, then its `Status:` line states `PARTIALLY IMPLEMENTED — BLOCKED, OWNER DECISION REQUIRED (§17.6)`; a new `Revision 3` section records the base/head window, the raised `--max-changed-files`/`--max-surfaces` values and why, the two refused tier-2 blocks with their real transitive import path, and the byte-identical restore with both `git hash-object` values; the stale "No `CONFLICT` … fired" bullet is corrected; and the `Files Changed` row for `scripts/surface-census-baseline.json` states "touched and restored — net diff none". Quote the corrected `Status:` line and the corrected bullet.
- **AC16 [R12]** — Given the corrected session log, then its §14 row and its `Limitations` bullet both state **57**
  failing files and name `task765/`, `task767/` and `task778/`; quote both corrected lines against
  `Rev2_file-integrity_all.txt`.
- **AC9 [R7]** — Given `npm run check:pattern-enrolment` on the final tree, then it exits **0**, prints what it
  inspected and its cannot-see sentence. Quote the output.
- **AC10 [R7]** — Given a planted unenrolled pattern — add a scratch `.tsx` to the directory, or temporarily remove
  one path from the manifest; name which — then the check exits non-zero naming it. Restore, and retain **one**
  witness transcript carrying the `git hash-object` before, the same value after, and the explicit
  `git --no-optional-locks status --porcelain -- <path>` output.
- **AC11 [R7]** — Given `.github/workflows/governance-pr.yml` after the change, then a blocking
  `check:pattern-enrolment` step and its self-test step sit in the `governance` job with no `continue-on-error`, no
  `|| true`, no `exit 0` and no wrapper. Quote the hunk with the job name and the neighbouring steps.
- **AC12 [R8]** — Given `npm run audit:design-system-patterns` on the final tree, then it exits **0**, and
  `git diff --stat scripts/audit-design-system-patterns.mjs` is empty. Quote both.
- **AC13 [R9]** — Given the three documents after the change, then each records the new rule and the parity check,
  and no sentence claims an enforcement state the measurements do not support; GR-1's `Command` block, its receipt
  string and every GR-n rule body are byte-identical. Quote the changed rows and the byte-identity check.
- **AC14 [R10]** — Given the final tree, then `check:story-coverage` reports **66 covered / 0 unproven**;
  `check:rendered-scope:verify`, `check:surface-census:changed:verify` and `check:stories` all pass; and
  `git diff --stat` is empty for the five named unmodified scripts. Capture the baselines **before writing any
  code**; quote both sets.

**GR-4 AC AUDIT — 14 criteria; each states an observable property; absolutes: none.** AC5's `66`, AC6's `2` and
AC14's `66 covered / 0 unproven` are this task's defined outcome rather than assumptions about unrelated state —
`66 = 38 + 28` is decision 5's own arithmetic, corrected by the owner from the `38 → 71` this project's own
ownership document carried. AC7's and AC12's zero exits are the deliverable: the first is what recording the new
edges achieves, the second is what enrolment achieves by removing the invalid premise. AC6's and AC14's
"byte-identical"/"empty diff" are scoped to named files this task deliberately does not otherwise change.

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — this task adds a blocking CI gate, and `docs/qa-profiles.md` requires
planted-violation failure proof whenever a gate is claimed. It also moves both existing blocking gates' baselines,
which is release-affecting. One new Story is added, so its rendered proof is R2/AC3's four tuples rather than a full
visual matrix; no existing visible surface changes. `docs/critical-flow-registry.md` scanned: `scripts/`, one
workflow, one story and `docs/` — no route, action, RLS policy or auth path.

### 13.1 Baseline, and the measurement decision 5 asked for

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task820"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
Get-ChildItem src\design-system\mantine\patterns -Filter *.tsx | Measure-Object
npm.cmd run check:rendered-scope
npm.cmd run check:story-coverage
npm.cmd run check:surface-census:changed
npm.cmd run audit:design-system-patterns
```

Expected: `win32`; the Node version; the project root; the worktree state; the live pattern-file count;
`check:rendered-scope` exit 0 at 29 baselined / 0 new / 0 stale; `check:story-coverage` at 38 covered / 0 unproven;
the changed-surface gate exit 0; and the audit **exit 1** naming the three not-shared paths — that non-zero is the
state this task removes. **Return all of it, then do R3's projection and return that too, before changing any
tracked file.**

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
node.exe --check scripts\check-pattern-enrolment.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/check-pattern-enrolment.mjs
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
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

Expected: `--check` silent exit 0 · typecheck 0 · eslint 0 errors · the parity check and its self-test exit 0 · the
audit **exit 0** · `check:rendered-scope` exit 0 with 0 new / 0 stale · both self-tests passing every arm ·
`check:story-coverage` **66 covered / 0 unproven** · `check:stories` 0 violations · `build` **exit 0**, mandatory
under `agent-contract` clause 9 · both hygiene gates clean. **Record every exit code inside its own transcript and
the `git hash-object` of every changed file in this block.**

### 13.3 The planted arm

AC10's probe, run and restored under §10.5's one-transcript witness rule, touching a scratch path or the manifest
only — never a pattern's source.

### 13.4 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline with the live pattern count · **R3's pre-change frontier
projection with its tier breakdown and the explicit tier-2 count** · AC1's reconciled totals · AC2's title, import
and render · AC3's four tuples · AC5's before/after counts and the 28 added paths · AC6's allowlist diff · AC7's and
AC8's scope blocks with both baseline deltas explained · AC9's output · AC10's probe and its single witness ·
AC11's workflow hunk · AC12's exit 0 and empty diff · AC13's quoted rows and byte-identity check · AC14's
before/after pairs and five empty diffs · every command with its real exit code and transcript path · the
`git hash-object` of every changed file · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or
`BLOCKED — OWNER DECISION REQUIRED` if §5's `CONFLICT` fires. Do not self-approve; Sonnet runs, emits and suggests no
mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Is the audit's red state fixed or silenced? | **Fixed** — R8/AC12. Its logic is untouched and its diff must be empty; enrolment removes the premise. Decision 5 forbids a baseline for those three. |
| Is the manifest arithmetic right? | **38 → 66**, 28 added. The `38 → 71` in `docs/design-system-pattern-ownership.md` §4 double-counted the 5 already enrolled; the owner caught it and it is corrected in that file with the error recorded. |
| How much Story work is there really? | **One file.** 32 of 33 are already storied — §3.1 — and `responsiveBottomSheet.tsx` is a mixed module, which is why it is the exception. |
| What could stop this task? | A newly enrolled pattern importing a legacy primitive: `--update-baseline` refuses it and the gate stays red. Measured zero today from Task 819's baseline; §5's `CONFLICT` and §13.1 make it the first thing checked. |
| Does the parity check read a list? | **No** — §10.3. It reads the directory, or it stops enforcing the rule at file 34. |
| Are both baselines handled? | Yes — R6/AC7/AC8, each through its own writer, in the same change, with neither tier-2 refusal bypassed. |

## 16. Git handoff — task design (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace does not start
after the 2026-09-08 Windows update, so this block is built from the paths this task design wrote. Check `git status`
before pasting. If `.git/index.lock` exists and no Git process is running, delete that exact file, confirm it is gone,
and re-run `git status --short` before staging.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task820): kickoff filed - enrol the 28, retire the 11 transitional entries, add the pattern-enrolment parity check"
```

No `git push` — a task-design handoff is never authorization for one.

## 17. Revision 1 — orchestrator review, 2026-09-11

Revision 0 is `NEEDS REVISION`. R1-R5 and R7-R10 were verified against their transcripts and the final tree and are
**not** to be redone: the manifest holds 66 entries (33 of them the full pattern directory), the allowlist holds
exactly the two `owner: "813"` entries, `responsiveBottomSheet.tsx`'s canonical Story imports the exact path and
renders `ResponsiveBottomSheet` + `SheetContent` with `DragHandle` rendered internally at
`responsiveBottomSheet.tsx:144`, the parity check and its five-arm self-test are wired blocking into the
`governance` job with no `continue-on-error`, and the audit exits 0. The barrel-import discovery in Revision 0 §2
is correct and its 27 one-line import fixes were re-derived directly; that work stands.

Three things are open.

### 17.1 The finding — `scripts/surface-census-baseline.json` was not brought to a true state (P2, blocking)

`FACT`, read this turn from the file: 20 baseline entries across **15** surfaces name a node that is now in
`scripts/mantine-migration-scope.json`, with `reasonCode` `tier1-unenrolled-or-unstoried`:

```
2  src/app/[locale]/layout.tsx                                            (MantinePopover, responsiveBottomSheet)
1  src/app/admin/users/page.tsx                                           (MantineDataTableToCards)
2  src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx
1  src/design-system/mantine/patterns/MantineAppShellFoundation.tsx
1  src/design-system/mantine/patterns/MantineAuthFormPattern.tsx
1  src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx
1  src/design-system/mantine/patterns/MantineFormSectionStack.tsx
2  src/design-system/mantine/patterns/MantineNavigationMenu.tsx
1  src/design-system/mantine/patterns/MantineNotificationPattern.tsx
1  src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx
1  src/design-system/mantine/patterns/MantineProgress.tsx
1  src/design-system/mantine/patterns/MantineResponsiveActionFooter.tsx
2  src/design-system/mantine/patterns/MantineSelect.tsx
2  src/design-system/mantine/patterns/MantineTooltip.tsx
1  src/design-system/mantine/patterns/MantineTwoColumnForm.tsx
```

`FACT`, read this turn from the scripts: `check-surface-census.mjs:544` emits `tier1-unenrolled-or-unstoried` only
under `if (!(n.manifest && n.story))`. All 33 patterns are now enrolled and storied (`check:story-coverage` 66/0,
`audit:design-system-patterns` `story:yes` for all 33), so **none of the 20 blocks can be produced again**.
`check-surface-census-changed.mjs:155` pushes a baseline entry into `staleKeys` the moment
`censusedSurfaces.has(surfaceOfKey(key))`, and `evaluateGateExitCode` (`:243`) returns 1 on one stale key.

`CONTRADICTION` — Revision 0's session log §8 says "It will become `stale` (and get dropped) the first time a
future PR's diff actually touches that surface. This is the gate behaving as designed, not a defect." Becoming
stale is not being dropped: it is `FAIL  N stale baseline entr(ies)` and exit 1 (`check-surface-census-changed.mjs:586-592`).
The first unrelated PR that touches `src/app/[locale]/layout.tsx` — or any of the other 14 surfaces — gets a red
blocking governance gate for debt it did not create. That is precisely what §3.2's "Both baselines must land in
the same change as the enrolment" and R6 exist to prevent, and the `--update-baseline` Revision 0 ran was a 690 →
690 no-op because it censused zero surfaces.

### 17.2 `STOP — OWNER DECISION REQUIRED`

**ANSWERED 2026-09-11 — owner selected (A). Verbatim text in §17.7. Kept for the record; the live route is §17.6 + §17.7.**

**The decision:** how is `scripts/surface-census-baseline.json` brought to a true state, given that its only
sanctioned writer is diff-scoped and R10 forbids editing `check-surface-census.mjs`,
`check-surface-census-changed.mjs` and `map-changed-surfaces.mjs`?

- **(A) Widen the writer's diff window, in this task.** `check-surface-census-changed.mjs` already accepts
  `--base <ref> [--head <ref>]` (`:29-31`, `:75-76`). Choose a `--base` old enough that the 15 surfaces' own files
  appear in the diff, run `--update-baseline` once, and re-run the gate and its self-test. Changes: the 20 false
  entries disappear and every other surface that base..head reaches is re-measured and re-recorded. Verifies with
  AC15 plus a stated before/after entry count and an explicit list of every entry added or removed, so the wider
  re-measurement is inspectable rather than incidental. Risk to state plainly: this rewrites more of the ledger
  than this task measured, and a `tier2-legacy-primitive` block anywhere in that window will make the writer
  refuse — if it refuses, stop and report, do not narrow the window to get past it.
- **(B) Accept the deferred breakage, in the open, as a numbered task.** Leave the baseline as it is, and file a
  new backlog task (next free number) whose whole content is these 20 entries and the 15 surfaces, so the next PR
  to hit a red gate on `layout.tsx` finds the explanation already written. Verifies with AC15's option-(B) branch.
  Changes: no baseline write in this task; the red gate still happens, but to a named, expected task instead of a
  surprised author.
- **(C) Something else the owner names** — e.g. a separate task that adds a whole-`src` baseline writer, which
  would require lifting R10 for one script and is therefore not an executor's call.

Sonnet: do not choose. Return `BLOCKED — OWNER DECISION REQUIRED` if you re-enter this task before the owner has
answered in writing.

### 17.3 The second finding — a false statement in a committed state artifact (P1)

R12/AC16. `Rev2_file-integrity_all.txt` lists **57** files failing `check:file-integrity --all`, across
`docs/sessions/evidence/task765/` (24), `docs/sessions/evidence/task767/` (1) and `docs/sessions/evidence/task778/`
(32 — `plant-T6.txt` is one of them). The session log names only `plant-T6.txt`, and the completion report repeated
it. Correct the two sentences to the measured number and directories. The 57 files themselves remain out of scope
and are not to be touched.

### 17.4 Still owed before any approval — not a defect

AC3's four `ResponsiveBottomSheet` tuples are `OWNER VISUAL QA REQUIRED` and have no recorded owner result. Under
the owner's 2026-09-03 rule (`screenshots:assert` retired) the visual criterion stays `NOT VERIFIABLE` until the
owner has accepted or returned each of `(Default — ClosedSection, en, 390)`, `(Default — OpenedSection, en, 390)`,
`(Default — ClosedSection, en, 1440)`, `(Default — OpenedSection, en, 1440)`. No executor action.

### 17.5 Review limitation, stated

This review ran from the Cowork session, whose Linux workspace cannot mount the repository after the 2026-09-08
Windows update, so **no command and no `git` invocation was run by the reviewer**. Every `FACT` above comes from
reading the current file content on disk (kickoff, session log, all 39 evidence transcripts, both baselines, the
manifest, the allowlist, `check-pattern-enrolment.mjs`, `check-surface-census.mjs`,
`check-surface-census-changed.mjs`, the workflow, the new Story and a sample of the 27 edited Stories). Four
Revision 0 claims rest on `git` output the reviewer could not reproduce and are recorded `UNVERIFIED`, not accepted:
the five named scripts' empty `git diff --stat`; `audit-design-system-patterns.mjs`'s empty diff; the manifest's
"pure append, byte-identical prefix"; and GR-1's `Command` block / receipt string byte-identity in
`docs/golden-rules.md`. The owner-native commands for those are in the review response's `Next actions — owner`.

### 17.6 Revision 2 of the review — option (A) was run and hit a NEW tier-2 refusal (supersedes §17.2)

**ARITHMETIC UPDATE, 2026-09-11 (review Revision 3, after Task 813's implementation).** Task 813's own
`--update-baseline` run — `docs/sessions/evidence/task813/R7_03_surface-census-changed-update-baseline.txt`, read this
turn — censused 16 surfaces and took `scripts/surface-census-baseline.json` from **690 to 676** entries: 15 stale
dropped, 1 new tier-1 block baselined. **Two of §17.1's 20 entries were among the 15 dropped**:

```
src/app/[locale]/layout.tsx :: src/design-system/mantine/patterns/MantinePopover.tsx        :: tier1-unenrolled-or-unstoried
src/app/[locale]/layout.tsx :: src/design-system/mantine/patterns/responsiveBottomSheet.tsx :: tier1-unenrolled-or-unstoried
```

So once Task 813 is committed, §17.1's finding is **18 entries across 13 surfaces**, not 20 across 15, and the
baseline this task reconciles starts at **676**, not 690. AC15 must be measured against that, not against the older
figure — and it must be **re-derived at execution anyway**, because Task 813's own numbers are themselves a dated
measurement. The other 13 entries dropped by 813 were `AppImage` tier-2 blocks, which were never part of §17.1's set.

**ANSWERED 2026-09-11 — owner selected (A2). Verbatim text and the binding order in §17.7.**

Executor Revision 3 executed §17.2 option (A). Verified independently this turn:

- `FACT` — the widened window is `--base 02d975f945159df38c23a0caab43e1c7a96faa58 --head 794403a8b9cd416786310703997b17303876b52f`,
  run with `--max-changed-files 4991 --max-surfaces 193`. All 15 §17.1 surfaces were included, 0 missing
  (`Rev3_03_dry-run-mapping.txt`, `Rev3_04_update-baseline.txt`). No script logic was edited — R10 intact.
- `FACT` — `--update-baseline` exited 1, refusing **2 new `tier2-legacy-primitive` blocks**:
  `MantineListingDetailPattern.tsx :: src/components/ui/AppImage.tsx` and
  `MantineListingGalleryPattern.tsx :: src/components/ui/AppImage.tsx` (`Rev3_05_tier2-refusal-and-restore.txt`).
- `FACT` — the partial write was not kept. `scripts/surface-census-baseline.json` is byte-identical to its pre-run
  state: `git hash-object` `bfa1076f3ba97fea44f708c14a226164a014df24` before and after, and independently recomputed
  from the file's current 123 125 bytes this turn. It still holds 690 blocks, and §17.1's 20 entries / 15 surfaces
  are unchanged — the R11 finding stands exactly as filed.

`CORRECTION to the executor's wording, and it changes the decision.` Neither pattern imports `AppImage` directly.
Read this turn:

```
MantineListingGalleryPattern.tsx:6   import { LightboxView } from '@/modules/listings/components/LightboxView'
LightboxView.tsx:6                   import { AppImage } from '@/components/ui/AppImage'   (rendered :133, :165)
MantineListingDetailPattern.tsx:6    import { MantineListingGalleryPattern } from './MantineListingGalleryPattern'
```

`MantineListingDetailPattern.tsx` contains zero `@/components/ui/*` imports and says so in its own header comment at
`:116`. The census is transitive, so both surfaces reach `AppImage` through **one shared node, `LightboxView.tsx`** —
which is the same single new tier-1 frontier edge Revision 0 recorded in `scripts/rendered-scope-baseline.json`.
`check:rendered-scope` never saw the tier-2 hop because it stops at the first unenrolled node; the per-surface census
walks through it. There is one root cause, not two.

`STOP — OWNER DECISION REQUIRED (2)`. The decision is what to do about `LightboxView.tsx → AppImage`:

- **(A2) Migrate `AppImage` first.** It is already filed as Task **813**'s stated priority ("the site's image
  primitive"). Sequence 813 ahead of 820, then re-run §17.2 option (A) unchanged. Changes: 820 stays open longer;
  nothing in 820 is weakened. Verifies with AC15 plus a re-run of `Rev3`'s exact command.
- **(B2) Enrol and story `LightboxView.tsx` in a new task, then re-run.** It is the single node both surfaces reach
  through, and it already carries recorded tier-1 debt from Revision 0. Changes: the tier-2 hop moves inside an
  enrolled, storied component and the refusal is re-measured, not bypassed. Verifies the same way.
- **(C2) Defer the two patterns' enrolment.** Requires amending decision 5, which says *every* `.tsx` in the
  directory is enrolled — an owner-only change, and it would leave `check:pattern-enrolment` failing on two files
  unless they are also excluded from it, which re-opens the hole this task exists to close. State that cost before
  choosing it.
- **(D2) Accept §17.2 option (B) after all** — leave the baseline as it is and carry the 20 entries as a separate
  numbered task. Changes: no baseline write in 820; the deferred red gate becomes a named, expected task.

### 17.7 `OWNER DECISIONS — RECORDED VERBATIM, 2026-09-11`

Both decisions below are the owner's own words, pasted unedited. They are the authority for §17.2 and §17.6; no
review summary, backlog row or chat report may be used in their place.

> **Decision §17.2 — select (A), 2026-09-11.** Reconcile the baseline in Task 820 through the existing diff-scoped
> writer with an explicitly recorded base and head; never hand-edit it or defer a known false-red gate. Stop if the
> widened measurement refuses tier-2 debt or produces an unexplainable delta.

> **Decision §17.6 — select (A2), 2026-09-11.** Task 813's AppImage migration is a blocking dependency of Task 820.
> Migrate `LightboxView.tsx` off `src/components/ui/AppImage.tsx` through Task 813; do not enrol `LightboxView`
> merely to hide the tier-2 hop, defer either pattern, add an exclusion, or baseline the tier-2 finding. After Task
> 813 is approved, re-run Task 820 §17.2 option (A) from the same base
> `02d975f945159df38c23a0caab43e1c7a96faa58` to the then-current fixed HEAD, with diff/surface limits re-measured
> and recorded. The reconciliation must remove the 20 now-false entries, list every baseline delta, and pass the
> gate plus its self-test. Any new tier-2 refusal remains a stop for a new owner decision.

**What this binds, and the order it binds it in.**

1. **Task 820 is blocked on Task 813 being `APPROVED`.** Until then R11/AC15 must not be re-attempted. `LightboxView`
   is not to be enrolled, no pattern's enrolment is deferred, no exclusion is added to `check:pattern-enrolment`, and
   the tier-2 finding is not baselined. Sprint 75's execution order gains `813` before `820`'s completion.
2. **R13/AC17 is executable now** and is the only executor work owed while the dependency is open. Do it in its own
   revision; it touches no gate, no baseline and no product code.
3. **When 813 is approved, the re-run is fully specified by the decision**: base pinned at
   `02d975f945159df38c23a0caab43e1c7a96faa58`, head pinned to the then-current commit and recorded, both limits
   re-measured from that window and written into the transcript rather than carried over from Revision 3's
   `4991 / 193`. AC15 then requires zero surviving now-false entries **plus** an explicit list of every baseline
   entry added and removed, and `check:surface-census:changed` with its 8-arm self-test at exit 0.
4. **The `--max-*` values are a recorded measurement, not a setting.** They exceed the gate's designed limits
   (60 surfaces / 300 changed files) and CI never runs with them; the re-run's session log must state the values it
   measured and that CI's own limits are unchanged. This is a reporting requirement, not permission to edit a limit.
5. **AC3 is not covered by any of this.** It is factual visual QA, not a policy decision: it stays `NOT VERIFIABLE`
   until the owner has actually viewed and accepted or returned each of the four `ResponsiveBottomSheet` tuples. No
   executor action, and no decision may be read as accepting it.

Sonnet: execute R13/AC17 now. Do not touch R11/AC15 until Task 813 carries an `APPROVED` verdict in
`docs/backlog-archive.md` or `docs/backlog.md`.
