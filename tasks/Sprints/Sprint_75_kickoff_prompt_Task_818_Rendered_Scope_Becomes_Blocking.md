# Task 818 — The advisory gate becomes blocking: a versioned fail-on-new baseline, and a self-test that proves it can fail

Sprint 75 · **P0** · QA profile **Q4**

## 1. Mode and task type

`IMPLEMENTATION` — governance gate. A versioned baseline comparator on the existing `check:rendered-scope`, its
`--update-baseline` writer, a CI-resident self-test, and the CI change from advisory to blocking. No product UI
changes, no component migration, no change to `check-surface-census.mjs` or `check-story-coverage.mjs`.

## 2. Objective

Owner decision 3 (2026-09-11, quoted in full at `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`)
put `check:rendered-scope` into CI as **advisory only** and made its exit from that state mandatory:

> In the same response, file Task 818 to make the rollout blocking safely: it must either reduce the reviewed frontier
> to zero or add a versioned, path-level fail-on-new baseline comparator with a planted new-edge proof. On Task 818
> approval, remove `continue-on-error` and make the governance step blocking/required. The advisory mode has no
> indefinite exemption.

`FACT` — the step is still advisory: `.github/workflows/governance-pr.yml:121-123`, read this session, carries
`continue-on-error: true` under the name *"Rendered-but-unenrolled component scope gate (Task 812 — advisory, owner
decision 3, 2026-09-11; not yet enforced …)"*.

After this task, a pull request that introduces a **new** rendered-but-unenrolled edge fails the `governance` job, the
debt that existed on 2026-09-11 is recorded rather than silently tolerated, and the gate's ability to fail is proven
by a CI step rather than by a transcript nobody re-runs.

## 3. Verified context — read from source on 2026-09-11, not quoted from the backlog

### 3.1 The frontier as it actually prints

`FACT` — `docs/sessions/evidence/task817/R1_gates-part1.txt`, the `npm run check:rendered-scope:report` block, read in
full this session. Totals: **252** local import edges resolved across **38** enrolled roots, **155** non-rendered
skipped, **27** allowlisted (tier 3), **26** barrel hops unwrapped, `tier1-unenrolled (27)`,
`tier2-legacy-primitive (3)`, exit 0 in report mode.

`FACT`, and the first thing this task must not copy wrong — **the printed `27` contains a duplicate.**
`src/modules/listings/components/ListingDetailView.tsx -> src/modules/listings/components/RecentlyViewedSection.tsx`
is printed **twice**: `check-rendered-scope.mjs` iterates import *bindings* (`:223`, `:401`) and pushes one finding per
rendered binding, so two bindings resolving to the same file produce two findings for one edge. Distinct tier-1 edges
are therefore **26**, across the **20** distinct target paths owner decision 1 enumerated. A baseline keyed by edge
must dedupe; a count copied from the report will be off by one. **Re-measure at execution and state which number you
used for what.**

`FACT` — the 3 tier-2 edges are `ListingCard -> src/components/ui/AppImage.tsx`,
`PopularLocationsView -> src/components/ui/AppImage.tsx`, and
`AuthSheet -> src/components/ui/PasswordRequirementsHint.tsx`.

### 3.2 Why route A ("reduce the frontier to zero") is not the route

