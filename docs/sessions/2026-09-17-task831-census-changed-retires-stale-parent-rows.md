# Task 831 — `check:surface-census:changed` retires stale `<parent> :: <child>` rows on enrolment

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (revision of review 1 — kickoff §16, R8-R13, AC6-AC11)

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_831_Census_Changed_Retires_Stale_Parent_Rows.md`

**Revision note (§16.6):** review 1 returned `NEEDS REVISION` — F1/F4 (P1) and F2/F3/F5 (P2/kickoff-defect), closed
below by R8-R13/AC6-AC11. §§1-9 below are the original round-1 report; §10 is the revision delta. Transcripts
`11`-`23` are **superseded** by `30`+ (kept, not deleted, per §16's retention rule) — do not cite them as current
evidence for anything R8-R13 touches.

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1 | After mapping, compute parent surfaces to re-census (baseline row `S::N::*`, `N` ∈ changed candidates ∪ `mapping.included`, `S` ∉ `mapping.included`); census each with `censusSurface`. | `computeReCensusSurfaces` (check-surface-census-changed.mjs), wired into `runPipeline`. AC2/AC9 transcripts (`06_postfix_gate_repro.txt`) show `Re-censused parent surfaces (7)` listing exactly the 7 known LightboxView parents, each censused. | Confirmed |
| R2 | `censusedSurfaces` for both `compareToBaseline` and `computeBaselineUpdate` is `mapping.included ∪ R1's set`. | `main()` gate and update-baseline modes both build `new Set([...pipeline.mapping.included, ...pipeline.reCensusSurfaces])`. AC2 (06) shows the 7 rows `stale`; AC3 (07/08) shows the writer drops exactly those 7. | Confirmed |
| R3 | R1 surfaces count toward `--max-surfaces` (existing `surface-limit-exceeded`); census exit 2 on an R1 surface is the existing `census-exit-2`. | `runPipeline` checks `mapping.included.length + reCensusSurfaces.length` against `maxSurfaces` before censusing, reusing the `stage:'mapping'` shape; R1 surfaces are censused in the same loop/failure branch as mapped ones. AC4 (`09_ac4_max-surfaces.txt`): `--max-surfaces 5` → `surface-limit-exceeded: 12 ... (5 mapped, 7 re-censused)`, exit 1. | Confirmed |
| R4 | Print `Re-censused parent surfaces (n):` with each surface's pulling child key segment, and scope text states the rule. | `printScopeBlock` prints the block with `<- <node>` per surface. **Correction (F2, §10):** round 1 did not print a rule sentence — only the heading and `<- node` lines; the "rule" was a code comment only, not scope text. R9 (§10) adds the printed rule line in every mode, including `n=0`. | **Partially confirmed round 1; the rule-text half closed by R9 (§10)** |
| R5 | `runMapping`'s success result adds `candidates` (sorted changed src files resolved); no existing field's meaning changes. | `map-changed-surfaces.mjs` success return now includes `candidates` (already-sorted local var), additive only. | Confirmed |
| R6 | `--baseline-path <file>` (default `scripts/surface-census-baseline.json`), used for reading in all modes and writing in `--update-baseline`. Default run byte-identical to CI's command. | `BASELINE_PATH` now resolves `argVal('--baseline-path')` against `ROOT`, falling back to `DEFAULT_BASELINE_PATH`. AC5 (`10_ac5_default_empty-diff.txt`) ran the unmodified default command and the committed baseline diff is empty. | Confirmed |
| R7 | `--verify-gate` arms 9/10 (pure, synthetic, no git); `ARM_COUNT` → 10; arms 1-8 unchanged. | `ARM_COUNT = 10`. Red run (`03_verify_red_arms9-10.txt`): 8 passed, arms 9/10 FAIL (stub). Green run (`05_verify_green_10of10.txt`): 10/10 PASS, same arm text, arms 1-8 untouched. | Confirmed |

## 2. Current versus required behavior

**Before:** enrolling a child in PR X leaves the gate green and the writer keeps the now-invisible parent rows (mapper never climbs past a manifest root); an unrelated PR Y that later touches a parent fails on debt it never created.
**After:** enrolling a child in PR X re-censuses every baseline-named parent of that child; the gate names the paid-off rows `stale` and exits 1 in the same PR, and `--update-baseline` removes exactly those rows. PR Y is unaffected (measured: AC5, empty diff, `Re-censused parent surfaces (0)`).

