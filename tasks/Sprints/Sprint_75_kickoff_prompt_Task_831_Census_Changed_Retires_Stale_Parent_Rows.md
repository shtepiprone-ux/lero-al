# Task 831 — `check:surface-census:changed` cannot see a stale `<parent> :: <child>` row when the child's own diff enrols it

Sprint 75 · P2 · QA profile **Q4**

**Status: `READY FOR SONNET` 2026-09-17.** Unblocked: Task 825 is committed (`c177a0920`), which was this task's
precondition.

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
