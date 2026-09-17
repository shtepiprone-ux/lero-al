# Task 831 — `check:surface-census:changed` cannot see a stale `<parent> :: <child>` row when the child's own diff enrols it

Sprint 75 · P2 · QA profile **Q4**

**Status: `NEEDS REVISION` 2026-09-17 (review 1).** Re-entry: **§16** — it supersedes any conflicting text above.
Task 825 is committed (`c177a0920`), which was this task's precondition.

## 1. Mode and task type

`IMPLEMENTATION` — a blocking CI gate and its baseline writer: `scripts/check-surface-census-changed.mjs` (plus one
additive field in `scripts/map-changed-surfaces.mjs`). Bundle: **Regression / Critical Flow Coverage** (governance
gate). No product source changes.

## 2. Objective

The diff-scoped census stops climbing at a manifest root. When a diff **enrols** a child component, the child becomes
a root and its parents are never censused. Every baseline row `<parent> :: <child> :: tier1-unenrolled-or-unstoried`
is then classified `carried` instead of `stale`: the gate stays green and `--update-baseline` keeps the rows. They
fail the first unrelated PR that touches a parent. Make the gate and the writer census every baseline parent whose
row names a file this diff touched, so the paid-off rows surface as `stale` in the same PR and the writer removes them.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

### 3.1 The reproduction already exists in history