**Negative flows** (kickoff §11):

| Flow | Evidence |
|---|---|
| Parent still genuinely blocks (child not enrolled) | Arm 5 / arm 7 (baseline entry for un-censused surface → `carried`, not `stale`) — unchanged, still passing. |
| Re-census pushes surface count over the limit | AC4 (09) — `surface-limit-exceeded`, exit 1. |
| Parent census exits 2 | Reuses the existing `census-exit-2` branch for both mapped and R1 surfaces (code path shared, not independently re-plant-tested this session — see Limitations). |
| Unrelated un-censused surface's rows | Arm 10 / AC3 key-set diff (08) — byte-identical row kept. |
| Empty diff | AC5 (10) — `Re-censused parent surfaces (0)`, exit 0. |

## 3. Files Changed (superseded by §10.3 — six tracked files after the revision)

| Path | Reason |
|---|---|
| `scripts/check-surface-census-changed.mjs` | R1-R4, R6, R7: `--baseline-path` flag, `computeReCensusSurfaces`, `runPipeline` wiring (baseline load, R1 surface computation, `--max-surfaces` fold-in, shared census loop), `printScopeBlock` re-census block, `main()` gate/update-baseline consuming the merged `censusedSurfaces`, arms 9/10. |
| `scripts/map-changed-surfaces.mjs` | R5: additive `candidates` field on `runMapping`'s success result. |
| `docs/backlog.md` | 831 state line + Sprint 75 row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |

Diff stat and hashes (round 1, superseded): `docs/sessions/evidence/task831/21_final_diff-stat_and_hashes_with-backlog.txt`. Round 1 left `scripts/surface-census-baseline.json` byte-identical (`7d7aa142baa7e080ce281028eb24a78d77372e21`) — the revision (§10) is what writes it, R13-only, per the amended scope §16.4.

## 4. Validation evidence (round 1 — `11`-`23` superseded by §10.4's `30`+ transcripts)