`INFERENCE` from the facts above plus owner decision 1, stated so the choice is auditable rather than assumed:
clearing the frontier means migrating, storying and enrolling 20 components — `LocaleSwitcher`,
`PropertyTypeCombobox`, `ViewAllLink`, `YearCombobox`, `FilterRangeInputs`, `FilterChoiceGroup`, `FilterRoomsRow`,
`CaptchaWidget`, `PhoneField`, `ListingsActionRow`, `GalleryStaticFrame`, `GalleryIsland`, `SimilarListings`,
`MapWrapper`, `ViewTracker`, `RecentlyViewedTracker`, `RecentlyViewedSection`, `ListingReportDialog`,
`ListingShareButton`, `ListingInquiryDialog` — plus two tier-2 primitives consumed repo-wide. Decision 1 forbids
allowlisting any of them (*"This does not authorize allowlisting any non-pattern tier-1 target or any tier-2
`src/components/ui/*` path"*), several are already owned elsewhere (**794**, **795**, **796**, **813**, **814**), and
none of that work belongs in a gate task. **Route B — the baseline comparator — is the single active route of this
kickoff.** If the owner wants route A instead, that is a new decision and this task stops; it is not an executor call.

### 3.3 The house pattern this task copies rather than invents

`FACT` — this repository already runs three fail-on-new baseline gates and four gate self-tests, and 818 mirrors them
instead of designing new shapes:

| Existing | Where | What 818 takes from it |
|---|---|---|
| `check:i18n-hardcode` — *"Static i18n hardcode gate (fail-on-new, baseline-diff)"* | workflow `:106-107`; `scripts/check-hardcoded-i18n.mjs`; `scripts/i18n-hardcode-baseline.json`; `check:i18n-hardcode:update-baseline` (`package.json:58`) | the baseline file shape — a keyed object, one entry per recorded item, value carrying its descriptor — and the `--update-baseline` writer |
| `check:i18n-dynamic` + its baseline | workflow `:109-110`; `package.json:59-61` | the same trio of `run` / `:report` / `:update-baseline` script entries |
| `check:review-ledger:verify`, `check:hydration:verify`, `check:homepage-grid:verify`, `check:listing-visibility:verify` — each named *"gate self-test (verifies gate detects violations — CI-safe)"* | workflow `:57`, `:135`, `:147`, `:185` | **the pattern that matters most here**: a blocking gate in this repo carries a CI step that plants violations and asserts the gate rejects them, so its ability to fail is re-proven on every PR rather than trusted from a transcript |

`FACT` — `scripts/i18n-hardcode-baseline.json` is a keyed object
(`"<path>:<line>": { "kind": …, "value": … }`); `scripts/tailwind-runtime-token-baseline.json` is `[]`. Neither
carries a version field, which is why decision 3's word **"versioned"** is a new requirement rather than a copy.

### 3.4 The detector as it exists

`FACT` — `scripts/check-rendered-scope.mjs`, read in full this session (Task 812, amended by its Revision 1). Its
frontier classification is `tier2` when the resolved path starts with `src/components/ui/` (`:206`, `:244`), `tier3`
when a `scripts/rendered-scope-allowlist.json` entry carries both `reason` and `owner` **and** the path is not tier-2
(`:250`), `tier1` otherwise. It already fails on a stale allowlist entry (`:271-279`, `:337-342`) and on a tier-2 path
placed in the allowlist (`:270`, `:344-350`) — that is the R10 rule Task 812's review added, and **818 must not
weaken it by any route, including the new baseline file.**

`FACT` — `scripts/check-surface-census.mjs` (Task 817, `APPROVED WITH NOTES` 2026-09-11) is the per-surface GR-1
command and is **not** in CI, because it takes a `--surface` argument and no CI job knows which surface a PR is about.
That asymmetry is what §5's owner note is about.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Decision 3 | `scripts/rendered-scope-baseline.json` exists and is **versioned**: a top-level `version` integer plus an `edges` object keyed `"<from> -> <to>"`, one entry per **distinct** frontier edge, each value recording at least its `tier`. An unknown or missing `version` is a hard error naming the expected value — never a silent empty baseline. | **P0** | AC1, AC2 | Confirmed |
| **R2** | Decision 3 | `check-rendered-scope.mjs` compares the measured frontier against the baseline: an edge present in the baseline is reported as **baselined debt** and does not fail; an edge **absent** from it fails, naming the edge and its tier. This replaces the current unconditional tier-1/tier-2 failure, and nothing else about the walk, the tier rules or the allowlist changes. | **P0** | AC3, AC4 | Confirmed |
| **R3** | `check-rendered-scope.mjs:271-279` house rule | A baseline entry with no matching measured edge is **stale** and fails, in the same shape the allowlist's stale-entry check already uses, and the failure message prints the exact `--update-baseline` command that fixes it. A baseline that keeps paid-off debt is permission, not a record. | **P0** | AC5 | Confirmed |
| **R4** | 16d tier 2, Task 812 R10 | `--update-baseline` refuses to add a **tier-2** edge that is not already baselined: it writes every other change, prints the refused edge with 16d tier 2's correction ("stop importing the legacy primitive"), and exits non-zero. The three tier-2 edges of §3.1 are recorded as pre-existing debt at their measured state and can only ever shrink. A baseline must not become the exemption mechanism the allowlist is forbidden to be. | **P0** | AC6 | Confirmed |
| **R5** | §3.3 house pattern | `package.json` gains `check:rendered-scope:update-baseline` and `check:rendered-scope:verify`, matching the existing `:report` / `:update-baseline` / `:verify` naming exactly. | P1 | AC7 | Confirmed |
| **R6** | §3.3, sprint exit 3 | `check:rendered-scope:verify` is a **CI-safe self-test** — no server, no browser, no network, no write to a tracked file — that plants and asserts at least these four arms and exits non-zero if any fails to behave: ① a new tier-1 edge absent from the baseline → gate non-zero naming it; ② a new tier-2 edge → non-zero, and `--update-baseline` refuses it; ③ a stale baseline entry → non-zero; ④ the unplanted tree → zero. Each arm prints its own PASS/FAIL line. | **P0** | AC8 | Confirmed |
| **R7** | Decision 3 | `.github/workflows/governance-pr.yml`: the `check:rendered-scope` step loses `continue-on-error: true` and its "advisory / not yet enforced" name, and a `check:rendered-scope:verify` step is added immediately after it, named in the house form. No `\|\| true`, no `exit 0`, no `set +e`, no other wrapper. No other job or step changes. | **P0** | AC9 | Confirmed |
| **R8** | Sprint exit 5, GR-2 | The gate prints, on every run, how many edges were baselined, how many are new, how many baseline entries are stale, and the sentence stating that **a baselined tier-2 edge is recorded debt and not an exemption — `agent-contract` 16d tier 2 still binds**. The existing "cannot see" line (dynamic `import()`, `React.lazy()`) stays. | P1 | AC10 | Confirmed |
| **R9** | Decision 3, `golden-rules.md:92,94,104-107` | `docs/golden-rules.md`'s **`Enforcement status` table and the closing paragraph immediately below it** — and nothing else in that file — record what is now enforced and, with equal precision, what is not: the blocking command enforces the **enrolled-subgraph** rule, while GR-1's per-surface census of an **unenrolled** surface stays a by-hand receipt because `check-surface-census.mjs` needs a `--surface` argument CI cannot supply. No GR-n rule body, no `Command` block, no receipt string is touched. | **P0** | AC11, AC12 | Confirmed |
| **R10** | Sprint exit 4 | `docs/storybook-governance.md` §15.5 is updated: blocking rather than advisory, the baseline's shape and its ratchet, the `--update-baseline` tier-2 refusal, and the class the baseline deliberately does not catch (see §5's stated assumption). | P1 | AC13 | Confirmed |
| **R11** | 812 R9 precedent | `scripts/check-story-coverage.mjs`, `scripts/check-surface-census.mjs`, `scripts/mantine-migration-scope.json` and `scripts/rendered-scope-allowlist.json` are **not modified**. After this task they produce the same counts and exit codes as the pre-change tree. | **P0** | AC14 | Confirmed |