`FACT` — `git show ce0a9afb0:scripts/surface-census-baseline.json` (Task 825's base): **653** keys, of which
**7** end `:: src/modules/listings/components/LightboxView.tsx :: tier1-unenrolled-or-unstoried`. Their parents:
`src/app/[locale]/ci/click-shield-modal/page.tsx` · `src/app/[locale]/listings/[slug]/page.tsx` ·
`src/app/admin/listings/[id]/preview/page.tsx` · `MantineListingDetailPattern.tsx` · `MantineListingGalleryPattern.tsx` ·
`ListingDetailView.tsx` · `ListingGallery.tsx`. At `c177a0920` (825 committed): **646** keys, **0** of those 7.

`FACT` — `docs/sessions/evidence/task825/15_surface-census-changed_update-baseline.txt`: the writer, run on 825's
working tree with `--base HEAD`, printed `Included surfaces (4)` (the two gallery controls, `theme.ts`, `LightboxView.tsx`)
and `entries written: 653`. It kept all 7 rows. Task 825 removed them by a scoped manual proof (kickoff §16.3), which
is what filed this task.

### 3.2 Why — source

`FACT` — `scripts/map-changed-surfaces.mjs:301-322` `resolveSurfacesFor`: breadth-first climb over `renderedBy`, and
`if (isSurfaceRoot(cur, manifestSet)) { roots.add(cur); continue; // never climb past a root }`. `isSurfaceRoot` is
`manifestSet.has(relPath) || relPath.startsWith('src/app/')` (`:273-275`). A freshly enrolled child is a manifest
entry, so its parents are never reached.

`FACT` — `scripts/check-surface-census-changed.mjs:144-158` `compareToBaseline`: a baseline key whose **surface**
(first segment) is not in `censusedSurfaces` is `carried`. `:171-192` `computeBaselineUpdate` preserves every
un-censused surface's keys byte-identically. Both receive `censusedSurfaces = new Set(pipeline.mapping.included)`
(`:523`, `:568`). A row keyed on a parent surface is therefore invisible whenever the parent is not itself mapped.

`FACT` — `runMapping`'s success result (`map-changed-surfaces.mjs:423-433`) returns `included` and `excluded` but not the changed candidate list. The key format
is `"<surface> :: <node> :: <reasonCode>"` (`:128-133`).

`FACT` — CLI flags today: `--base`, `--head`, `--max-changed-files`, `--max-surfaces`, `--update-baseline`,
`--seed-baseline`, `--verify-gate`. The baseline path is the constant `BASELINE_PATH` (`:61`). The self-test has
8 arms (`ARM_COUNT = 8`, `:284`). CI runs the gate and `:verify` in the `governance` job (`governance-pr.yml:131,134`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2 | After mapping, the run computes **parent surfaces to re-census**: every surface `S` such that a baseline key `S :: N :: *` has `N` ∈ (changed candidate files ∪ `mapping.included`) and `S` ∉ `mapping.included`. Each such `S` is censused with the same `censusSurface` call and failure handling as a mapped surface. | **P0** | AC2, AC3 | Confirmed |
| **R2** | §3.2 | `censusedSurfaces` passed to **both** `compareToBaseline` and `computeBaselineUpdate` is `mapping.included ∪ R1's set`. Consequence: a paid-off row on such a parent is `stale` (gate exit 1 naming it), and the writer drops it. | **P0** | AC2, AC3 | Confirmed |
| **R3** | fail-closed | R1's surfaces count toward `--max-surfaces`. Exceeding the limit is the existing `surface-limit-exceeded` fail-closed result. A census exit 2 on an R1 surface is the existing `census-exit-2` result. Nothing is skipped silently. | **P0** | AC4 | Confirmed |
| **R4** | GR-2 | The run prints R1's set under its own heading (`Re-censused parent surfaces (n):`, each with the child key segment that pulled it in), next to `Included surfaces`, and the scope text states the rule. | P1 | AC2 | Confirmed |
| **R5** | mapping | `runMapping`'s success result adds `candidates` (the sorted changed `src` files that were resolved). No existing field changes meaning. `map-changed-surfaces.mjs`'s own behaviour and exit codes are otherwise unchanged. | P1 | AC5 | Confirmed |
| **R6** | testability | New optional `--baseline-path <file>` (default `scripts/surface-census-baseline.json`) used for reading in all modes and writing in `--update-baseline`. The default run is byte-for-byte the same command CI runs. | P1 | AC2, AC3 | Confirmed |
| **R7** | Q4 | `--verify-gate` gains arms 9 and 10 (pure functions, synthetic data, no git): **9** a baseline row `P :: C :: tier1-…` where `C` is changed and enrolled and `P` is not mapped → `P` is re-censused, the row with no current block is `stale`, and exit decision is non-zero; **10** the writer given the same inputs drops that row and keeps an unrelated un-censused surface's row byte-identical. `ARM_COUNT` becomes 10 and arms 1–8 are unchanged. | **P0** | AC1 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (measured at I0) — the working tree at execution still renders `LightboxView.tsx` from the same 7
  parents, so the historical reproduction (§12 AC2/AC3) is valid. **Stop:** if the I0 census of those parents
  differs, record the actual parent set and use it. The comparator is "exactly the parent rows whose current census
  has no matching block", not the literal number 7.
- `ASSUMPTION` — re-censusing parents can surface **other** baseline drift on those parents (paid-off debt unrelated
  to the child). That is correct behaviour and is reported, never filtered.
- No owner decision needed: the gate's contract (Task 819 decision 4, "fail closed") is unchanged; this closes a
  blind spot inside it.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-1 enforcement row) · `docs/agent-contract.md` clauses 9, 14 · `docs/qa-profiles.md` (Q4) ·
`scripts/check-surface-census-changed.mjs` in full · `scripts/map-changed-surfaces.mjs` in full ·
`scripts/check-surface-census.mjs` (`--json` output shape only) ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_825_LightboxView_Migration_And_Enrolment.md` §16.3 · this kickoff.

## 7. Scope

- **Edited:** `scripts/check-surface-census-changed.mjs` · `scripts/map-changed-surfaces.mjs` (R5 only) ·
  `docs/backlog.md` (831 state line).
- **Written:** `docs/sessions/evidence/task831/*` (scratch baselines live there, never in `scripts/`) ·
  `docs/sessions/<date>-task831-*.md`.

## 8. Out of scope

`scripts/surface-census-baseline.json` (the committed baseline is not rewritten by this task; if the final real run
with the default path reports stale rows, stop and report them, do not write) · `check-surface-census.mjs` ·
`check-rendered-scope.mjs` · CI workflow · `package.json`.

## 9. Current and required behavior

**Before.** Enrolling a child in PR X: gate green, writer keeps the parent rows. Unrelated PR Y touching a parent
fails on rows it did not create.
**After.** Enrolling a child in PR X: the gate names the parent rows `stale` in X, and the writer run in X removes
them. PR Y is unaffected.

## 10. Implementation requirements

1. **I0**: status snapshot; hashes of both scripts; the committed baseline's key count; `--verify-gate` (8/8);
   export `git show ce0a9afb0:scripts/surface-census-baseline.json` to
   `docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json` through Node UTF-8 I/O.
2. **Failing arms first:** add R6 (flag only) and arms 9/10 **before** R1/R2. Run `--verify-gate` and retain the
   non-zero transcript. Then run the historical reproduction (§13.1 lines 9–10) on the unfixed code and retain it:
   expected exit 0 with the LightboxView rows neither stale nor removed.
3. Implement R5, then R1–R4.
4. Re-run the arms and the reproduction.

## 11. Positive and negative flows

**Positive.** A PR enrols a component that three unenrolled parents render. The gate prints the three parents
under `Re-censused parent surfaces`, names the three rows stale, and exits 1. `update-baseline` removes exactly those
rows, and the next run exits 0.

| Negative flow | Applicable | Expected |
|---|---|---|
| Parent still genuinely blocks on the child (child not enrolled) | Yes | row stays `baselined`, not stale |
| Re-census pushes surface count over the limit | Yes | `surface-limit-exceeded`, exit non-zero (R3) |
| Parent census exits 2 | Yes | `census-exit-2`, exit non-zero (R3) |
| Unrelated un-censused surface's rows | Yes | byte-identical after writer (arm 10) |
| Empty diff (`--base HEAD --head HEAD`) | Yes | R1 set empty, arm 6 unchanged |

## 12. Acceptance criteria

- **AC1 [R7]** — `npm run check:surface-census:changed:verify`: retained pre-fix transcript shows arm 9 and/or 10
  FAIL (non-zero exit); post-fix `Arms run: 10`, all PASS, exit 0.
- **AC2 [R1, R2, R4, R6]** — historical gate run, `--base ce0a9afb0 --head c177a0920 --baseline-path <scratch>`:
  pre-fix exit 0 with no LightboxView row reported stale. Post-fix exit 1, the `Re-censused parent surfaces` block
  lists the LightboxView parents, and the stale list contains exactly every
  `<parent> :: src/modules/listings/components/LightboxView.tsx :: tier1-unenrolled-or-unstoried` key present in the
  scratch baseline. Quote both.
- **AC3 [R2, R6]** — the same range with `--update-baseline` on a **second** scratch copy: pre-fix, the written file
  still holds those keys. Post-fix, the key-set difference (scratch-before minus scratch-after) contains every one of
  those LightboxView keys, and every removed key is one the AC2 post-fix run printed as stale. Quote the difference,
  computed by a Node one-liner.
- **AC4 [R3]** — the same post-fix range run with `--max-surfaces` set to `included.length` (the count printed pre-fix)
  exits non-zero with `surface-limit-exceeded`. Quote it.
- **AC5 [R5, R6]** — `npm run check:surface-census:changed -- --base HEAD --head HEAD` (default baseline path) exits
  0 with `Re-censused parent surfaces (0)`, and `git diff -- scripts/surface-census-baseline.json` is empty.

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: AC2's "exactly every LightboxView key"
is the reproduction's defined input set, read from the scratch baseline, not a hard-coded count (§5).`

## 13. QA profile and verification plan

**`Q4`** — a blocking gate's scope changes, so failing-first arms and a real historical reproduction are required.

### 13.1 Baseline and reproduction (I0 and pre-fix)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/surface-census-baseline.json
npm.cmd run check:surface-census:changed:verify
node.exe -e "const {execFileSync}=require('child_process');require('fs').writeFileSync('docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json', execFileSync('git',['show','ce0a9afb0:scripts/surface-census-baseline.json']))"
node.exe -e "require('fs').copyFileSync('docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json','docs/sessions/evidence/task831/scratch-writer-prefix.json')"
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-writer-prefix.json --update-baseline
```

The last two lines run **after** R6 and arms 9/10 are added, **before** R1/R2 (§10.2). Expected: `win32`; `:verify`
8/8 at I0; the reproduction exits 0 and the writer keeps the LightboxView keys.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe -e "require('fs').copyFileSync('docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json','docs/sessions/evidence/task831/scratch-writer-postfix.json')"
npm.cmd run check:surface-census:changed:verify
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-writer-postfix.json --update-baseline
npm.cmd run check:surface-census:changed -- --base HEAD --head HEAD
npm.cmd run check:rendered-scope:verify
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks diff -- scripts/surface-census-baseline.json
git --no-optional-locks hash-object scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/surface-census-baseline.json docs/backlog.md
```

Expected: `:verify` exit 0 (10 arms); the historical run exits **1** (AC2, intended); the writer exits 0 (AC3); every
other command exits 0; the committed-baseline diff is empty. Run AC4 separately with the `included` count printed by
the pre-fix reproduction. Each command gets its own unpiped transcript with `EXIT_CODE=`.

## 14. Completion report contract

Files changed with hashes · R1–R7 · I0 + pre-fix transcripts · AC1–AC5 quotes including the Node key-set difference ·
every command with exit code and path · assumptions · deviations · limitations. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why not stop the mapper from treating an enrolled child as a root? | The root rule is what keeps the census bounded and is correct for new blocks. Only baseline-named parents need the extra census, which R1 targets exactly. |
| Why a `--baseline-path` flag? | The reproduction must run against 825's historical baseline without touching the committed file (§8). |
| Can R1 blow the limits? | It counts toward `--max-surfaces` and fails closed (R3, AC4). |
| GR-1 / 16d? | No visible surface. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `qa-profiles` Q4 | failing-first arms + real reproduction | AC1–AC3 | COMPLIANT |
| Sprint 75 decision 4 "fail closed" | no silent skip | R3, AC4 | COMPLIANT |
| `agent-contract` 9 / 14 | build exit 0; encoding-safe writes | §13.2, §10 | COMPLIANT |
| GR-2 | printed scope | R4 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | §13.1 first block | `:verify` not 8/8 → stop and report |
| 1 red | arms 9/10 + pre-fix reproduction | arms pass or reproduction removes rows on old code → `BLOCKED — TEST BLIND` |
| 2 fix | `:verify` 10/10 | any fail → not done |
| 3 reproduction | AC2/AC3 transcripts + key-set diff | any LightboxView key not stale/removed → not done |
| 4 limit | AC4 transcript | exit 0 → not done |
| 5 final | §13.2 | committed baseline diff non-empty or any unintended non-zero → not `IMPLEMENTED` |

## 16. Review 1 — `NEEDS REVISION` (2026-09-17)

**Owner decision, 2026-09-17, quoted verbatim:** "не створюй нову задачу, необхідно все зробити в рамках цієї
задачі." The hook-as-surface defect found during this task's reproduction is therefore **in scope for 831**. No
separate task number exists for it.

**Re-entry mode: `remediation`.** This section overrides §4, §7, §8, §12, §13 and the Appendix where they conflict.
Keep R1–R3 and R5–R7 as shipped. Keep these artifacts and **do not re-run or overwrite them**:
`scratch-baseline-ce0a9afb0.json`, `01`–`10`, and `08_ac3_keyset_diff.txt`. Transcripts `11`–`23` are superseded by
`40`+. Scratch baselines are copied from `scratch-baseline-ce0a9afb0.json` through Node UTF-8 I/O. Every file that
gets planted and restored gets `git hash-object` before and after.

### 16.1 Findings this revision closes

| Finding | Severity | Evidence at review | Correction |
|---|---|---|---|
| **F1** — a re-censused parent that no longer exists on disk makes the gate and the writer fail closed with no in-tool exit | **P1** | `computeReCensusSurfaces` never checks that `S` exists. `check-surface-census.mjs` `resolveSurface` exits **2** on a missing file (`:76-78`, `:378-380`), so `runPipeline` returns `census-exit-2`, and `--update-baseline` refuses any `failClosed` pipeline. Before 831, a deleted parent's rows were `carried`. Now a PR that deletes parent `P` and edits child `C` (row `P :: C :: *`) cannot pass, and the writer cannot clear it. R1's original wording ("same failure handling") caused this — a kickoff defect. | **R8** |
| **F2** — R4's "the scope text states the rule" is not implemented, and the session log says it is | P2 | The diff adds only the heading and the `<- node` lines; the rule sentence is a code comment. `06_postfix_gate_repro.txt:128-144` prints no rule line. The session log §2 R4 row claims "plus a one-line rule statement". | **R9** |
| **F3** — AC3's pre-fix writer run has no transcript | P2 | §13.1's last line has no retained output. `scratch-writer-prefix.json` is still byte-identical to its source (653 keys, `116117` bytes). A pre-fix writer run would have re-serialized it and added the hook block (654). | **AC8** |
| **F4** — a `.ts` file censused as a surface blocks on itself | **P1** | `04_prefix_gate_repro.txt`: new block `src/hooks/useKeepActiveInView.ts :: src/hooks/useKeepActiveInView.ts [tier1-unenrolled-or-unstoried]`. Source: `map-changed-surfaces.mjs` `buildRenderGraph` adds only JSX-render edges (`:259-266`), and `resolveSurfacesFor` makes a file with no renderer its own root (`:312-313`). `check-surface-census.mjs:538-547` then blocks any tier-1 node without manifest+Story, **including the depth-0 root**. A `.ts` file cannot contain JSX, so it is never a component. Measured on the committed baseline: 646 keys, **155** of which are `X.ts :: X.ts :: tier1-unenrolled-or-unstoried` (hooks, `route.ts` handlers, `theme.ts`, libs). **0** keys have a `.ts` node under a different surface. Every new hook or util file therefore fails the first PR that adds it (Task 825 added `useKeepActiveInView.ts`), and the 155 rows are false debt. | **R11, R12** |
| **F5** — AC2's literal "pre-fix exit 0" does not hold for the specified range | kickoff defect | That exit 1 comes from F4's block. | AC2 amended below |

### 16.2 Added requirements

| ID | Observable requirement | P | Verification |
|---|---|---|---|
| **R8** | Split R1's set by whether `S` exists as a file under `ROOT` at run time. **Existing** `S`: unchanged (R1/R3 — censused; exit 2 is `census-exit-2`). **Missing** `S`: not passed to `censusSurface`. It still joins `censusedSurfaces` with **zero** measured blocks, so every baseline key on `S` is `stale` in the gate and dropped by the writer. It still counts toward `--max-surfaces`, and it prints under `Re-censused parent surfaces` with the suffix ` [missing on disk — rows retired]`. The existence check is injectable (for example `runPipeline(..., censusFn, existsFn = existsSync)`) so an arm can drive it without git or the filesystem. A missing **mapped** surface is not in scope; the mapper already excludes `D` entries. | **P0** | AC6, AC7 |
| **R9** | `printScopeBlock` prints one rule line directly under the `Re-censused parent surfaces (n):` entries, **in every mode and also when n = 0**. Suggested text: `    Rule: a baseline row <parent> :: <node> re-censuses <parent> when <node> is a changed file or an included surface and <parent> is not itself included (one hop; a missing parent retires its rows).` The wording is free, but it must state both the one-hop limit and the missing-parent rule. Correct the session log's R4 row to match what is printed. | P1 | AC5 re-run, AC6 |
| **R10** | `--verify-gate` gains **arm 11**. Synthetic baseline `{P :: C :: tier1-…, E :: C :: tier1-…}`, candidates `[C]`, included `[]`. The existence fn reports `P` missing and `E` present. The census fn **throws if called with `P`**, and for `E` returns a blocking list containing `E :: C`. Assert: (a) the census fn was never called for `P`; (b) `P :: C` is `stale` and `E :: C` is `baselined`; (c) the exit decision is non-zero; (d) `computeBaselineUpdate` drops `P :: C` and keeps `E :: C`. Drive it through the same exported code path the CLI uses — `runPipeline` with an injectable mapping fn, or a new exported helper that `runPipeline` itself calls. Do not re-implement the union inside the arm. | **P0** | AC6 |
| **R11** | `scripts/check-surface-census.mjs`: the **depth-0 root** whose path ends in `.ts` (not `.tsx`) is recorded with a non-component marker (for example `tier: 'root-non-component'`, shown in the human table and in `--json` `nodes`). It is **never** pushed to `blockingNodes` as `tier1-unenrolled-or-unstoried`. Everything else stays as it is: `.tsx` roots, every depth ≥ 1 node whatever its extension, `unparseable-source`, the tier-2 and tier-3 rules, the walk, exit codes and the `--json` shape (additive only). The human and `--json` scope text each state the rule and its blind spot: "a `.ts` root is not a component; a `.ts` module that renders through `createElement` or re-exports a component under a non-barrel name is not walked". `map-changed-surfaces.mjs`'s root rule is **unchanged**. A hook edit cannot change its callers' JSX render edges, so the callers do not need a census. | **P0** | AC9, AC11 |
| **R12** | `--verify-gate` gains **arm 12** (real subprocess, real fs, no git; the same shape as arm 6). `censusSurface('src/hooks/useKeepActiveInView.ts')` is `ok`, with no blocking entry whose node equals the surface. `censusSurface('src/modules/listings/components/ListingGallery.tsx')` still returns at least one blocking entry (it is a baselined `.tsx` surface at review time — **re-measure at I0**; if it no longer blocks, pick any baselined `.tsx` surface whose self row exists and record which). `ARM_COUNT` becomes **12**, and arms 1–10 are unchanged. | **P0** | AC6 |
| **R13** | **Retire the false `.ts` self rows from the committed baseline in this task** (§8 is amended for this requirement only). The set `T` = every key in `scripts/surface-census-baseline.json` where surface === node, the path ends in `.ts`, and reasonCode is `tier1-unenrolled-or-unstoried`. Take its size from the file at execution (155 at review). For **each** surface in `T`, run the post-R11 `check-surface-census.mjs --surface <s> --json`. Every one must exit 0 or 1 with no blocking entry whose node equals `s`. If any exits 2 (for example the file is gone) or still self-blocks, **stop and report it — no write**. Then write the baseline minus exactly `T` with Node, through the script's own serializer (export `writeBaselineFile` or call it) — never a hand-written JSON string. Prove the serializer is canonical: `--update-baseline --base HEAD --head HEAD` right afterwards leaves `git hash-object` unchanged. No key outside `T` is removed or added. | **P0** | AC10 |

### 16.3 Acceptance criteria — amended and added

- **AC2 (amended)** — Post-fix, `--base ce0a9afb0 --head c177a0920` on the unchanged scratch baseline prints **no**
  new block. Its stale list is exactly the 7 LightboxView keys plus every `X.ts :: X.ts` key in the scratch baseline
  whose `X` is an included or re-censused surface in that run (`src/design-system/mantine/theme.ts` at review —
  quote the actual set). Exit 1. The pre-fix comparator stays "no LightboxView key in the stale set" (`04`).
- **AC3 (amended)** — The post-fix writer on a fresh scratch copy removes exactly the AC2 stale set and adds nothing.
  Quote the Node key-set difference.
- **AC6 [R8–R10, R12]** — Red first. Add arms 11 and 12 **before** R8 and R11, and retain `30_verify_red.txt` (arms
  11 and 12 FAIL, arms 1–10 PASS, exit non-zero). Then implement, and retain `31_verify_green.txt` (`Arms run: 12`,
  12 passed, exit 0).
- **AC7 [R8]** — A real run against a missing parent, with no git mutation. Copy the scratch baseline to
  `scratch-missing-parent.json`, and add with Node one key:
  `src/fake/task831/DeletedParent.tsx :: src/modules/listings/components/LightboxView.tsx :: tier1-unenrolled-or-unstoried`.
  Copy that file to `scratch-missing-parent-writer.json`. Expected: the gate lists `DeletedParent.tsx` under
  `Re-censused parent surfaces` with the missing-on-disk suffix and names that key as stale; `census-exit-2` does
  **not** appear. The writer exits 0, and the Node key-set difference contains that key. Retain
  `32_ac7_missing-parent_gate.txt`, `33_ac7_missing-parent_writer.txt` and `34_ac7_keyset_diff.txt`.
- **AC8 [R2, closes F3]** — Pre-fix writer red evidence through a temporary revert with a hash witness. Record
  `git hash-object scripts/check-surface-census-changed.mjs`. In `main()`'s `--update-baseline` branch only, set
  `censusedSurfaces` to `new Set(pipeline.mapping.included)`. Re-copy `scratch-writer-prefix.json` from the scratch
  baseline, then run §13.1's last line. Retain `35_ac8_prefix_writer.txt`, plus a Node key-set check
  `36_ac8_prefix_keyset.txt` showing all 7 LightboxView keys still present. Restore the line through Node UTF-8 I/O,
  and prove the hash equals the recorded one before any other step. Never use `git checkout` or `git restore`.
  Run AC8 **before** R11, so the pre-fix state is the shipped R1–R7 code.
- **AC9 [R11]** — Before and after, on the real files:
  `node.exe scripts/check-surface-census.mjs --surface src/hooks/useKeepActiveInView.ts --json`. Pre-R11 (retain
  `37_ac9_hook_pre.txt`): exit 1 with a self block. Post-R11 (`38_ac9_hook_post.txt`): exit 0, the root marked
  non-component, 0 blocking. A `.tsx` control surface (R12's) keeps the same blocking key set before and after
  (`39_ac9_tsx_control_pre.txt` / `_post.txt`; Node key-set comparison equal).
- **AC10 [R13]** — `41_ac10_T_census.txt` lists every surface in `T` with its exit code and its self-block count
  (all 0). `42_ac10_retire.txt` shows the key count before, `|T|`, and after (= before − `|T|`), plus a Node check
  that removed = `T` exactly and added = ∅. `43_ac10_canonical.txt` holds the hash before and after
  `--update-baseline --base HEAD --head HEAD` (equal).
- **AC11 [R11, no regression]** — After R13, `npm.cmd run check:surface-census:changed -- --base HEAD --head HEAD`
  exits 0. The real working-tree diff run `node.exe scripts/check-surface-census-changed.mjs --base HEAD` exits 0
  **or** fails only with keys the report names and explains; a new `.ts` self block there is a failure.
  `npm.cmd run check:media-enrolment` and `npm.cmd run audit:design-system-patterns` exit as they did at I0 (retain
  both, before and after).

### 16.4 Scope amendment

**Edited:** `scripts/check-surface-census-changed.mjs` · `scripts/map-changed-surfaces.mjs` (R5 only; root rule
unchanged) · `scripts/check-surface-census.mjs` (R11 only) · `scripts/surface-census-baseline.json` (R13 only:
removing exactly `T`) · `docs/backlog.md` (831 state line) · the Sprint 75 plan Tasks-table row for 831. **Still out
of scope:** `check-rendered-scope.mjs`, the CI workflow, `package.json`, and every `src/` file.

### 16.5 Verification plan for the revision

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks hash-object scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/check-surface-census.mjs scripts/surface-census-baseline.json
npm.cmd run check:surface-census:changed:verify
node.exe scripts/check-surface-census.mjs --surface src/hooks/useKeepActiveInView.ts --json
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-baseline-ce0a9afb0.json
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-writer-postfix2.json --update-baseline
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-missing-parent.json
node.exe scripts/check-surface-census-changed.mjs --base ce0a9afb0 --head c177a0920 --baseline-path docs/sessions/evidence/task831/scratch-missing-parent-writer.json --update-baseline
npm.cmd run check:surface-census:changed -- --base HEAD --head HEAD
node.exe scripts/check-surface-census-changed.mjs --base HEAD
npm.cmd run check:media-enrolment
npm.cmd run audit:design-system-patterns
npm.cmd run check:rendered-scope:verify
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/check-surface-census.mjs scripts/surface-census-baseline.json docs/backlog.md
```

`scratch-writer-postfix2.json` is a fresh copy of `scratch-baseline-ce0a9afb0.json`, made just before its line.
Expected results:
- `:verify` 12/12, exit 0.
- The hook census exits 0 with 0 blocking.
- The ce0a9afb0 gate exits 1 with no new block and the AC2 stale set.
- Both writers exit 0.
- The missing-parent gate exits 1, and `census-exit-2` does not appear.
- The empty-diff run exits 0 and prints the R9 rule line under `(0)`.
- The working-tree run follows AC11.
- Every other command exits 0, or matches its I0 result where AC11 says so.
- The baseline diff contains only removals, equal to `T`.

Number the final transcripts `40`+. Write every transcript without a BOM (Node I/O, or the session log's §6 BOM strip
under an explicit manifest).

### 16.6 Completion report delta

Update the session log in place. Add rows for R8–R13 and AC6–AC11, correct the R4 row, confirm the Files Changed
table against the final diff (now five tracked files), and mark `11`–`23` as superseded. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` in the backlog line and the Sprint 75 Tasks-table row.