All transcripts under `docs/sessions/evidence/task831/`, unpiped with `EXIT_CODE=` appended. **Files `11` through `23`
are superseded** (re-run under §10.4 as `50`-`55`) — the R8-R13 code changes (especially R13's baseline write) make
them stale; they are retained for history only, per §16's "keep, do not overwrite" instruction.

| Step | File | Result |
|---|---|---|
| I0 platform/version/status/hashes | `01_verify_i0.txt` (verify only) + inline command output this session | win32, node v22.22.3, clean tree |
| I0 `:verify` (8 arms) | `01_verify_i0.txt` | PASS 8/8, exit 0 |
| I0 baseline export (ce0a9afb0, 653 keys, 7 LightboxView rows) | inline (`node -e` reading the scratch file) | matches kickoff §3.1 FACT exactly |
| Red arms 9/10 (`--verify-gate`, R1 stubbed) | `03_verify_red_arms9-10.txt` | 8 passed, 2 FAILED, exit 1 |
| Pre-fix historical reproduction (`--baseline-path` wired, R1/R2 still stubbed) | `04_prefix_gate_repro.txt` | exit 1 — **see §6 deviation**; 0 LightboxView rows stale (correct pre-fix substance) |
| Green `:verify` (10 arms, R1/R2 real) | `05_verify_green_10of10.txt` | PASS 10/10, exit 0 |
| Post-fix historical reproduction (AC2) | `06_postfix_gate_repro.txt` | exit 1; `Re-censused parent surfaces (7)` = exactly the 7 known parents; `Stale baseline entries: 7` = exactly those 7 keys |
| Post-fix writer (AC3) | `07_postfix_writer.txt` | exit 0; `entries written: 647` (653 − 7 + 1) |
| AC3 key-set diff (Node one-liner) | `08_ac3_keyset_diff.txt` | removed (7) = exactly the LightboxView keys AC2 printed stale; added (1) = the orthogonal new block (§6) |
| AC4 (`--max-surfaces 5`) | `09_ac4_max-surfaces.txt` | exit 1, `surface-limit-exceeded: 12 ... (5 mapped, 7 re-censused)` |
| AC5 (default path, `--base HEAD --head HEAD`) | `10_ac5_default_empty-diff.txt` | exit 0, `Re-censused parent surfaces (0)`; `git diff -- scripts/surface-census-baseline.json` empty |
| `check:rendered-scope:verify` | `11_final_rendered-scope-verify.txt` | PASS 5/5, exit 0 |
| `npm run lint` | `12_final_lint.txt` | 0 errors, 78 pre-existing warnings, exit 0 |
| `npm run build` | `13_final_build.txt` | exit 0 |
| `check:file-integrity` (final, all touched paths incl. `docs/backlog.md`) | `19_final_file-integrity_with-backlog.txt` | PASS, 25 files clean, exit 0 (see §6 for the self-inflicted BOM detour) |
| `check:mojibake` (final) | `20_final_mojibake_with-backlog.txt` | 0 artifacts / 5408 files, exit 0 |
| `git diff --stat` / baseline diff / `git hash-object` (final) | `21_final_diff-stat_and_hashes_with-backlog.txt` | 3 files changed; baseline diff empty |

## 5. Visual source trace / Canonical UI decision record

Not applicable — no visible surface (governance script only, per kickoff §15 "GR-1 / 16d? No visible surface").

## 6. Implementation validation notes — deviations found and handled

**Orthogonal pre-existing finding, not this task's defect.** The exact command the kickoff's §13.1 specifies
(`--base ce0a9afb0 --head c177a0920`) measures **5** included surfaces, not the 4 quoted in the kickoff's §3.1 FACT
block (which came from a different, internal Task 825 working-tree run). The 5th is `src/hooks/useKeepActiveInView.ts`
— a hook file Task 825 introduced (confirmed new via `git diff --name-status ce0a9afb0 c177a0920`). Because nothing
renders a hook as a JSX tag, `map-changed-surfaces.mjs`'s "nothing renders it → it's a root" rule treats the hook file
as its own surface, and `check-surface-census.mjs` reports it as a **new, un-baselined** `tier1-unenrolled-or-unstoried`
block on itself. This is unrelated to R1-R7 (it fires identically whether or not the parent-retirement fix is present)
and both named out-of-scope files (`check-surface-census.mjs`, the mapper's root/candidate classification rules) are
explicitly out of this task's scope.

Per kickoff §5's own instruction for exactly this kind of measured drift ("record the actual... and use it; the
comparator is... not the literal number"), I did not stop the task. I recorded the actual measurement and evaluated
AC2 against its **substantive** comparator (the stale-key set), which holds exactly as specified in both the pre-fix
and post-fix runs — only the literal "pre-fix exit 0" line in §13.1's prose is contradicted, by an orthogonal
pre-existing defect this task does not touch. **Recommend Opus files this as a new backlog candidate**: a changed
hook (or any non-JSX-rendered production file) becomes a false "surface" in the diff mapper, a blind spot in the same
family as this sprint's stated goal.

**Self-inflicted evidence-encoding detour, corrected in-session.** Several PowerShell `>` redirections used to
capture transcripts wrote a stray UTF-8 BOM (PowerShell's default `>` behavior in this environment), which
`check:file-integrity` correctly flagged (`14_final_file-integrity.txt`, exit 1) against the 13 affected untracked
evidence files, plus one more (`15_final_mojibake.txt`) found on the next pass. Fixed with a Node UTF-8 I/O rewrite
under an explicit printed manifest (agent-contract clause 14): stripped the 3-byte BOM from each of the 14 files.
Re-run confirmed 22 then 25 files clean (`17_final_file-integrity_clean.txt`, `19_final_file-integrity_with-backlog.txt`).
No product/script file was ever affected — only this session's own `.txt` evidence transcripts.

No other defects found; no gaps remain against R1-R7/AC1-AC5.

## 7. Assumptions, deviations, and limitations

- The §3.1 FACT's "4 included surfaces" does not reproduce under the kickoff's own specified `--base ce0a9afb0 --head
  c177a0920` command — see §6. The 7-parent LightboxView set itself reproduced exactly as stated.
- R3's `census-exit-2` branch for an R1 surface reuses the identical code path already covered by the existing
  mapped-surface `census-exit-2` handling (same loop, same `censusFn` call, same failure branch); I did not add a
  standalone planted-failure arm specifically forcing an R1 surface's census to exit 2, since arms 1-8 already prove
  that branch and R1 surfaces enter the same loop/branch unconditionally (visible in the `runPipeline` diff). Flagging
  this as a narrower proof than a dedicated arm would give, for Opus to weigh.
- `docs/backlog.md` is now exactly 80 physical lines (`wc -l` = 80) — at, not over, the stated budget. No
  `BACKLOG LIMIT BREACH`.
- Out of scope, untouched: `scripts/surface-census-baseline.json` (hash-confirmed unchanged), `check-surface-census.mjs`,
  `check-rendered-scope.mjs`, CI workflow, `package.json`.

## 8. Opus handoff

- Evidence root: `docs/sessions/evidence/task831/` (21 files, transcripts 01-21 plus the two scratch baseline copies
  and their writer outputs).
- Please independently verify AC2/AC3's exact stale/removed key sets against `06_postfix_gate_repro.txt` and
  `08_ac3_keyset_diff.txt` — the diff between `scratch-baseline-ce0a9afb0.json` and `scratch-writer-postfix.json`.
- Decide whether §6's orthogonal hook-misclassification finding should be filed as a new numbered task (candidate:
  Sprint 75, same "blind detector" family as this task and 826/827/829/830).
- Decide whether R3's `census-exit-2` coverage (shared code path, no dedicated R1-specific plant) is sufficient or
  needs a standalone arm before approval.

## 9. Backlog update (round 1 — see §10.7 for the revision's backlog state)

`docs/backlog.md`: added one concise `Last Session` line for Task 831 (`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
2026-09-17) and updated the Sprint 75 registry row to move 831 out of `READY FOR SONNET`. Resulting physical line
count: **80** (`wc -l`). At the 80-line budget, not over it — no `BACKLOG LIMIT BREACH`.

---

## 10. Revision delta (kickoff §16, review 1 `NEEDS REVISION`)

Owner decision quoted verbatim (kickoff §16, 2026-09-17): *"не створюй нову задачу, необхідно все зробити в рамках
цієї задачі"* ("don't create a new task, everything must be done within this task"). F1/F4 (P1) and F2/F3/F5
(P2/kickoff-defect) are closed here, in-task, per that decision.

### 10.1 Requirement and acceptance-criteria evidence — R8-R13

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R8 | Closes F1. A re-censused parent missing on disk is never passed to `censusFn`; still joins `censusedSurfaces` with zero measured blocks (its rows go stale); still counts toward `--max-surfaces`; existence check injectable. | `runPipeline` now takes `existsFn` (default `surfaceExistsOnDisk`), splits `reCensusSurfaces` into `missingSurfaces`/`existingReCensusSurfaces`, censuses only the latter, and pushes `{surface, blocking: []}` for each missing one. AC7 (`32`-`34`): a planted `src/fake/task831/DeletedParent.tsx :: LightboxView.tsx` row is listed under `Re-censused parent surfaces` with `[missing on disk — rows retired]`, goes stale (not `census-exit-2`), and the writer drops it. Arm 11 (`30`/`31`) drives the same code path with an injected `censusFn` that throws if called with the missing surface — never thrown in the green run. | Confirmed |
| R9 | Closes (half of) F2. `printScopeBlock` prints one rule line under `Re-censused parent surfaces (n):`, in every mode, including `n=0`. | Two `console.log` lines added unconditionally (not inside the `if (extra)` branch). Visible in every transcript `32`+, and in `48_ac11_empty-diff.txt`'s `n=0` case. | Confirmed |
| R10 | `--verify-gate` gains arm 11 (pure, synthetic, no git) proving R8's split via the real `runPipeline`, with injectable `mappingFn`/`loadBaselineFn`/`existsFn`/`censusFn` — no reimplementation of the union/split inside the arm. | Arm 11 (see R8 row). `runPipeline`'s new parameters are exactly `censusFn, existsFn = surfaceExistsOnDisk, mappingFn = runMapping, loadBaselineFn = () => loadBaselineFile(baselinePath)` — the arm supplies all four and reads `result.perSurfaceBlocks`/`result.reCensusSurfaces` through the same `dedupeBlocks`/`compareToBaseline`/`computeBaselineUpdate` the CLI uses. | Confirmed |
| R11 | Closes F4. `check-surface-census.mjs`: a depth-0 root whose path ends `.ts` (not `.tsx`) is marked `tier: 'root-non-component'` (human table + `--json` `nodes`), never pushed to `blockingNodes` as `tier1-unenrolled-or-unstoried`. Everything else (`.tsx` roots, depth≥1 nodes, `unparseable-source`, tier-2/tier-3, exit codes, `--json` shape) unchanged; `--json` gains only the additive `scope.tsRootRule` field. | `rootIsNonComponentTs = depth === 0 && path.endsWith('.ts') && classification.tier === 'tier1'` gates the override; the recursion gate at the walk (`classification.tier !== 'tier1'`) is untouched, so recursion behaviour is identical. AC9: pre-R11 (`37_ac9_hook_pre.txt`, captured from the committed `HEAD` version via a temp read-only copy) exits 1 with a self block; post-R11 (`38_ac9_hook_post.txt`) exits 0, `tier: "root-non-component"`, `blocking: []`. Control `.tsx` surface (`ListingGallery.tsx`, `39_ac9_tsx_control_pre/post.txt`, `39b` diff): identical 2-entry blocking set before/after. | Confirmed |
| R12 | `--verify-gate` gains arm 12 (real subprocess, real fs, no git, same shape as arm 6): the hook surface is not self-blocking; a control `.tsx` surface still blocks normally. `ARM_COUNT` → 12, arms 1-10 unchanged. | Arm 12 calls the real, exported `censusSurface` against `src/hooks/useKeepActiveInView.ts` and `src/modules/listings/components/ListingGallery.tsx`. Red (`30_verify_red.txt`): arms 1-10 PASS, 11/12 FAIL, exit 1. Green (`31_verify_green.txt`): `Arms run: 12`, 12 passed, exit 0. | Confirmed |
| R13 | Closes F4's baseline debt. Retire every `X.ts :: X.ts :: tier1-unenrolled-or-unstoried` key from the **committed** `scripts/surface-census-baseline.json`, measured at execution (not the review-time 155), after confirming every one of those surfaces censuses clean (exit 0/1, no self-block) post-R11; write via the script's own `writeBaselineFile`, never a hand-written JSON string; prove the serializer canonical. | `|T|` measured **152** at execution (`T_set.json`). `41_ac10_T_census.txt`: all 152 exit 0/1, 0 self-blocks, 0 unparseable. Write via a throwaway `.mjs` importing and calling the real `loadBaselineFile`/`writeBaselineFile` (deleted after use); `42_ac10_retire.txt`: 646 − 152 = 494, matched. Diff against `HEAD`'s committed baseline: removed = exactly `T` (152, order-independent set equality proven), added = 0. `43_ac10_canonical.txt`: hash `5afcd688...` before and after re-running `--update-baseline --base HEAD --head HEAD` — unchanged, serializer canonical. | Confirmed |

### 10.2 Findings closed

| Finding | Closed by | How |
|---|---|---|
| F1 (P1) — missing parent fails closed with no exit | R8 | Split by on-disk existence; missing surfaces never censused, joined with zero blocks so their rows retire as stale instead of triggering `census-exit-2`. |
| F2 (P2) — R4's rule sentence was a code comment, not printed scope text | R9 | Printed unconditionally under the `Re-censused parent surfaces` block. |
| F3 (P2) — AC3's pre-fix writer transcript never existed | AC8 | Scoped plant (`censusedSurfaces = new Set(pipeline.mapping.included)` only, in `--update-baseline` mode) with a hash witness before/after; `35`/`36` show all 7 LightboxView keys surviving the pre-fix writer. |
| F4 (P1) — a `.ts` file censused as a surface blocks on itself; 155 (152 at execution) false rows in the committed baseline | R11 (mechanism) + R13 (baseline cleanup) | See rows above. |
| F5 (kickoff defect) — AC2's literal "pre-fix exit 0" doesn't hold for the specified range | AC2 amended | The amended comparator (§16.3) accounts for the `.ts` self-block; verified in §10.1's AC2 evidence below. |

### 10.3 Files Changed — final (supersedes §3)

| Path | Reason |
|---|---|
| `scripts/check-surface-census-changed.mjs` | R1-R4, R6-R13: everything in §3's row, plus R8's existence split (`missingSurfaces`/`surfaceExistsOnDisk`), R9's printed rule line, R10's injectable `mappingFn`/`loadBaselineFn`/`existsFn` on `runPipeline`, and arms 11-12. |
| `scripts/map-changed-surfaces.mjs` | R5 (unchanged from round 1). |
| `scripts/check-surface-census.mjs` | R11: a depth-0 `.ts` root is marked `root-non-component`, never blocked as `tier1-unenrolled-or-unstoried`; additive `scope.tsRootRule` in `--json`; two rule lines in the human scope block. |
| `scripts/surface-census-baseline.json` | R13: 152 false `.ts` self-rows removed (646 → 494), removals-only, written by the script's own serializer. |
| `docs/backlog.md` | 831 state line + Sprint 75 registry row → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |
| `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md` | Tasks-table row for 831 updated per §16.4's scope amendment. |

Diff stat and hashes: `docs/sessions/evidence/task831/55_final_diff-stat_and_hashes.txt`. Baseline diff: 456 lines, all
deletions (152 keys × 3 lines/key in the pretty-printed JSON), zero additions.

### 10.4 Validation evidence — revision (`30`-`55`)

| Step | File(s) | Result |
|---|---|---|
| AC6 red (`--verify-gate`, R8/R11 planted-disabled via a hash-witnessed temporary edit, restored before green) | `30_verify_red.txt` | Arms 1-10 PASS, 11/12 FAIL, exit 1. Restoration proven: `git hash-object` before plant = after restore for both files (`787a3ef...`, `c800fd7...`). |
| AC6 green | `31_verify_green.txt` | `Arms run: 12`, 12 passed, exit 0. |
| AC7 — missing-parent gate | `32_ac7_missing-parent_gate.txt` | 9 stale (8 + planted `DeletedParent.tsx` row), `[missing on disk — rows retired]` printed, `census-exit-2` absent (grep count 0), exit 1. |
| AC7 — missing-parent writer | `33_ac7_missing-parent_writer.txt`, `34_ac7_keyset_diff.txt` | Writer exit 0, 654→645; key-set diff: removed(9) includes the planted key, added(0). |
| AC8 — pre-fix writer red evidence (closes F3) | `35_ac8_prefix_writer.txt`, `36_ac8_prefix_keyset.txt` | Scoped plant, hash-witnessed (`787a3ef...` before/after). All 7 LightboxView keys still present post pre-fix writer run. |
| AC9 — `.ts` root census, before/after R11 | `37_ac9_hook_pre.txt` (exit 1, self-block), `38_ac9_hook_post.txt` (exit 0, `root-non-component`, 0 blocking), `39_ac9_tsx_control_pre/post.txt` + `39b` diff (control surface unchanged) | Confirmed, no regression |
| AC2 amended — post-fix historical reproduction | `43_ac2_postfix_gate.txt` | `Blocks new: 0`; 8 stale = the 7 LightboxView keys + `theme.ts :: theme.ts :: tier1-unenrolled-or-unstoried`; exit 1. |
| AC3 amended — post-fix writer + key-set diff | `44_ac3_postfix_writer.txt`, `45_ac3_keyset_diff.txt` | 653→645; removed(8) = exactly AC2's stale set; added(0). |
| AC10 — retire `T` from the committed baseline | `41_ac10_T_census.txt`, `42_ac10_retire.txt`, `43_ac10_canonical.txt` | 152/152 clean census; 646→494 exact; serializer-canonical hash match. |
| AC11 — no regression | `46_ac11_media-enrolment.txt`, `47_ac11_audit-design-system-patterns.txt` (PASS, exit 0 — unrelated to any touched file, so a single post-task measurement stands in for before/after per §10.6), `48_ac11_empty-diff.txt` (exit 0, `Re-censused parent surfaces (0)` with the R9 rule line), `49_ac11_working-tree.txt` (exit 0, the 4 changed script/baseline paths are `outside-src`) | Confirmed |
| `:verify` at revision I0 and final | `41_r16_verify.txt` (12/12), and AC6's `31_verify_green.txt` again at the very end (not re-run a third time — same code, no reason to expect drift) | 12/12 both times |
| `check:rendered-scope:verify` | `50_final_rendered-scope-verify.txt` | PASS 5/5, exit 0 |
| `npm run lint` | `51_final_lint.txt` | 0 errors, 78 pre-existing warnings (same set as round 1), exit 0 |
| `npm run build` | `52_final_build.txt` | exit 0 |
| `check:file-integrity` | `53_final_file-integrity.txt` | PASS, 66 files clean, exit 0 |
| `check:mojibake` | `54_final_mojibake.txt` | 0 artifacts / 5446 files, exit 0 |
| `git diff --stat` / baseline diff-stat / `git hash-object` | `55_final_diff-stat_and_hashes.txt` | 6 files changed; baseline diff 456 deletions, 0 additions |

### 10.5 AC1-AC5 status after the revision

AC1 (R7 arms 9/10) and AC4 (`--max-surfaces`) are **unchanged from round 1** — R8-R13 do not touch that code path;
round-1 evidence (`03`/`05`, `09`) stands. AC5 is **re-verified** at `48_ac11_empty-diff.txt` (superseding `10`,
same result: exit 0, re-census set empty). AC2/AC3 are **amended** per kickoff §16.3 and re-verified at `43`-`45`
(superseding `06`-`08`, which are kept per §16's retention rule but no longer the current evidence for AC2/AC3).

### 10.6 Assumptions, deviations, and limitations — revision

- AC11's `check:media-enrolment`/`audit:design-system-patterns` "before" measurement is inferred rather than
  separately captured pre-R13: neither script reads `scripts/surface-census-baseline.json` or any other file this
  task touches (confirmed by inspecting both scripts' headers/measurement sources), so a single post-task PASS is
  offered as the "after" and stands in for "unchanged from before" by construction, not by a literal two-point
  measurement. Flagging this explicitly rather than silently treating it as satisfying "before and after" literally.
  Both are in fact same before/after by construction; a strict reviewer may still ask that I re-run them once with the
  round-1 pre-R13 state, but round-1 evidence at that exact command doesn't exist either, so that would be a fresh
  measurement, not a comparison.
- `|T|` was 155 at review (kickoff), **152** at this execution — an 3-row drift, consistent with the kickoff's own
  instruction to re-measure rather than cite the review-time count. Recorded, not investigated further (not this
  task's concern; the comparator is "every key the live rule identifies," not a literal count).
- R3's `census-exit-2` branch for an existing (non-missing) R1 surface still has no standalone plant this round either
  (unchanged limitation, carried from round 1's §7).
- `docs/backlog.md` remains exactly **80** physical lines after the revision's edits (no new lines added, only
  existing ones edited) — no `BACKLOG LIMIT BREACH`.
- §6's orthogonal `useKeepActiveInView.ts`-as-a-new-block finding is now fully explained and closed by R11/R13 — it
  is no longer an open recommendation; the "recommend Opus files this as a new backlog candidate" line in §6 is
  superseded by this revision actually fixing the underlying mechanism (no hook self-blocks any more).

### 10.7 Backlog update — revision

`docs/backlog.md`: Task 831's `Last Session` line rewritten in place (same line, not a new one) to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a concise R8-R13 summary; the Sprint 75 registry row's 831 mention
updated to match. `wc -l docs/backlog.md` = **80** — at, not over, budget; no `BACKLOG LIMIT BREACH`. The Sprint 75
plan file's Tasks-table row for 831 (`tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`)
was also updated, per kickoff §16.4's scope amendment naming it explicitly.

### 10.8 Opus handoff — revision

- Evidence root, revision-specific: `docs/sessions/evidence/task831/` files `30`-`55`, plus `T_set.json` (the exact
  152-key set retired) and the `scratch-missing-parent*`/`scratch-writer-prefix.json` scratch copies AC7/AC8 used.
- Please independently re-check AC10's set-equality claim (`removed === T exactly`) and AC2/AC3 amended's exact 8-key
  stale/removed sets — both are computed with Node one-liners inline in this session, not saved as a single canonical
  script; the logic is simple set difference but is worth an independent recompute.
- Please verify the two plant-and-restore cycles (AC6's R8/R11 disable, AC8's `censusedSurfaces` narrowing): each
  restoration is proven by a `git hash-object` match against a value recorded **before** the plant, not merely
  eyeballed. `git status --porcelain` at the end of this session shows only the intended 6 tracked files changed —
  no residue from either plant.
- §10.6's AC11 "before/after" reasoning (a single post-task measurement, justified by the two scripts' independence
  from every file this task touches) is the one place I made a judgment call about the letter of an AC instruction
  rather than literally re-running a command that has no round-1 counterpart to compare against. Please confirm this
  reasoning is acceptable or ask for a literal two-point measurement.
- Two throwaway `.mjs` files were created and deleted in-session (`scripts/_task831_pre-r11_check-surface-census.mjs`,
  `scripts/_task831_retire_T.mjs`); `git status --porcelain` confirms neither is present in the final tree.
