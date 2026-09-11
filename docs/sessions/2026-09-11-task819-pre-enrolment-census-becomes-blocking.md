# Task 819 — GR-1's pre-enrolment half becomes blocking: the diff names the surfaces, and every one of them is censused

Sprint 75 · P0 · QA profile Q4. Executor: Sonnet.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 1. §13.1 baseline and the three measured numbers (captured/measured before CI wiring)

`docs/sessions/evidence/task819/R0_baseline-13.1.txt` — `win32`, node `v22.22.3`, clean tree at commit
`18a519edd15a6c634809673caa38d9df9e8506d9`; `check:rendered-scope` exit 0 (29 baselined/0 new/0 stale);
`check:story-coverage` exit 0 (38 covered/0 unproven); `check-surface-census.mjs --surface FavoritesShell.tsx
--report` exit 0, 15-node table.

**The three §13.1 numbers, measured with the mapper prototyped, before any CI wiring** (per the kickoff's own
ordering — §13.1's header block covers the check:rendered-scope/check:story-coverage/census baseline specifically;
building and running the mapper first to answer the CONFLICT question is what §13.1's own closing paragraph asks
for):

1. **Candidate/mapped-surface counts, 4 real historical base/head pairs** (`Rev0_sample1_fixed.txt` through
   `Rev0_sample4_fixed.txt`): 109 changed files → 15 surfaces; 286 changed files → 30 surfaces; 54 changed files → 1
   surface; 138 changed files → 22 surfaces.
2. **Seed baseline block count**: 140 pre-existing (surface, node, reasonCode) triples from a live run at execution
   commit (`Rev0_seed-baseline.txt`).
3. **Unresolved rate — the number that decides whether fail-closed is livable**: **0 unresolved candidates across
   all 4 samples (587 combined changed files)**. `§5's CONFLICT did not fire.` No `BLOCKED — OWNER DECISION REQUIRED`
   status is warranted; route as originally scoped.

One mapping-correctness fix made during this measurement, before any CI wiring: the first pass treated a changed
`.stories.tsx`/`.test.tsx` file as a valid resolution candidate; since nothing in the render graph renders a story/test
file, it wrongly resolved to itself as a "surface root" (e.g. `ListingCardTrack.stories.tsx` appeared in `included`).
Fixed by excluding story/test files from candidacy with a new `story-or-test-file` reason, mirroring their existing
exclusion from the render graph itself. Confirmed via re-run: surface counts dropped from the inflated
41/2 to the correct 30/1 for the affected samples, 0 unresolved unaffected.

## 2. Requirement and acceptance-criteria evidence

