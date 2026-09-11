# Task 819 — GR-1's pre-enrolment half becomes blocking: the diff names the surfaces, and every one of them is censused

Sprint 75 · **P0** · QA profile **Q4**

## 1. Mode and task type

`IMPLEMENTATION` — governance gate. A deterministic PR-diff → affected-surface mapper, a fail-closed CI runner that
censuses each mapped surface with the Task 817 command, a versioned baseline for the debt that already exists, and a
CI-resident self-test. No product UI changes, no component migration.

## 2. Objective

Owner decision 4 (2026-09-11, quoted verbatim in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`):

> **Decision 4 — select (b), 2026-09-11.** Exit criterion 2 is not met and Sprint 75 must not close on a qualified
> enrolled-subgraph-only check. File a P0/Q4 follow-up that makes GR-1's pre-enrolment case blocking in CI. It must
> deterministically map the PR base-to-head diff to affected rendered surfaces, run `check-surface-census.mjs --surface`
> for each, fail closed on an unresolved candidate or diff-limit condition, print its included and excluded scope, and
> include planted fail/pass proofs. The task depends on Task 818 being approved; until then GR-1 and GR-3 remain not
> enforced.

818 is `APPROVED WITH NOTES` (2026-09-11), so this task is unblocked.

`FACT` — what 818 left open, from `docs/golden-rules.md:92,94` read this session: `check:rendered-scope` blocks the
PR, but every root it walks is a `scripts/mantine-migration-scope.json` entry. A surface that is **not enrolled** is
never a root, so nothing it renders is examined — the exact state `/favorites` was in when Task 809 was designed. The
command that *can* census such a surface, `scripts/check-surface-census.mjs` (Task 817), takes a `--surface`
argument, and no CI job today knows which surface a PR is about. This task is what teaches CI to know.

## 3. Verified context — read from source on 2026-09-11

### 3.1 The CI ground this stands on

`FACT` — `.github/workflows/governance-pr.yml`, read this session:

| Line | What it says | Why it matters here |
|---|---|---|
| `:3-22` | `on: pull_request: branches: [main]` with a `paths:` filter that includes `src/**`, `scripts/**`, `.github/workflows/**` | the job already runs for every PR that can change a surface; 819 adds no trigger |
| `:31-34` | `actions/checkout@v4` with **`fetch-depth: 0`** | **the merge base is computable.** The classic failure of a diff-driven gate — a shallow clone with no common ancestor — does not apply here today |
| `:118-124` | `check:story-coverage`, then `check:rendered-scope` (blocking, Task 818), then `check:rendered-scope:verify` | where 819's steps belong: beside them, in the same `governance` job |

`INFERENCE`, and it is this task's own blind spot, to be written down rather than discovered later: `fetch-depth: 0`
is a property of a workflow file anyone can edit. A future PR that sets `fetch-depth: 1` would leave this gate unable
to compute a merge base — which R5's fail-closed rule turns into a failing run rather than a silent skip. Say so in
the docs requirement; do not rely on the value staying put.

### 3.2 The command this task drives

`FACT` — `scripts/check-surface-census.mjs` (Task 817, `APPROVED WITH NOTES`), read in full this session. Contract:
`--surface <repo-relative-or-absolute .ts(x) path>` walks from that file as node #1, transitively through tier-1
nodes only, stopping at tier-2 (`src/components/ui/`) and tier-3 (a valid `scripts/rendered-scope-allowlist.json`
entry). Exit **0** with `GR-1 CENSUS COMPLETE` when every node is enrolled-and-storied; **1** with
`GR-1 CENSUS BLOCKED` naming every offender; **2** when the invocation is unusable (missing/absent/non-`.ts(x)`/
out-of-repo/unparseable `--surface`). `--report` prints the node table and always exits 0. Output is human text; there
is **no machine-readable mode** — R2 adds one rather than parsing that text.

`FACT` — the census blocks on a tier-1 node that is not both in the manifest **and** imported by a canonical Mantine
story of its own. Task 812's measured frontier lists **20** such component paths reachable from enrolled roots
(`LocaleSwitcher`, `PropertyTypeCombobox`, `ViewAllLink`, `YearCombobox`, `FilterRangeInputs`, `FilterChoiceGroup`,
`FilterRoomsRow`, `CaptchaWidget`, `PhoneField`, `ListingsActionRow`, `GalleryStaticFrame`, `GalleryIsland`,
`SimilarListings`, `MapWrapper`, `ViewTracker`, `RecentlyViewedTracker`, `RecentlyViewedSection`,
`ListingReportDialog`, `ListingShareButton`, `ListingInquiryDialog`), plus 2 tier-2 primitives. **A PR that touches
any of them, or any surface that renders them, would fail a naive per-surface gate on pre-existing debt.** That is
what R4's baseline exists for, and it is the single largest risk in this task.

### 3.3 What 818 already proved, and what this task must not duplicate

`FACT` — `scripts/rendered-scope-baseline.json` is `version: 1` with an `edges` object of 29 keys
(`"<from> -> <to>"`), written only by `check-rendered-scope.mjs --update-baseline`, which refuses to bootstrap a
missing file and refuses to record a **new** tier-2 edge. Its ratchet (stale entry ⇒ fail, with the update command
printed) and its self-test (`check:rendered-scope:verify`, 5 arms, exit-code wiring included via the shared
`evaluateGateExitCode`) are the patterns R4 and R7 follow.

**This task does not write to that file.** Its producer is the manifest walk; 819's producer is a per-surface census
rooted anywhere. One writer per ledger — see §5's stated assumption and its rejected alternative.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Decision 4 | `scripts/map-changed-surfaces.mjs` maps a base-to-head diff to affected surfaces **deterministically**: same inputs, same ordered output. It takes an explicit base and head (`--base <ref> --head <ref>`, defaulting to the PR refs in CI), lists changed paths with `git diff --name-only --diff-filter=ACMR`, and resolves each to the surface(s) whose census would cover it. Every run prints its **included** set and its **excluded** set with a per-path reason. | **P0** | AC1, AC2, AC6 | Confirmed |
| **R2** | §3.2 | `scripts/check-surface-census.mjs` gains `--json`, emitting the node table, the blocking list with reason codes, and the scope counters as one JSON object on stdout, exit codes unchanged. Its existing human output and `--report` mode are **byte-unchanged for an unchanged tree**, and nothing else in that script changes. This is additive so the runner consumes structure instead of parsing prose. | **P0** | AC3, AC10 | Confirmed |
| **R3** | Decision 4 | `npm run check:surface-census:changed` runs the mapper, then `check-surface-census.mjs --surface <path> --json` once per included surface, and aggregates: per surface, its blocking nodes; overall, the counts. It prints the same included/excluded scope the mapper printed. | **P0** | AC4 | Confirmed |
| **R4** | §3.2 risk, 818's pattern | A versioned baseline, `scripts/surface-census-baseline.json` — `version` integer plus a `blocks` object keyed `"<surface> :: <node> :: <reasonCode>"` — records the blocking nodes that already exist. A block present in it is recorded debt and does not fail; one absent from it fails, naming surface, node and reason. A baseline entry no block matches is **stale** and fails, printing the update command. `--update-baseline` refuses to bootstrap a missing file once seeded, and refuses to record a **new** `tier2-legacy-primitive` block — both rules copied from `check-rendered-scope.mjs`, not reinvented. | **P0** | AC5, AC7, AC8 | Confirmed |
| **R5** | Decision 4, verbatim | **Fail closed.** The run exits non-zero, naming the condition, when: the merge base cannot be determined; the changed-file count or the mapped-surface count exceeds a stated, configurable limit; a changed `.ts(x)` under `src/` resolves to **no** surface (an unresolved candidate); a mapped surface makes the census exit **2**; or the baseline is missing, unparseable or version-mismatched. "Fail closed" is the owner's word: an unresolved candidate or an over-limit diff is a **failing run**, never a skipped check and never a pass with a warning. | **P0** | AC6, AC9 | Confirmed |
| **R6** | Sprint exit 5, GR-2 | Every run prints its own scope: changed paths seen, paths excluded with reasons, surfaces included, surfaces censused, blocks baselined, blocks new, stale baseline entries, the limits in force, and one sentence naming what the mapping **cannot** see — dynamic `import()`, `React.lazy()`, a surface reached only through a route convention the mapper does not model, and a file changed outside `src/`. | P1 | AC6 | Confirmed |
| **R7** | 818 R6/R15 precedent | `npm run check:surface-census:changed:verify` is a CI-safe self-test — no network, no write to a tracked file — with at least these arms, each printing PASS/FAIL and the arm count: ① a synthetic changed file mapping to a known surface is included; ② a synthetic changed `.ts(x)` resolving to no surface is an unresolved candidate and drives the exit decision to non-zero; ③ an over-limit diff drives it to non-zero; ④ a new (un-baselined) block drives it to non-zero; ⑤ a baselined block does not; ⑥ the unplanted tree is clean. The exit decision is a **shared pure function** the real run calls, as `evaluateGateExitCode` is in `check-rendered-scope.mjs`. | **P0** | AC11 | Confirmed |
| **R8** | Decision 4 | `.github/workflows/governance-pr.yml`: a blocking `check:surface-census:changed` step and its `:verify` step, both in the `governance` job, immediately after `check:rendered-scope:verify`, with **no** `continue-on-error`, no `\|\| true`, no `exit 0`, no wrapper. The step passes the PR's base and head explicitly. No other job or step changes. | **P0** | AC12 | Confirmed |
| **R9** | Sprint exit 2, decision 4 | `docs/golden-rules.md`'s **`Enforcement status` table and the closing paragraph below it** — and nothing else in that file — record that GR-1 and GR-3 are now enforced for **both** halves, naming both commands, and that the enrolled-subgraph half and the pre-enrolment half are separate gates. No GR-n rule body, no `Command` block, no receipt string changes. If any measured result leaves a half unenforced, say which and do not widen the claim. | **P0** | AC13, AC14 | Confirmed |
| **R10** | Sprint exit 4/5 | `docs/storybook-governance.md` gains a §15.7 for this gate: the mapping rule, the limits, the fail-closed conditions, the baseline's shape and ratchet, and the classes it deliberately cannot see — including §3.1's `fetch-depth` dependency. | P1 | AC15 | Confirmed |
| **R11** | 812 R9 / 818 R11 precedent | `scripts/check-rendered-scope.mjs`, `scripts/rendered-scope-baseline.json`, `scripts/rendered-scope-allowlist.json`, `scripts/mantine-migration-scope.json` and `scripts/check-story-coverage.mjs` are **not modified**. After this task they produce the same counts and exit codes as the pre-change tree. | **P0** | AC10 | Confirmed |

## 5. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated) — the mapping resolves a changed file *upward* to the surfaces that render it,
  not merely to itself.** Decision 4's *"unresolved candidate"* is only meaningful under this reading: if every
  changed `.tsx` were trivially its own surface, nothing could fail to resolve. So: a changed file that nothing
  renders is itself a surface root and is censused directly; a changed file rendered by others resolves to those
  roots (manifest entries, route files under `src/app/**`, and files nothing renders), each of which is censused;
  a changed file that is neither — reached only through a path the mapper cannot resolve — is **unresolved** and
  fails. **Rejected alternative:** census the changed file itself and nothing above it, which is simpler, can never
  be unresolved, and would have passed Task 809 — because `/favorites`'s defect was in components the changed
  surface rendered, which a leaf-rooted census reaches only by accident.
- **`ASSUMPTION` (reversible, stated)** — a **second** baseline file rather than a `version: 2` extension of
  `scripts/rendered-scope-baseline.json`. Reason: that file has exactly one writer today
  (`check-rendered-scope.mjs --update-baseline`, which regenerates it wholesale), so a second producer's entries
  would be deleted as stale on the next update. Two files, two writers, two ratchets, no cross-deletion.
  **Rejected alternative:** one ledger with a producer discriminator, which couples two writers to one file and puts
  the tier-2 refusal in two places.
- **`UNKNOWN`, and §13.1 resolves it before any code is written** — how many surfaces the mapping produces for a
  realistic diff, how many changed files are unresolved on the current tree, and how large the seed baseline is.
  Measure it; do not estimate it from §3.2's 20 paths.
- **`CONFLICT` to surface, not to resolve alone.** If §13.1 shows that a meaningful share of changed `.ts(x)` files
  is **unresolved** on the current tree, fail-closed would red every PR and the gate would be turned off within a
  week. Report the measured unresolved set and stop for `BLOCKED — OWNER DECISION REQUIRED` on the mapping's
  strictness — bounded options: (a) keep fail-closed and file the work to make the unresolved set empty; (b) an
  explicit, versioned, reason-carrying unresolved-allowlist with an owning task, on the allowlist's own rules;
  (c) narrow what counts as a surface candidate. Do **not** pick one. Decision 4's "fail closed" is not negotiable by
  task design; what is negotiable is only what the mapper is asked to resolve.
- **Out of scope:** migrating, storying or enrolling any component the census reports · editing the allowlist or the
  manifest · changing `check-rendered-scope.mjs` or its baseline · changing `check-surface-census.mjs` beyond the
  additive `--json` of R2 · any other CI job · Tasks 813, 814, 815, 816, 794-796.

## 6. Pre-read rule bundle

`docs/golden-rules.md` **in full**, GR-1's `Command` block, GR-2, and the `Enforcement status` table with the
paragraph below it · `docs/agent-contract.md` clauses **9, 13, 16d in full** · `docs/qa-profiles.md` (Q4) ·
`scripts/check-surface-census.mjs` **in full** · `scripts/check-rendered-scope.mjs` — its baseline load/compare,
`--update-baseline` bootstrap refusal and tier-2 refusal, `evaluateGateExitCode`, and the 5-arm self-test are the
shapes R4, R5 and R7 copy · `scripts/rendered-scope-baseline.json` · `.github/workflows/governance-pr.yml` — the
`on:` block, the checkout step and the `governance` job in full · `docs/storybook-governance.md` §15.5 and §15.6 ·
`tasks/Sprints/Sprint_75_…md` — decision 4 verbatim and the exit criteria ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_818_…md` §§3.3, 17.2 · this kickoff.

Do not read the rest of `docs/`.

## 7. Scope

- **New:** `scripts/map-changed-surfaces.mjs` · `scripts/check-surface-census-changed.mjs` (the runner; or an
  equivalent single entry point — state which and why) · `scripts/surface-census-baseline.json` (generated, then
  committed) · the self-test implementing R7.
- **Edited:** `scripts/check-surface-census.mjs` (additive `--json` only) · `package.json` (the new script entries) ·
  `.github/workflows/governance-pr.yml` (two steps) · `docs/golden-rules.md` (`Enforcement status` table and the
  paragraph below it, only) · `docs/storybook-governance.md` (new §15.7).
- **Written:** `docs/sessions/evidence/task819/*` · `docs/sessions/2026-09-11-task819-pre-enrolment-census-becomes-blocking.md` ·
  the concise `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5's out-of-scope list, plus: no change to the census's tier rules, node classification or blocking
conditions — 819 drives that command, it does not redefine it.

## 9. Current and required behavior

**Before.** CI blocks a PR that adds a rendered-but-unenrolled edge **from an enrolled root** (Task 818). A PR that
changes a wholly unenrolled surface — the Task 809 case — is invisible to every gate; GR-1's per-surface census
exists as a command and is run by hand, when someone remembers.

**After.** The `governance` job maps the PR's own diff to the surfaces it affects, censuses each with the Task 817
command, and fails the PR when a surface carries a blocking node that is not recorded debt — or when it cannot
establish what to census. The included and excluded scope is printed on every run, so a green line never reads as a
claim about files the mapping skipped.

## 10. Implementation requirements

1. **Determinism before convenience.** The mapper sorts its output and derives every path from `git`, never from a
   directory walk that depends on filesystem order. Two runs on the same base/head produce byte-identical output.
2. **Structure, not prose.** The runner consumes `--json`; it must not regex the census's human output. R2 is what
   makes that possible and is the reason the census script is touched at all.
3. **One exit decision, shared.** As in `check-rendered-scope.mjs`, the exit code comes from one pure function that
   both the real run and the self-test call, so R7's arms exercise the wiring and not a parallel copy.
4. **The limits are explicit and printed.** Name the changed-file and mapped-surface limits, make them
   configurable, print their values in the scope block, and fail — not truncate — when either is exceeded.
5. **Seed by measurement.** `scripts/surface-census-baseline.json`'s first content comes from a live run over the
   measured candidate set, written by `--update-baseline`. Hand-editing it, or transcribing §3.2's 20 paths into it,
   is forbidden.
6. **Restores are witnessed in one transcript**, carrying `git hash-object` before, the same value after, and the
   explicit `git --no-optional-locks status --porcelain -- <path>` output.
7. **Transcripts record platform, Node version, working directory, exact command and actual exit code, in the same
   file as the output** — the `=== platform === / === node version === / === working directory === / === command === /
   === exit code ===` shape Task 818 Revision 1 used. **Never read a source file back through PowerShell's
   `Get-Content -Raw` without `-Encoding utf8`**: on a BOM-less UTF-8 file, Windows PowerShell 5.1 decodes it through
   the system codepage and silently mojibakes every multi-byte character. That corrupted
   `scripts/check-rendered-scope.mjs` during Task 818 and only the hash witness caught it. Read and write through
   Node, or pass `-Encoding utf8` explicitly.
8. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`.

## 11. Positive and negative flows

**Positive.** A developer edits a wholly unenrolled surface and the component it renders; the mapper names that
surface, the census reports the unmigrated node, the block is not in the baseline, and the `governance` job fails
naming surface, node and reason — the Task 809 case, caught before merge.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| Merge base cannot be determined (shallow clone, unrelated histories) | Yes | **fail closed**, naming the condition and the refs tried — R5 |
| Changed-file or mapped-surface count over the limit | Yes | **fail closed**, printing both the count and the limit — never truncate to fit |
| A changed `.ts(x)` under `src/` resolves to no surface | Yes | **unresolved candidate** → fail closed, naming the path |
| A mapped surface makes the census exit 2 | Yes | fail closed, quoting the census's own message |
| Changed file outside `src/`, or not `.ts(x)`, or deleted | Yes | excluded, with its reason printed in the scope block |
| A block already in the baseline | Yes | recorded debt; does not fail; counted in the scope block |
| A baseline entry no block matches | Yes | **stale** → fail, with the `--update-baseline` command printed |
| A new `tier2-legacy-primitive` block | Yes | fails, and `--update-baseline` refuses to record it — R4 |
| Baseline missing, unparseable, or version-mismatched | Yes | fail closed; a missing file says to restore from version control, never bootstraps |
| PR touches only docs | Yes | the workflow's `paths:` filter may not run the job at all; when it does run, the mapper includes nothing and the run passes with an explicit "0 surfaces included" line |
| Dynamic `import()` / `React.lazy()` | Yes | out of the mapping's reach; named in the printed scope, and a file reachable only that way is an unresolved candidate, not a silent pass |
| Authorization / RLS / network / concurrent writer | **No** | a static mapper plus a static census; no runtime, data or auth path is touched |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `--base` and `--head` set to two real refs in this repository, when the mapper runs twice,
  then both runs produce byte-identical output. Quote the command, the two hashes of the output, and the first ten
  included entries.
- **AC2 [R1]** — Given a base/head pair whose diff contains at least one changed `.tsx` under `src/`, one changed
  file outside `src/`, and one deleted file, then the included set contains the surfaces for the first, and the
  excluded set names the other two with distinct reasons. Quote the scope block.
- **AC3 [R2]** — Given `node scripts/check-surface-census.mjs --surface <path> --json`, then stdout parses as one
  JSON object carrying the node table, the blocking list with reason codes and the scope counters, and the exit code
  equals the non-`--json` run's for the same surface. Quote the parsed keys and both exit codes.
- **AC4 [R3]** — Given `npm run check:surface-census:changed` on a base/head pair that includes at least two
  surfaces, then each is censused once, the per-surface blocking nodes are aggregated, and the included/excluded
  scope is printed. Quote the aggregate and the surface list.
- **AC5 [R4]** — Given the seeded `scripts/surface-census-baseline.json`, then it carries a `version` integer and a
  `blocks` object whose keys are `"<surface> :: <node> :: <reasonCode>"`, sorted, and the entry count equals the
  block count from the seeding run. Quote the version line, three entries and both counts.
- **AC6 [R1, R5, R6]** — Given a run whose diff contains a changed `.ts(x)` under `src/` that resolves to no
  surface — construct it from the measured tree and name what you used — then the run exits non-zero, names the path
  as an unresolved candidate, and its scope block states changed/excluded/included/censused counts, baselined and new
  block counts, stale entries, the limits in force, and the cannot-see sentence. Quote the failure line and the scope
  block.
- **AC7 [R4]** — Given one baseline entry deleted while its block still exists, then the run exits non-zero
  reporting that block as **new**; and given instead one entry pointed at a block that does not exist, then the run
  exits non-zero reporting it **stale** with the update command. Both arms restored under one witness transcript
  each; the transcript must show the two failures print differently.
- **AC8 [R4]** — Given the baseline moved aside, then `--update-baseline` exits non-zero, names the path, says to
  restore from version control, and writes nothing. Given a planted new `tier2-legacy-primitive` block, then
  `--update-baseline` refuses to record it, exits non-zero, prints 16d tier 2's correction, and the baseline gains no
  such key. Restore each under one witness transcript.
- **AC9 [R5]** — Given the changed-file limit temporarily set below the real diff's size, then the run exits
  non-zero printing both the count and the limit and censuses nothing. Given an unreachable merge base — name how you
  produced it — then the run exits non-zero naming that condition. Quote both.
- **AC10 [R2, R11]** — Given the final tree, then `npm run check:rendered-scope` and `npm run check:story-coverage`
  reproduce the §13.1 baseline's counts and exit codes; `node scripts/check-surface-census.mjs --surface src\modules\listings\components\FavoritesShell.tsx --report`
  reproduces its 15-node table; and `git diff --stat` is empty for `scripts/check-rendered-scope.mjs`,
  `scripts/rendered-scope-baseline.json`, `scripts/rendered-scope-allowlist.json`,
  `scripts/mantine-migration-scope.json` and `scripts/check-story-coverage.mjs`. Capture the baselines **before
  writing any code**; quote the pairs.
- **AC11 [R7]** — Given `npm run check:surface-census:changed:verify`, then it prints its arm count, every arm
  passes, and the arms cover R7's six cases. Then break one arm's expectation deliberately, show the self-test exits
  non-zero naming it, restore, and show `git --no-optional-locks status --porcelain` unchanged in the same
  transcript.
- **AC12 [R8]** — Given `.github/workflows/governance-pr.yml` after the change, then both new steps sit in the
  `governance` job immediately after `check:rendered-scope:verify`, neither carries `continue-on-error` or any
  wrapper, and the changed step passes the PR's base and head explicitly. Quote the hunk with the job name and the
  two neighbouring steps.
- **AC13 [R9]** — Given `docs/golden-rules.md` read after the change, then the GR-1 and GR-3 rows name **both**
  commands and state which half each enforces; the paragraph below the table no longer says the pre-enrolment half is
  a by-hand receipt; and GR-1's `Command` block, its receipt string and every GR-n rule body are byte-identical to
  their pre-change content. Quote both rows, the paragraph and the byte-identity check.
- **AC14 [R9]** — Given any measured result that leaves a half unenforced — for example if §5's `CONFLICT` fires —
  then no sentence in any artifact this task writes claims that half is enforced. Quote the search you used and its
  result.
- **AC15 [R10]** — Given `docs/storybook-governance.md` §15.7, then it states the mapping rule, the limits, every
  fail-closed condition, the baseline's shape and ratchet, and the cannot-see list including the `fetch-depth: 0`
  dependency of §3.1. Quote the heading and the cannot-see list.

**GR-4 AC AUDIT — 15 criteria; each states an observable property; absolutes: none.** AC1's "byte-identical" is a
determinism property of one named command run twice on fixed inputs, which is the requirement itself rather than an
assumption about unrelated state; AC10's and AC13's "empty diff"/"byte-identical" are scoped to named files this task
deliberately does not change and are captured as measured before/after pairs — not the Task 812 AC8 shape, which
asserted a zero exit on a frontier no requirement resolved.

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — this task makes a second gate blocking for every future PR, and `docs/qa-profiles.md`
requires planted-violation failure proof whenever a gate is claimed. No rendered UI changes, so no visual matrix and
no `OWNER VISUAL QA REQUIRED` matrix. `docs/critical-flow-registry.md` scanned: this task changes `scripts/`,
`package.json`, one workflow and two `.md` files, and touches no route, action, RLS policy or auth path.

### 13.1 Measure the mapping before building the gate

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task819"
$surface  = "src\modules\listings\components\FavoritesShell.tsx"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
git --no-optional-locks rev-parse HEAD
npm.cmd run check:rendered-scope
npm.cmd run check:story-coverage
node.exe scripts\check-surface-census.mjs --surface $surface --report
```

Expected: `win32`; the Node version; the project root; the worktree state; the head commit; `check:rendered-scope`
exit 0 at 29 baselined / 0 new / 0 stale; `check:story-coverage` at its current counts, exit 0; the 15-node census
table. **Return all of it before writing code** — it is AC10's baseline.

Then, with the mapper prototyped and **before** any CI wiring, report these measured numbers and stop for §5's
`CONFLICT` if the third is material:

1. the candidate surface set for a realistic base/head pair, and the mapped-surface count;
2. the seed baseline's block count, broken down by reason code and by tier;
3. **how many changed `.ts(x)` files under `src/` resolve to no surface** across at least three recent base/head
   pairs — the unresolved rate that decides whether fail-closed is livable.

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
node.exe --check scripts\map-changed-surfaces.mjs
node.exe --check scripts\check-surface-census.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/map-changed-surfaces.mjs scripts/check-surface-census.mjs
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · the Node version · the project root · both `--check` silent exit 0 · typecheck 0 · eslint 0
errors · the changed-surface gate exit 0 with its scope block on a clean base/head · its self-test exit 0 with the arm
count · `check:rendered-scope` and its self-test exit 0, counts unchanged from §13.1 · `check:story-coverage`
unchanged · `check:stories` 0 violations · `build` **exit 0**, mandatory under `agent-contract` clause 9 · both
hygiene gates clean. **Record every one of these exit codes inside its own transcript** — Task 818's Revision 1
exists because a gate block was retained without them, and `✓ Compiled successfully` is not an exit code.
**Also record the `git hash-object` of every file this task changed inside the final gate block**, so the block's
currency is proven rather than inferred — Task 818's remaining P3.

### 13.3 The planted arms

Run AC6, AC7 (both halves), AC8 (both halves), AC9 (both halves) and AC11's broken-arm check as separate,
individually restored probes, each touching **data files, the workflow, or a scratch path only** — never a `src/`
source file. Each restore is witnessed by one transcript in §10.6's shape. Retain everything under
`docs/sessions/evidence/task819/`, BOM-free per §10.8.

### 13.4 Owner-native rule

Every command above runs in native Windows PowerShell. A result from WSL, a Linux VM or a mounted Linux view is an
environment screen, not evidence (`orchestrator-role.md` → Windows-native validation rule); record it as
`MISSING EVIDENCE` with the exact native command rather than reporting it as a result.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's full baseline **and** its three measured numbers · AC1's two
identical outputs · AC2's scope block · AC3's parsed JSON keys and both exit codes · AC4's aggregate · AC5's version
line, three entries and counts · AC6's failure line and scope block · AC7's two differing failures with their
witnesses · AC8's two refusals with their witnesses · AC9's two fail-closed transcripts · AC10's before/after pairs
and the five empty diffs · AC11's arm count, broken-arm run and restore witness · AC12's workflow hunk · AC13's rows,
paragraph and byte-identity check · AC14's search · AC15's §15.7 · every command with its real exit code and
transcript path · the `git hash-object` of every changed file, recorded in the final gate block · assumptions ·
deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or
`BLOCKED — OWNER DECISION REQUIRED` if §5's `CONFLICT` fires. Do not self-approve; Opus alone issues the verdict, and
Sonnet runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this task migrate anything the census reports? | **No.** It records existing debt and stops it growing. The 20 tier-1 paths stay owned by 794-796, 813, 814 and future tasks. |
| Could the gate be satisfied by weakening it? | Yes — by baselining a new block, or by quietly treating an unresolved candidate as a skip. R4's ratchet, R4's tier-2 refusal, R5's verbatim fail-closed rule and R7's arms exist for exactly that, and §5 sends the strictness question to the owner rather than letting the executor soften it. |
| Is "fail closed" negotiable? | **No** — it is the owner's word in decision 4. What is negotiable, and only by the owner, is what the mapper is asked to resolve. |
| Does it claim GR-1 is fully enforced? | Only if both halves measurably are — R9/AC13/AC14. If §5's `CONFLICT` fires, the claim is not written. |
| Is the hardest number measured before the gate is wired? | Yes — §13.1's third number, the unresolved rate, is what decides whether this gate survives contact with real PRs. |
| Are the hygiene gates and the exit-code/hash discipline in the command block? | Yes — §13.2, written from Task 818's two recorded evidence defects. |
| Does it touch 818's ledger? | **No** — §5's second assumption states why a second file, and R11/AC10 asserts the first is untouched. |

## 16. Git handoff — task design (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace does not start
after the 2026-09-08 Windows update, so this block is built from the paths this task design wrote. Check `git status`
before pasting. If `.git/index.lock` exists and no Git process is running, delete that exact file, confirm it is gone,
and re-run `git status --short` before staging.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_819_Pre_Enrolment_Census_Becomes_Blocking.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task819): kickoff filed - diff-mapped per-surface census, fail-closed, with its own versioned baseline"
```

No `git push` — a task-design handoff is never authorization for one.

---

## 17. Revision 1 — 2026-09-11 (Opus implementation review: `NEEDS REVISION`)

Task 819 state: **`NEEDS REVISION`**, on one **P0**. The mapper, the runner, the census `--json`, the fail-closed
conditions and the 6-arm self-test are right and are **not re-done**. What is wrong is the baseline's comparison
model, and the root cause is a defect in this kickoff's own R4.

### 17.1 Re-entry mode and preserved artifacts

**Re-entry mode: `remediation`.** Do not rebuild the mapper, the runner, the census `--json` patch, or the CI hunk,
and do not re-derive the unresolved-rate measurement.

**Forbidden re-runs — the only record of a state that no longer exists:** `R0_baseline-13.1.txt` ·
`Rev0_sample1_fixed.txt` – `Rev0_sample4_fixed.txt` (the four measured diffs, 587 changed files, 0 unresolved —
the measurement §5's `CONFLICT` turned on) · `Rev0_seed-baseline.txt` (the one-time seed write) ·
`Rev0_verify-first-try.txt` / `Rev0_verify-second-try.txt` · `AC6_unresolved-candidate_probe.txt` (the real on-disk
rootless cycle) · `AC1`, `AC7`, `AC8`, `AC9`, `AC11` probes with their witnesses.

**Verified in review and carried forward untouched:** `resolveSurfacesFor`'s three-rule climb (stop at a manifest
entry or `src/app/**`; nothing-renders-it is its own root; a fully-explored rootless cycle is unresolved) —
`AC6`'s probe fires it on two real files, so the fail-closed condition is not dead code; determinism (identical
SHA-256 over two runs); both fail-closed arms (limit, unreachable merge base); the bootstrap refusal and the tier-2
refusal; the 6 self-test arms and the broken-arm proof; `G15`'s per-file `git hash-object` block, which closes Task
818's remaining P3; and AC10's five byte-identical untouched files with `check:rendered-scope` 29/0/0 and
`check:story-coverage` 38/0. The separately-named one-time `--seed-baseline` flag, never wired into npm, is a
**better** reading of R4 than the wording I gave and stands.

### 17.2 Confirmed defects

1. **`P0 BLOCKER` — stale detection is whole-tree but the run is diff-scoped, so the gate fails almost every real
   PR.** `compareToBaseline` (`scripts/check-surface-census-changed.mjs:135-137`) marks **every** baseline key absent
   from this run's measured blocks as `stale`, and `currentBlocks` only ever holds blocks from the surfaces *this
   diff mapped to* (`dedupeBlocks`, `:115-124`, fed from `mapping.included`). The seeded baseline holds **140 blocks
   across 15 surfaces**. Therefore any PR whose diff maps to a subset of those 15 reports the remainder as stale —
   and stale is a failing condition. **The only diff on which this gate passes is the one the baseline was seeded
   from**, which is exactly the pair `G06_check-surface-census-changed.txt` used (`--base f46c487d5 --head HEAD`,
   `140 baselined / 0 new / 0 stale`). The mirror defect is in the writer: `computeBaselineUpdate` (`:147-160`)
   rebuilds `blocks` from `currentBlocks` alone and never merges `priorBaselineBlocks`, so running
   `--update-baseline` on a narrow diff "fixes" the stale failure by **deleting** the recorded debt of every surface
   that diff did not touch — which then returns as `new` blocks the next time someone touches them.
   **Root cause is mine.** Task 818's baseline is whole-tree: its walk measures every edge on every run, so "a
   baseline entry nothing matches" really is paid-off debt. 819's run is diff-scoped. R4 carried 818's sentence
   across unchanged — *"A baseline entry no block matches is **stale** and fails"* — as if this run measured
   everything too. It does not. → **R12 / AC16, AC17**.
2. **`P2` — the baseline is seeded from one diff's surfaces, not from the candidate space.** 140 blocks across
   **15** surfaces, all from the single `f46c487d5..HEAD` run (`Rev0_seed-baseline.txt:132,273`). Measured against
   this task's own retained sample: `Rev0_sample2_fixed.txt` maps to **27** surfaces, of which **15 are absent from
   the seed**, among them `FeaturedListingsView.tsx` and `ListingsShellView.tsx`. `INFERENCE` from two measured
   sources — Task 812's frontier listing records `FeaturedListingsView -> ViewAllLink` and
   `ListingsShellView -> ListingsActionRow` as tier-1 unenrolled, and the census blocks on a tier-1 node that is not
   both enrolled and storied — so a PR touching either surface brings pre-existing debt the baseline does not carry,
   and after defect 1 is fixed it still fails as `new`. §10 requirement 5 said "seeded by measurement **over the
   measured candidate set**"; one diff's mapped surfaces is not that set. → **R13 / AC18**.
3. **`P3` — every baseline value is `{}`.** All 140 entries carry an empty object; the sibling ledger
   `scripts/rendered-scope-baseline.json` carries `{"tier": …}`. The reason code survives only inside the key
   string, which is why `computeBaselineUpdate` has to read `block.reasonCode` from the *measured* block rather than
   from the baseline, and why no entry can ever carry an owning task number the way the allowlist does.
   → **R14 / AC19**.
4. **`NOTE`, not a finding** — the session log's §7 says *"No limitation found in R1-R11's actual implementation"*.
   Defects 1 and 2 are both in R1-R11's implementation. Correct that sentence when the revision lands; a limitations
   section that says "none" is the one place a reviewer's finding should never be able to land.

### 17.3 Revision 1 requirements

| ID | Requirement | P | Verified by |
|---|---|---|---|
| **R12** | Staleness is scoped to what the run measured. A baseline entry is `stale` **only** when its surface was censused in this run and the block no longer appears; an entry whose surface this run did not census is `carried` — neither stale nor new — and is counted separately in the scope block. `--update-baseline` **merges**: it keeps every prior entry for a surface this run did not census, updates the entries for surfaces it did, and still refuses a new tier-2 block. A run must never be able to delete recorded debt for a surface it did not look at. | **P0** | AC16, AC17 |
| **R13** | The baseline is re-seeded across the **candidate space**, not one diff: every surface root the mapper can produce from `src/` (manifest entries, `src/app/**` routes, and files nothing renders), censused once, every resulting block recorded. Report the new block and surface counts against the current 140/15 and explain the delta. The one-time `--seed-baseline` flag keeps its existing guard — it refuses to run when the file already exists — so the re-seed is an explicit, witnessed replacement, not an in-place drift. | **P1** | AC18 |
| **R14** | Each baseline entry's value carries at least its `reasonCode`, so the ledger is readable without parsing its own key and a future entry can carry an owning task number. The comparator keys stay exactly as they are. | P3 | AC19 |
| **R15** | The self-test gains an arm for defect 1: a synthetic baseline containing a block for a surface **not** in this run's censused set must not be reported stale and must not drive the exit non-zero; a synthetic block missing from a surface that **was** censused must. Both through the same shared exit-decision function the real run calls. Print the arm count. | **P0** | AC20 |
| **R16** | The session log's §7 limitations sentence is corrected, and `docs/storybook-governance.md` §15.7 states the carried/stale/new distinction and the merge semantics of `--update-baseline`. No other section of either file changes. | P2 | AC21 |

### 17.4 Revision 1 acceptance criteria

- **AC16 [R12]** — Given the re-seeded baseline and a run whose diff maps to a **strict subset** of the baselined
  surfaces — name the base/head pair and the subset — then the run reports `0 stale`, a non-zero `carried` count, and
  exits **0**. Quote the scope block. This is the case that fails today; quote the current failure too, from a run
  on the same pair before the fix, so the before/after is in one place.
- **AC17 [R12]** — Given `--update-baseline` run on that same narrow diff, then the baseline's entry count does not
  decrease and every entry for an uncensused surface survives byte-identically. Quote the entry counts before and
  after and the `git diff --stat` for the baseline. Then repeat AC8's tier-2 refusal to show it still fires.
- **AC18 [R13]** — Given the re-seeded baseline, then its surface count is the candidate-space count, not 15; the
  block count is stated against the previous 140 with the delta explained; and a run on `Rev0_sample2_fixed.txt`'s
  base/head pair reports `0 new`. Quote the counts and that run's scope block.
- **AC19 [R14]** — Given the re-seeded baseline, then every entry's value carries its `reasonCode`. Quote three
  entries including one `tier2-legacy-primitive`.
- **AC20 [R15]** — Given `npm run check:surface-census:changed:verify`, then it prints its arm count, every arm
  passes, and the two new arms of R15 are named in the output. Break one deliberately, show the self-test exits
  non-zero naming it, restore, and show `git --no-optional-locks status --porcelain` unchanged in the same
  transcript.
- **AC21 [R16]** — Given the session log §7 and `docs/storybook-governance.md` §15.7 after the change, then the
  limitations sentence no longer says none were found, and §15.7 states the carried/stale/new distinction and the
  merge semantics. Quote both.

**GR-4 AC AUDIT — 6 criteria (AC16-AC21); each states an observable property; absolutes: none.** AC17's
"does not decrease" and "survives byte-identically" are scoped to one named file across one named command, captured
as a measured before/after pair.

### 17.5 Revision 1 verification plan

Re-run §13.2's full block on the final tree with `Rev1_` names, every transcript carrying platform, Node version,
working directory, command and exit code in the same file, plus §13.2's `git hash-object` block for every changed
file. The AC16-AC18 runs and the AC20 broken-arm probe are separate, individually restored probes, each witnessed by
one transcript in §10.6's shape. **Do not read any source file back through PowerShell's `Get-Content -Raw` without
`-Encoding utf8`** — §10.7, and the Task 818 incident it was written from.

### 17.6 Revision 1 completion report contract

Everything §14 requires that Revision 1 touched, plus: AC16's before/after scope blocks on the same pair · AC17's
entry counts, baseline `git diff --stat` and the repeated tier-2 refusal · AC18's candidate-space counts with the
delta against 140/15 and the sample-2 run · AC19's three entries · AC20's arm count, broken-arm run and restore
witness · AC21's two corrected texts · confirmation that the §17.1 artifacts are unmodified.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `PARTIALLY IMPLEMENTED`. No owner decision is outstanding.

### 17.7 Revision 1 pre-read bundle

`scripts/check-surface-census-changed.mjs` `:113-161` (the comparator and the writer), its scope-block printer and
its self-test · `scripts/check-rendered-scope.mjs`'s comparator — **and why its stale rule is valid there and not
here** · `scripts/surface-census-baseline.json` · `docs/sessions/evidence/task819/Rev0_seed-baseline.txt` and
`Rev0_sample2_fixed.txt` · `docs/storybook-governance.md` §15.7 · §§13-17 of this kickoff.

## 18. Git handoff — Revision 1 orchestration (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace does not
start after the 2026-09-08 Windows update. Built from the paths this review wrote — check `git status` before
pasting.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_819_Pre_Enrolment_Census_Becomes_Blocking.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task819): review - NEEDS REVISION; R12-R16 filed for diff-scoped staleness, the one-diff seed and the merge-less baseline writer"
```

Orchestration artifacts only — no `scripts/`, no `package.json`, no `.github/`, no `docs/golden-rules.md`, no
`docs/storybook-governance.md`, no `docs/sessions/`. No `git push`: `NEEDS REVISION` is not an approved
implementation review.