## 5. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated, and the one to read first)** — decision 3's *"path-level"* is implemented as
  **edge-level** keying, `"<from> -> <to>"`, not target-path-only keying. Reason: the contrast decision 3 draws is with
  a *count* baseline (the shape `i18n-hardcode-baseline.json` and `tailwind-runtime-token-baseline.json` already have),
  and a target-path-only key would let a **brand-new importer** of an already-baselined component pass unseen — which
  is the Task 809 shape one level over, in the sprint whose whole subject is that a narrowing is a blind spot.
  Edge-level is strictly stronger: it catches everything target-path keying would, and more. **Rejected alternative:**
  keying by target path alone, 20 entries instead of 26. If the owner meant the weaker form, say so — but do not
  silently narrow it.
- **`ASSUMPTION` (reversible, stated)** — the baseline records **both** tier-1 and tier-2 edges, because decision 3
  says "the reviewed frontier" and the reviewed frontier as printed contains all 29. R4 is what keeps that from
  becoming a tier-2 exemption: the tier-2 set can shrink and never grow.
- **`STOP — OWNER DECISION REQUIRED`, and it does not block execution.** Sprint 75's exit criterion 2 reads
  *"`docs/golden-rules.md`'s enforcement table shows GR-1 and GR-3 as `enforced` by a named command"*. After this task
  that is true **for the enrolled subgraph** and false **for an unenrolled surface**, which is the exact case GR-1 was
  written for after Task 809. The executor writes the precise wording R9 requires — it never writes a flat
  "GR-1 enforced" — and the owner then decides one of: **(a)** exit criterion 2 is met as qualified and Sprint 75 may
  close on it; **(b)** a further task is filed to close the pre-enrolment half (for example, a `changed-files`-driven
  CI step that runs `check-surface-census.mjs` against each changed surface); **(c)** the criterion is reworded.
  Record the answer in the sprint file with its date, verbatim, per `agent-contract` 16d. Nothing in §4 waits on it.