| Req | AC | Evidence | Result |
|---|---|---|---|
| R1 (deterministic diff→surface mapper, upward resolution, included/excluded scope) | AC1, AC2, AC6 | `AC1_determinism_probe.txt` — two runs, identical SHA-256 of `--json` output, exit 0 both. `AC2_scope-block_probe.txt` — a real diff with `outside-src`, `not-ts-tsx` and `deleted` all present with distinct reasons, `included` non-empty. `AC6_unresolved-candidate_probe.txt` — a real 2-file on-disk cycle (`__task819_scratch_Orphan.tsx`/`Ghost.tsx`, cleaned up after) resolves `unresolved:true` via the exact production `resolveSurfacesFor`/`buildRenderGraph` functions. | Confirmed |
| R2 (`check-surface-census.mjs --json`, additive, byte-unchanged human/`--report`) | AC3, AC10 | `AC3_json-parity_probe.txt` — valid JSON, same exit code (1) as the non-`--json` run for the same surface. `git diff` on `check-surface-census.mjs` shows only additions/relocations, no removed print statement (verified via `git diff \| grep '^-'`). | Confirmed |
| R3 (`check:surface-census:changed` runner, per-surface census aggregation) | AC4 | `Rev0_gate-after-seed.txt` / `G06_check-surface-census-changed.txt` — 15 surfaces censused, 140 blocks aggregated, scope block printed, exit 0. | Confirmed |
| R4 (versioned baseline `scripts/surface-census-baseline.json`, bootstrap refusal, tier-2 refusal) | AC5, AC7, AC8 | `scripts/surface-census-baseline.json` — `version:1`, `blocks` object, 140 sorted keys. `AC7_two-arms_probe.txt` — deleted entry → new; entry-with-no-match → stale; two different failures, one transcript. `AC8_bootstrap-and-tier2-refusal_probe.txt` — baseline moved aside → `--update-baseline` refuses (exit 1, names path, writes nothing); planted new tier-2 block → gate names it AND `--update-baseline` refuses it (entries unchanged at 139, key stays absent). | Confirmed |
| R5 (fail closed: merge base, limits, unresolved, census exit 2, bad baseline) | AC6, AC9 | `AC9_fail-closed_probe.txt` — changed-file limit (5) below real diff (109) → exit 1 naming both numbers; unreachable merge base (garbage ref) → exit 1 naming the condition and the refs tried. `AC6` above covers the unresolved-candidate arm. Bad-baseline arm covered by `AC8` part 1 (missing) and `AC7` (stale/unparseable-shape logic shared with `check-rendered-scope.mjs`'s proven `loadBaselineFile`). | Confirmed |
| R6 (scope block: counts, limits, cannot-see sentence) | AC6 | Every gate transcript (`G06`, `Rev0_gate-after-seed.txt`, etc.) prints changed/excluded/included/censused/baselined/new/stale counts, the limits, and the cannot-see sentence. | Confirmed |
| R7 (6-arm CI-safe self-test, shared `evaluateGateExitCode`) | AC11 | `Rev0_verify-second-try.txt` — 6/6 PASS, exit 0. `AC11_broken-arm_probe.txt` — `evaluateGateExitCode` forced to always return 0 (via Node read/write, not PowerShell `Get-Content -Raw`, per the kickoff's own §10.7 warning) → arms 2/3/4 FAIL (3 passed, 3 failed), exit 1; restored, `git hash-object` identical, `check:mojibake`/`check:file-integrity` clean afterward. | Confirmed |
| R8 (CI wiring: blocking step + verify step, no wrapper) | AC12 | `git diff -- .github/workflows/governance-pr.yml` — two new steps immediately after `check:rendered-scope:verify`, neither carries `continue-on-error` or any wrapper; the gate step passes `SURFACE_CENSUS_BASE_SHA`/`SURFACE_CENSUS_HEAD_SHA` from the PR's base/head SHAs. | Confirmed |
| R9 (golden-rules.md: both halves enforced, nothing else touched) | AC13, AC14 | `git diff --stat -- docs/golden-rules.md` (12 insertions/10 deletions) and a line-scoped diff confirm only the GR-1/GR-3 rows and the closing paragraph changed. Both now state both halves enforced (the CONFLICT did not fire, so no hedged wording was needed). | Confirmed |
| R10 (storybook-governance.md §15.7) | AC15 | New §15.7 added immediately after §15.6's "Status as landed" paragraph (which is verified byte-identical — see §4 below); states the mapping rule, the limits, every fail-closed condition, the baseline shape/ratchet, and the cannot-see list including the `fetch-depth: 0` dependency. | Confirmed |
| R11 (check-rendered-scope.mjs/its baseline/allowlist/manifest/check-story-coverage.mjs untouched) | AC10 | `G15_hashes-and-AC10.txt` — `git diff --stat` empty for all five named files; `check:rendered-scope` (29/0/0), `check:story-coverage` (38/0) and the 15-node census table reproduce §13.1's baseline exactly. | Confirmed |

GR-4 AC audit: 15 criteria, each an observable property (hashes, counts, exit codes, named conditions, diff scope);
no absolute assertion of the AC10/812-AC8 mistake shape — AC10's "empty diff" is scoped to five named files this
task deliberately does not touch, captured as a measured before/after pair, and AC1's "byte-identical" is the
determinism requirement itself, not an assumption about unrelated state.

## 3. Current versus required behavior

**Before.** `check:rendered-scope` (blocking, Task 818) only ever walks enrolled roots. `check-surface-census.mjs`
(Task 817) censuses one named surface, run by hand — no CI job knew which surface a given PR was about, so a change
to a wholly unenrolled surface (the Task 809 shape) was invisible to every gate.

**After.** `check:surface-census:changed` maps the PR's own base..head diff to the surfaces it affects and censuses
each one; a new (un-baselined) blocking node fails the PR, naming surface/node/reason. The mapper fails closed —
never a silent skip — when it cannot determine a merge base, when either limit is exceeded, when a changed file
resolves to no surface, or when a mapped surface's own census is unusable. The included/excluded scope is printed on
every run.

Negative flows (§11's table) all exercised: merge base unreachable (AC9 arm 2), limit exceeded (AC9 arm 1),
unresolved candidate (AC6), a block already baselined (AC7 arm implicit in the 140/0/0 clean run), a stale baseline
entry (AC7 arm 2), a new tier-2 block refused by `--update-baseline` (AC8 part 2), baseline missing (AC8 part 1).

## 4. Files Changed

| Path | Reason |
|---|---|
| `scripts/map-changed-surfaces.mjs` (new) | The deterministic diff→surface mapper: git merge-base/diff, whole-`src/` reverse render graph, upward BFS resolution with cycle-safe unresolved detection, `--json`/human CLI, exported pure functions for reuse. |
| `scripts/check-surface-census.mjs` | Additive `--json` flag (R2): `blockingNodes`/`tier3Nodes` computation moved earlier (unchanged logic) so `--json` can use it without duplication; human output and `--report` mode unchanged (verified via diff). |
| `scripts/check-surface-census-changed.mjs` (new) | The runner: calls the mapper, censuses every included surface via subprocess `--json`, aggregates blocks, compares/updates against its own versioned baseline, fails closed, 6-arm self-test. |
| `scripts/surface-census-baseline.json` (new) | Seeded via the one-time `--seed-baseline` flag (never wired into any npm script) — 140 (surface, node, reasonCode) entries from a live run. |
| `package.json` | Three new script entries: `check:surface-census:changed`, `:update-baseline`, `:verify`. |
| `.github/workflows/governance-pr.yml` | Two new steps in the `governance` job, immediately after `check:rendered-scope:verify`: the gate (env-supplied base/head SHAs) and its self-test. |
| `docs/golden-rules.md` | GR-1/GR-3 `Enforcement status` rows and the closing paragraph updated to state both halves (enrolled-subgraph + pre-enrolment) are now enforced. Nothing else in the file touched. |
| `docs/storybook-governance.md` | New §15.7 describing the mechanism, fail-closed conditions, cannot-see list and landed status. §15.6 verified byte-identical. |
| `docs/backlog.md` | Sprint 75 row and task-registry row 55: Task 819 status → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Still 80 lines. |
| `docs/sessions/evidence/task819/*` (new) | All command transcripts and probe witnesses for this task. |

## 5. Validation evidence

§13.2 final gate block, all native `win32` PowerShell, `node v22.22.3`, working directory
`C:\Claude_Code_Projects\lero-al` — platform/version/pwd/command/exit code recorded inside every transcript (R12
shape, per the kickoff's explicit instruction):

| Command | Exit | Transcript |
|---|---|---|
| `node --check scripts/map-changed-surfaces.mjs` | 0 | `G01_check-mapper.txt` |
| `node --check scripts/check-surface-census.mjs` | 0 | `G02_check-census.txt` |
| `node --check scripts/check-surface-census-changed.mjs` | 0 | `G03_check-runner.txt` |
| `npm run typecheck` | 0 | `G04_typecheck.txt` |
| `npx eslint <the three changed scripts>` | 0 | `G05_eslint.txt` |
| `npm run check:surface-census:changed -- --base f46c487d5 --head HEAD` | 0 (140 baselined/0 new/0 stale) | `G06_check-surface-census-changed.txt` |
| `npm run check:surface-census:changed:verify` | 0 (6/6 arms) | `G07_check-surface-census-changed-verify.txt` |
| `npm run check:rendered-scope` | 0 (unchanged, 29/0/0) | `G08_check-rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | 0 | `G09_check-rendered-scope-verify.txt` |
| `npm run check:story-coverage` | 0 (unchanged, 38/0) | `G10_check-story-coverage.txt` |
| `npm run check:stories` | 0 | `G11_check-stories.txt` |
| `npm run build` | 0 | `G12_build.txt` |
| `npm run check:file-integrity` | 0 | `G13_check-file-integrity.txt` |
| `npm run check:mojibake` | 0 | `G14_check-mojibake.txt` |

`git hash-object` of every changed file, and AC10's unchanged-gate re-verification, both captured together in
`G15_hashes-and-AC10.txt`.

Planted-arm evidence: §2 above cross-references every AC's probe transcript.

## 6. Visual source trace / Canonical UI decision record

Not applicable — this task changes `scripts/`, `package.json`, one workflow file and two `.md` files. No rendered
UI, no visible component, no Storybook artifact is touched (R11/AC10's zero-diff on the five named unrelated files
confirms this).

## 7. Assumptions, deviations, limitations

- **`ASSUMPTION` (stated, load-bearing).** "Unresolved" is defined precisely: a candidate is unresolved only when a
  fully-explored breadth-first climb over the whole-`src/` render graph visits a non-empty, closed set of nodes, none
  of which is a manifest entry, a route file under `src/app/**`, or a node with zero renderers (which is itself
  treated as a root by definition — "a file nothing renders is itself a surface root"). In practice this means
  "unresolved" only fires for a genuine, rootless import cycle. Measured: 0 such cases in 587 real changed files
  across 4 historical samples.
- **`ASSUMPTION` (stated, matching Task 818 Revision 1's R13 precedent).** `--update-baseline` never bootstraps a
  missing file (always refuses, per R4's "once seeded" wording read as: the ordinary flag is hardened from the
  start). The one-time initial write used a separately-named `--seed-baseline` flag — never wired into any `npm run`
  script, prints what it is about to record before writing, and itself refuses if the file already exists. This
  mirrors exactly the escape-hatch shape Task 818 Revision 1's R13 specified as optional; here it was necessary to
  satisfy §10 requirement 5 ("seeded... written by `--update-baseline`") without ever making the ordinary
  `--update-baseline` command capable of laundering debt from nothing.
- **Deviation, discovered and fixed during §13.1 measurement, before CI wiring:** story/test files were initially
  valid resolution candidates and wrongly self-resolved as surface roots; fixed by excluding them with a new
  `story-or-test-file` reason (§1 above).
- **Deviation, AC6's construction method.** `git diff` never lists an untracked file, and Sonnet cannot run `git add`
  (even `-N`/intent-to-add, which is still a mutating index operation) to make one visible to it. AC6 was therefore
  proven via a direct call to the exact production `buildRenderGraph()`/`resolveSurfacesFor()` functions against a
  real on-disk scratch file pair (not a synthetic/mocked graph) rather than through the full CLI's git-diff path. This
  is a real limitation of the `--head`-omitted "diff against working tree" local convenience mode specifically — CI
  always supplies two real committed SHAs, so this limitation does not apply there.
- **`LIMITATION`, found by Opus's review (kickoff §17.2 defects 1-2), corrected in Revision 1 (§10 below).** The
  original `compareToBaseline`/`computeBaselineUpdate` treated the whole baseline as if this run measures every
  surface, copying `check-rendered-scope.mjs`'s unconditional stale rule without accounting for the fact that this
  run is diff-scoped: it only ever censuses the surfaces the current diff maps to. A baseline entry belonging to any
  other surface was wrongly reported `stale` (and `--update-baseline` would have deleted it), so the gate passed only
  on the exact diff the baseline was seeded from. The five named files (`check-rendered-scope.mjs`,
  `rendered-scope-baseline.json`, `rendered-scope-allowlist.json`, `mantine-migration-scope.json`,
  `check-story-coverage.mjs`) remain byte-unchanged (R11/AC10) — that finding stands.

## 8. Opus handoff

- Evidence root: `docs/sessions/evidence/task819/`.
- Verify independently: the "no bootstrap, separate `--seed-baseline`" design choice (§7) — does it satisfy R4's
  "once seeded" wording as intended, or was a different reading meant?
- Verify AC6's construction method (§7's second deviation) — confirm the direct-function-call proof is accepted as
  equivalent to a CLI run for this specific, git-imposed constraint.
- The render graph (`buildRenderGraph()`) walks all 419-421 production files under `src/` on every invocation that has
  at least one candidate to resolve; confirm this is an acceptable CI cost (not separately timed in this pass beyond
  the gate's own transcript timestamps — recommend checking the `governance` job's actual wall-clock delta once this
  merges).
- Recommend running `npm run check:surface-census:changed -- --base <real-PR-base> --head <real-PR-head>` once more
  natively before approval, since this is exactly the command CI will now block on.

## 9. Backlog update

`docs/backlog.md` Sprint 75 row and task-registry row 55 updated in place — Task 819 status changed to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a one-line evidence pointer to this session log. File line count:
**80** (at the stated budget, not a breach — no BACKLOG LIMIT BREACH).

---

## 10. Revision 1 — 2026-09-11 (remediation for Opus's `NEEDS REVISION`, one P0)

Re-entry mode: `remediation`, per kickoff §17.1. The mapper, the runner's fail-closed conditions, the census
`--json` patch, the CI hunk and the unresolved-rate measurement were **not re-done**. The forbidden-re-run artifacts
(`R0_baseline-13.1.txt`, `Rev0_sample1_fixed.txt`–`Rev0_sample4_fixed.txt`, `Rev0_seed-baseline.txt`,
`Rev0_verify-first-try.txt`/`Rev0_verify-second-try.txt`, `AC6_unresolved-candidate_probe.txt`, `AC1`/`AC7`/`AC8`/
`AC9`/`AC11` probes) were confirmed untouched — `Rev1_15_hashes-and-AC10.txt` shows every one of them still `??`
(untracked, never `M`), and none was opened for write this pass.

### 10.1 Requirement and acceptance-criteria evidence (Revision 1)

| Req | AC | Evidence | Result |
|---|---|---|---|
| R12 (staleness scoped to what the run measured; `--update-baseline` merges) | AC16, AC17 | `AC16_narrow-diff-carried_probe.txt` — the same pair the P0 was found on (`f46c487d5..HEAD`, 15/268 baselined surfaces): a reconstruction of the OLD comparator on the SAME data shows 550 wrongly-stale entries (exit 1); the FIXED comparator on the same run shows 0 stale, 550 carried, exit 0 — both in one transcript. `AC17_merge-update-baseline_probe.txt` — `--update-baseline` on that pair is a true no-op (690 entries before and after, byte-identical hash), and the tier-2 refusal (repeating AC8) still fires correctly under the merge logic. | Confirmed |
| R13 (re-seed across the candidate space, not one diff) | AC18 | `AC18_reseed-candidate-space_probe.txt` — 291 candidate-space surfaces (38 manifest + route files + orphans) censused, 690 blocks written (delta: +550 blocks, +253 surfaces vs the prior 140/15). A run on `Rev0_sample2_fixed.txt`'s pair (`0c673fef1..37e99dc31`) reports **0 new** after a second real defect (below) was found and fixed. | Confirmed |
| R14 (each entry carries `reasonCode`) | AC19 | `scripts/surface-census-baseline.json` — 690/690 entries carry `reasonCode`; a `tier2-legacy-primitive` example quoted. | Confirmed |
| R15 (self-test gains carried-vs-stale arms) | AC20 | `Rev1_07_check-surface-census-changed-verify.txt` — 8 arms, all PASS, exit 0. `AC20_broken-arm_probe.txt` — the carried-vs-stale distinction reverted to the old unconditional-stale logic (via Node read/write, not PowerShell `Get-Content -Raw`) → arm 7 FAILS naming itself, `7 passed, 1 failed`, exit 1; restored, `git hash-object` identical, self-test re-run 8/8. | Confirmed |
| R16 (session log + §15.7 corrected) | AC21 | §7 above no longer says "no limitation found"; `docs/storybook-governance.md` §15.7 states the carried/stale/new distinction and the merge semantics (quoted in the diff — see §10.3). | Confirmed |

GR-4 AC audit (Revision 1): 6 criteria (AC16-AC21), each an observable property (counts, hashes, exit codes, quoted
text); AC17's "does not decrease"/"survives byte-identically" is scoped to one named file across one named command,
captured as a measured before/after pair.

### 10.2 A second real defect, found while proving AC18, fixed before it could ship

Running `Rev0_sample2_fixed.txt`'s pair against the re-seeded baseline (required by AC18) initially reported **1**
new block, not 0: `src/stories/mantine/_MantineStoryShell.tsx :: src/stories/mantine/_MantineStoryShell.tsx ::
tier1-unenrolled-or-unstoried`. Root cause: the whole-src render graph never walks into `src/stories/` (it is in
`SKIP_DIRS`), so any changed file under that directory that is *not* itself a `.stories.tsx`/`.test.tsx` file (the
existing exclusion) has zero renderers by construction — not because nothing renders it, but because the graph is
blind to that whole subtree — and wrongly resolved to itself as a bogus surface root. Fixed: `classifyChangedFile`
now also excludes any changed file under a directory the render graph itself never walks into
(`node_modules`/`.next`/`storybook-static`/`__tests__`/`stories`), reason `non-production-directory`, mirroring the
existing story/test-file suffix exclusion. Re-verified: the self-test (8/8) and the sample-2 run (0 new) both pass
after the fix. Documented in full, including the wrong-then-right transcripts, in `AC18_reseed-candidate-space_probe.txt`.

### 10.3 Files Changed (Revision 1, in addition to the original pass)

| Path | Reason |
|---|---|
| `scripts/map-changed-surfaces.mjs` | `buildRenderGraph()` now also returns `relFiles`; new exported `computeCandidateSurfaces()` (R13); `loadManifestSet` exported for reuse; `classifyChangedFile` gained the `non-production-directory` exclusion (§10.2). |
| `scripts/check-surface-census-changed.mjs` | `compareToBaseline`/`computeBaselineUpdate` take a third `censusedSurfaces` parameter and distinguish carried vs. stale (R12); `--update-baseline` merges rather than replaces; every written entry carries `reasonCode` (R14); `--seed-baseline` now censuses the full candidate space via `censusCandidateSpace()` instead of one diff's mapped surfaces (R13) and no longer requires `--base`; self-test widened to 8 arms (R15); `printScopeBlock` prints the new carried count. |
| `scripts/surface-census-baseline.json` | Re-seeded from the candidate space: 690 entries across 268 surfaces (was 140/15), each carrying `reasonCode`. |
| `docs/storybook-governance.md` | §15.7's baseline paragraph rewritten to state the carried/stale/new distinction, the merge semantics, and the candidate-space seed (R16). |
| `docs/sessions/2026-09-11-task819-pre-enrolment-census-becomes-blocking.md` | §7's limitations sentence corrected (R16, this section). |
| `docs/sessions/evidence/task819/AC16_*`, `AC17_*`, `AC18_*`, `AC20_*`, `Rev1_*` (new) | Revision 1 evidence. |
| `docs/backlog.md` | Task 819 status line updated for Revision 1 (§10.4). |

No other file from the original pass changed; `docs/golden-rules.md`'s hash (`dcaa71eaff13b3c98854e4e097f9013d476c0429`)
is unchanged from the original pass's `G15` capture, confirmed in `Rev1_15_hashes-and-AC10.txt`.

### 10.4 Validation evidence (Revision 1 final gate block, §17.5)

All native `win32` PowerShell, `node v22.22.3`, working directory `C:\Claude_Code_Projects\lero-al` — recorded inside
every transcript:

| Command | Exit | Transcript |
|---|---|---|
| `node --check` × 3 scripts | 0 each | `Rev1_01`–`Rev1_03` |
| `npm run typecheck` | 0 | `Rev1_04_typecheck.txt` |
| `npx eslint` × 3 scripts | 0 | `Rev1_05_eslint.txt` |
| `npm run check:surface-census:changed -- --base f46c487d5 --head HEAD` | 0 | `Rev1_06_check-surface-census-changed.txt` |
| `npm run check:surface-census:changed:verify` | 0 (8/8 arms) | `Rev1_07_check-surface-census-changed-verify.txt` |
| `npm run check:rendered-scope` (unchanged) | 0 | `Rev1_08_check-rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | 0 | `Rev1_09_check-rendered-scope-verify.txt` |
| `npm run check:story-coverage` (unchanged) | 0 | `Rev1_10_check-story-coverage.txt` |
| `npm run check:stories` | 0 | `Rev1_11_check-stories.txt` |
| `npm run build` | 0 | `Rev1_12_build.txt` |
| `npm run check:file-integrity` | 0 | `Rev1_13_check-file-integrity.txt`, re-confirmed clean on the full tree afterward |
| `npm run check:mojibake` | 0 | `Rev1_14_check-mojibake.txt`, re-confirmed clean on the full tree afterward |

`git hash-object` of every changed file, plus the AC10 re-verification and the forbidden-re-run confirmation, all in
`Rev1_15_hashes-and-AC10.txt`.

### 10.5 Assumptions, deviations, limitations (Revision 1)

- No new assumptions beyond the original pass's (§7); R12/R13/R14/R15 are direct implementations of the kickoff's
  own specified fix, not judgment calls.
- **Deviation, §10.2** — a second real mapping-correctness defect (`src/stories/**` helper files self-resolving),
  found while proving AC18 and fixed in the same pass, not deferred.
- No PowerShell `Get-Content -Raw` mojibake incident this pass — every restore in this revision used Node's
  `readFileSync`/`writeFileSync` for the actual file content, per §17.5's explicit instruction.

### 10.6 Opus handoff (Revision 1)

- Evidence root unchanged: `docs/sessions/evidence/task819/`. New files listed in §10.3.
- Please independently verify §10.2's second defect and fix — re-run
  `node scripts/check-surface-census-changed.mjs --base 0c673fef1 --head 37e99dc31` yourself.
- The candidate-space seed took several minutes wall-clock (291 subprocess census calls); confirm this one-time cost
  (never run again except a deliberate future re-seed) is acceptable — it is not part of any CI path.
- §8's original-pass open questions (the "no bootstrap" design choice, AC6's construction method, render-graph cost)
  remain open from the original pass; Revision 1 does not resolve them.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