- **`UNKNOWN`, resolved by §13.1 and not before** — the exact frontier at execution. §3.1's numbers are a
  2026-09-11 measurement and a merge can change them. Generate the baseline from a live run; **never hand-write it
  from this kickoff.**
- **Out of scope:** migrating, storying or enrolling any component the gate reports · editing
  `scripts/rendered-scope-allowlist.json` or `scripts/mantine-migration-scope.json` · `check-surface-census.mjs` and
  `check-story-coverage.mjs` · Task 817's three P3 notes (they are 816/818 follow-ups, not this task's fixes, and none
  of them touches the baseline) · any other CI job · Tasks 813, 814, 815, 816, 794-796.

## 6. Pre-read rule bundle

`docs/golden-rules.md` **in full**, including its header, GR-1's `Command` block and the closing paragraph below the
`Enforcement status` table · `docs/agent-contract.md` clauses **9, 13, 16d in full** (tier 2 especially) ·
`docs/qa-profiles.md` (Q4) · `scripts/check-rendered-scope.mjs` **in full** · `scripts/check-hardcoded-i18n.mjs` —
its baseline load, diff and `--update-baseline` writer are the shape R1/R3 follow · `scripts/i18n-hardcode-baseline.json` ·
`scripts/rendered-scope-allowlist.json` · `.github/workflows/governance-pr.yml` — the `governance` job in full, and
the four `*:verify` steps at `:57`, `:135`, `:147`, `:185` · `docs/storybook-governance.md` §15.5 and §15.6 ·
`tasks/Sprints/Sprint_75_…md` — decision 3 verbatim and the exit criteria ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_…md` §§14.2 (defect 1), 14.3 (R10), 14.6.2 — why a tier-2 path may
never be excused · this kickoff.

Do not read the rest of `docs/`.

## 7. Scope

- **New:** `scripts/rendered-scope-baseline.json` (generated, then committed) · the self-test implementing R6
  (either `scripts/check-rendered-scope.mjs --verify-gate`, matching `check:hydration:verify` and
  `check:listing-visibility:verify`, or a sibling script — state which and why).
- **Edited:** `scripts/check-rendered-scope.mjs` (baseline comparison, stale check, `--update-baseline`, scope lines,
  self-test entry) · `package.json` (two script entries) · `.github/workflows/governance-pr.yml` (the one step plus
  the new one) · `docs/golden-rules.md` (`Enforcement status` table + the paragraph below it, only) ·
  `docs/storybook-governance.md` (§15.5).
- **Written:** `docs/sessions/evidence/task818/*` · `docs/sessions/2026-09-11-task818-rendered-scope-becomes-blocking.md` ·
  the concise `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5's out-of-scope list. In addition: no change to the tier rules, the allowlist mechanism, the barrel
unwrap, or the rendered-binding definition — a new blocking gate is not the place to also change what it measures.

## 9. Current and required behavior

**Before.** `npm run check:rendered-scope` exits **1** on the clean tree (27 tier-1 findings + 3 tier-2), and the CI
step swallows that with `continue-on-error: true`. A PR that adds a new unenrolled rendered component is
indistinguishable in CI from one that adds none: both are red, both are ignored.

**After.** The clean tree has zero un-baselined edges and zero stale entries, so the gate exits **0** and the CI step
is blocking. A PR that adds a new rendered-but-unenrolled edge exits non-zero and names it. A PR that pays debt off
must run `--update-baseline`, and the gate tells it so. A PR that adds a new tier-2 legacy-primitive import cannot
baseline its way out. `check:story-coverage` and `check:surface-census` are unchanged.

## 10. Implementation requirements

1. **Generate, never transcribe.** The baseline's first content comes from a live run on the tree as it is at
   execution, written by `--update-baseline`. Hand-editing it, or typing §3.1's list into it, is forbidden — that is
   how the count-off-by-a-duplicate defect gets in.
2. **Dedupe by edge.** Two bindings resolving to the same `from -> to` are one baseline entry. Record how many
   findings collapsed into how many entries, and print both numbers.
3. **The tier rules are the existing ones.** Classification happens first and unchanged; the baseline is consulted
   afterwards, only to decide whether an already-classified edge is new. An allowlisted (tier-3) edge never reaches
   the baseline at all.
4. **Failure output stays actionable.** Each new edge prints its tier and the existing per-tier correction sentence;
   each stale entry prints the `--update-baseline` command; the tier-2 refusal prints 16d tier 2's correction.
5. **The self-test writes nothing tracked.** Plant in memory, or in a temp path outside the repo, or on a copy —
   never on `scripts/rendered-scope-baseline.json` itself in a way that can survive a failed run. `check:hydration:verify`
   and `check:listing-visibility:verify` are the two precedents to read before choosing.
6. **Determinism.** Baseline keys are written sorted, so a regenerated file diffs only where the frontier changed.
7. **Transcripts BOM-free**, via `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`. A plain `>` writes a BOM and `check:file-integrity` rejects `.txt` carrying
   one — the open P2 on Task 809's Revision 6.

## 11. Positive and negative flows

**Positive.** A developer renders a not-yet-enrolled component from an enrolled surface and opens a PR; the
`governance` job fails, naming `from -> to` and the tier, and the fix is to enrol-and-story it or to own it as tier 3
with a reason and a task number.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| Baseline file missing entirely | Yes | hard error naming the path and the `--update-baseline` command — **never** an implicit empty baseline, which would make every existing edge "new" and every PR red |
| Baseline file present, `version` absent or unrecognised | Yes | hard error naming the expected version — R1 |
| Baseline file unparseable | Yes | hard error, same shape the allowlist parse error already uses (`:325-328`) |
| An edge resolved (debt paid) but still baselined | Yes | **stale** → fail with the `--update-baseline` command — R3 |
| A new **tier-1** edge | Yes | fail, named, with the enrol-or-allowlist correction — R2 |
| A new **tier-2** edge | Yes | fail; and `--update-baseline` refuses to record it — R4 |
| A new tier-3 edge with a valid allowlist entry | Yes | not a finding and not baselined — the allowlist already excludes it before the baseline is consulted |
| A tier-2 path placed in the **allowlist** | Yes | still the existing invalid-entry failure — Task 812 R10, unchanged and re-asserted |
| A stale **allowlist** entry | Yes | still fails — unchanged |
| `--report` | Yes | full listing, exit 0, unchanged |
| Dynamic `import()` / `React.lazy()` | Yes | still out of reach; still printed, not silently covered |
| Authorization / RLS / network / concurrent writer | **No** | a static AST walk over the repo; no runtime, data or auth path is touched |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `scripts/rendered-scope-baseline.json` after generation, then it carries a `version` integer
  and an `edges` object whose keys are `"<from> -> <to>"` strings, sorted, one per distinct edge, each value naming
  its tier; and the entry count equals the distinct-edge count from the same run. Quote the first three entries, the
  `version` line, and both counts.
- **AC2 [R1]** — Given the `version` value temporarily changed to an unrecognised number, then the gate exits
  non-zero naming the expected version and prints no pass line. Restore, and retain **one** witness transcript
  carrying the file's `git hash-object` before, the same value after, and an explicit
  `git --no-optional-locks status --porcelain -- scripts/rendered-scope-baseline.json` output.
- **AC3 [R2]** — Given the clean tree with the generated baseline, when `npm run check:rendered-scope` runs, then
  zero edges are reported as new, zero baseline entries are stale, and the gate exits **0**. Quote the scope block and
  the exit code.
- **AC4 [R2]** — Given a planted new tier-1 edge — produced by adding one currently-unenrolled path to
  `scripts/mantine-migration-scope.json` so that its own rendered children become frontier edges the baseline does not
  contain; name the path you chose and why — then the gate exits non-zero and names at least one new
  `from -> to` edge with tier `tier1-unenrolled`. Restore the manifest and retain one witness transcript in the AC2
  shape. Quote the named edge.
- **AC5 [R3]** — Given one baseline entry deleted while its edge still exists, then the gate exits non-zero, reports
  that edge as **new**; and given instead one baseline entry pointed at an edge that does not exist, then the gate
  exits non-zero reporting it **stale** and printing the `--update-baseline` command. Both arms restored with one
  witness transcript. These are two different failures and the transcript must show they print differently.
- **AC6 [R4]** — Given a planted new tier-2 edge, then `npm run check:rendered-scope` exits non-zero naming it, and
  `npm run check:rendered-scope:update-baseline` **refuses** to record it: it exits non-zero, prints 16d tier 2's
  correction, and `git diff` on the baseline shows no tier-2 key added. Quote the refusal and the empty diff. Restore
  with a witness transcript.
- **AC7 [R5]** — Given `package.json` after the change, then `check:rendered-scope:update-baseline` and
  `check:rendered-scope:verify` exist beside the two existing entries. Quote the diff hunk.
- **AC8 [R6]** — Given `npm run check:rendered-scope:verify` on the clean tree, then it prints one line per arm, all
  four arms of R6 report PASS, it exits **0**, and `git --no-optional-locks status --porcelain` is unchanged by the
  run — quote the status before and after in the same transcript. Then break one arm's expectation deliberately,
  show the self-test exits non-zero, and restore.
- **AC9 [R7]** — Given `.github/workflows/governance-pr.yml` after the change, then the `check:rendered-scope` step
  has no `continue-on-error`, its name no longer says advisory or not-yet-enforced, a `check:rendered-scope:verify`
  step follows it immediately, and neither step carries `|| true`, `exit 0`, `set +e` or any wrapper. Quote the hunk
  with the job name and the two neighbouring steps.
- **AC10 [R8]** — Given any run, then the scope block states baselined-edge count, new-edge count, stale-entry count,
  the tier-2-debt-is-not-an-exemption sentence, and the existing cannot-see sentence. Quote the block.
- **AC11 [R9]** — Given `docs/golden-rules.md` read after the change, then the `Enforcement status` GR-1 and GR-3
  rows name the blocking command **and** state that an unenrolled surface's census remains a by-hand receipt because
  `check-surface-census.mjs` requires `--surface`; the closing paragraph below the table no longer says GR-1 and GR-3
  are not enforced without that qualification; and GR-1's `Command` block, its receipt string and every GR-n rule body
  are byte-identical to their pre-change content. Quote both rows, the paragraph, and the byte-identity check.
- **AC12 [R9]** — Given the same file, then no sentence anywhere in it claims that GR-1's per-surface census is
  enforced by CI. Quote the search you used and its result.
- **AC13 [R10]** — Given `docs/storybook-governance.md` §15.5 after the change, then it states blocking, the baseline
  shape and ratchet, the `--update-baseline` tier-2 refusal, and the class the baseline does not catch. Quote the
  changed paragraph and that last sentence.
- **AC14 [R11]** — Given the final tree, then `npm run check:story-coverage` prints the same covered/unproven counts
  and exit code as the pre-change baseline, `node scripts/check-surface-census.mjs --surface src\modules\listings\components\FavoritesShell.tsx --report`
  prints the same 15-node table, and `git diff --stat` is empty for `scripts/check-story-coverage.mjs`,
  `scripts/check-surface-census.mjs`, `scripts/mantine-migration-scope.json` and
  `scripts/rendered-scope-allowlist.json`. Capture the two baselines **before writing any code**; quote both pairs.

**GR-4 AC AUDIT — 14 criteria; each states an observable property; absolutes: none.** AC3's "exits 0" is this task's
deliverable rather than an assumption about an unrelated frontier — the baseline is what makes it reachable, and AC5's
stale arm is the control that proves the 0 is earned rather than empty; it is not Task 812's AC8 mistake, which
asserted a zero exit on a frontier no requirement resolved. AC8's and AC14's "unchanged"/"empty diff" claims are
scoped to named files this task deliberately does not touch and are captured as measured before/after pairs.

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — this task makes a gate blocking for every future PR, and `docs/qa-profiles.md`
requires planted-violation failure proof whenever a gate is claimed. No rendered UI changes, so no visual matrix and
no `OWNER VISUAL QA REQUIRED` matrix. `docs/critical-flow-registry.md` scanned: this task changes `scripts/`,
`package.json`, one workflow and two `.md` files, and touches no route, action, RLS policy or auth path.

### 13.1 Baseline first — measure before writing code

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task818"
$surface  = "src\modules\listings\components\FavoritesShell.tsx"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --short
npm.cmd run check:rendered-scope:report
npm.cmd run check:story-coverage
node.exe scripts\check-surface-census.mjs --surface $surface --report
```

Expected: `win32`; the Node version; the worktree state; the full frontier report with its tier counts, exit 0;
`check:story-coverage` at its current covered/unproven counts, exit 0; the 15-node census table. **Return all of it
before writing a line of code** — it is AC14's baseline and R1's generation input, and the frontier listing cannot be
reconstructed afterwards.

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe --check scripts\check-rendered-scope.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/check-rendered-scope.mjs
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `--check` silent exit 0 · typecheck 0 · eslint 0 errors · `check:rendered-scope` **exit 0** with AC3's
scope block · `check:rendered-scope:verify` exit 0 with four PASS lines · `check:story-coverage` identical to
§13.1 · `check:stories` 0 violations · `build` **exit 0**, mandatory for every non-Q0 task under `agent-contract`
clause 9 · both hygiene gates clean. **The last two are in this block deliberately** — omitting them from the command
block produced a defect on each of Task 809's last two passes, and again nearly on 817.

### 13.3 The planted arms

Run AC2, AC4, AC5 (both halves), AC6 and AC8's broken-arm check as separate, individually restored probes. Every
probe touches a **data file or the workflow only** — `scripts/rendered-scope-baseline.json` or
`scripts/mantine-migration-scope.json` — never a `src/` source file. Each restore is witnessed by **one** transcript
carrying the `git hash-object` before, the same value after, and the explicit
`git --no-optional-locks status --porcelain -- <that path>` output; Task 812's R11 finding was that two
single-valued hash files cannot witness "identical before and after". Retain everything under
`docs/sessions/evidence/task818/`, BOM-free per §10.7.

For AC4, pick the planted enrolment from §13.1's own `tier1-unenrolled` listing, not from §3.1, and state the path
and why. If no unenrolled path in that listing renders a child that is itself absent from the baseline, say so and
plant instead by removing a baseline entry whose edge still exists (AC5's first arm) — and record that the stronger
arm was unavailable rather than reporting a result it could not produce.

### 13.4 Owner-native rule

Every command above runs in native Windows PowerShell. A result from WSL, a Linux VM or a mounted Linux view is an
environment screen, not evidence (`orchestrator-role.md` → Windows-native validation rule); record it as
`MISSING EVIDENCE` with the exact native command rather than reporting it as a result.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's full baseline · the distinct-edge count and how many findings
collapsed into it · AC1's quoted entries and `version` · AC2's, AC4's, AC5's, AC6's and AC8's probe transcripts with
their single restore witnesses · AC3's scope block and exit code · AC7's `package.json` hunk · AC9's workflow hunk
with its job name and neighbours · AC10's scope block · AC11's two rows, the paragraph and the byte-identity check ·
AC12's search and result · AC13's changed paragraph · AC14's two before/after pairs and the four empty diffs · every
command with its real exit code and transcript path · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `PARTIALLY IMPLEMENTED`. `BLOCKED` is available only if
§13.1's measurement contradicts §3.2's route choice — for example if the frontier is already empty, which would make
route A the live one. §5's owner note does **not** block: write the precise wording and continue. Do not self-approve;
Opus alone issues the verdict, and Sonnet runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this task migrate anything the gate reports? | **No.** It records the debt and stops it growing. The 20 tier-1 paths and 2 tier-2 primitives stay owned by 794-796, 813, 814 and future tasks. |
| Could the gate be satisfied by weakening it? | Yes — by baselining a new edge instead of fixing it, which is why R3 fails on stale entries, R4 refuses tier-2 growth, and R6 re-proves the failure path on every PR. |
| Is the frontier count taken from this kickoff? | **No** — §3.1 states the duplicate that makes the printed 27 into 26 distinct edges, and §10.1 forbids transcribing either number into the baseline. |
| Does it claim GR-1 is fully enforced? | **No** — R9/AC11/AC12. The per-surface pre-enrolment case stays a by-hand receipt, and §5 puts that in front of the owner rather than papering over it. |
| Is the two-armed proof a transcript or a gate? | **Both** — §13.3 for this task's evidence, R6/AC8 for every PR afterwards, following the repo's four existing `*:verify` steps. |
| Are the hygiene gates in the command block? | Yes — §13.2. |
| Does any AC assert an exit code the tree cannot produce? | **No** — AC3's zero is what the baseline creates, and §12's audit says why that is not Task 812's AC8 error. |
| Is `check:story-coverage`'s and `check-surface-census`'s behaviour protected? | Yes — R11/AC14, with both baselines captured before any code is written. |

## 16. Git handoff — task design (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace does not start
after the 2026-09-08 Windows update, so this block is built from the paths this task design wrote. Check
`git status` before pasting. If `.git/index.lock` exists and no Git process is running, delete that exact file,
confirm it is gone, and re-run `git status --short` before staging.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_818_Rendered_Scope_Becomes_Blocking.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task818): kickoff filed - versioned fail-on-new baseline, CI self-test, and the advisory-to-blocking exit"
```

No `git push` — a task-design handoff is never authorization for one.
