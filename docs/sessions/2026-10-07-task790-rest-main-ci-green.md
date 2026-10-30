# Task 790 (rest) — main CI green — session log (Sonnet executor)

Task: `tasks/Sprints/Sprint_77_kickoff_prompt_Task_790_Rest_Main_CI_Green.md` · QA Q1 · status: PARTIALLY IMPLEMENTED

CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.

GR-0 CANONICAL REUSE PREFLIGHT — request: none (no component, Story or style is created; test/gate/config files only); semantic queries: n/a; inspected candidates: NONE; decision: REUSE; selected canonical owner: NONE; Mantine/TailAdmin token path: NONE; new hardcoded visual values: NONE; rationale: non-UI task (kickoff §15), no file under src/ changes except one test and its setup.

GR-7 REFERENCE RESEARCH — moment: execution; role: Sonnet; task: 790 (rest); subject: CI test-suite and gate repair (no UI); references: Lahomes, Kamr, Omah, TailAdmin + none; library: docs/research/references/2026-10-04; live-checked pages: Lahomes entry (title "Analytics | Lahomes…", 189 anchors) → unchanged; Omah entry ("Omah - Real Estate Admin Dashboard Template", 185 anchors) → unchanged; TailAdmin entry ("eCommerce Dashboard | TailAdmin…", 117 anchors) → unchanged; Kamr `/login` signed in demo@example.com → `/dashboard` ("Kamr : Vite Hotel Admin Dashboard Template", 168 anchors) → unchanged from the Opus 2026-10-07 check (login succeeds); route inventory: library rows cover Lahomes 106, Kamr 62, Omah 339, TailAdmin 88 pages, no row concerns CI/tests/build; inspected in depth: the four entry pages (screenshots saved); workflow states operated: Kamr login; options across references: none — references are UI templates with nothing on CI; chosen 2026 best practice: none applicable, follow the repository's own gate conventions (two-armed plants, remove-only baselines, fail-closed gates); absent or unverified: any CI/test-suite feature (shows nothing in any reference); lero.al data map: not applicable (no entity/route/UI change); owner decisions: O790-1; evidence: docs/sessions/evidence/task790/research-exec/ (live-check.json, *-entry.png).

Notes: anchor counts are raw `a[href]` totals, not the de-duplicated counts in kickoff §16.

## Phase 0
- platform `win32`; `00-status-before.txt` = 475 entries; `00-manifest-before.json` = SHA-256 per path for all 475 + 8 clean §7 paths.
- Governance before: exit 0 (`01-governance-before.txt`).
- Pre-write blob hashes: `.github/workflows/governance-pr.yml` 883a8c9e…, `docs/backlog.md` 68182b7e…, `vitest.config.ts` 3554a79a…, evidence test `appimage-config-class-assertions.test.ts` 109a1cf8….

## 1. Task path and status
`tasks/Sprints/Sprint_77_kickoff_prompt_Task_790_Rest_Main_CI_Green.md` — **PARTIALLY IMPLEMENTED** (R1, R2, R3, R5, R7, R8, R9 done; R4 and R6 stopped under kickoff §5; AC10 not demonstrable). Evidence root: `docs/sessions/evidence/task790/rest/` (called `E/` below).

## 2. Requirement and acceptance-criteria evidence
| Req/AC | Disposition | Result | Evidence |
|---|---|---|---|
| R1 / AC1 / AC2 | F1 = **gate snapshot stale** (`--width-content` is defined and used by Task 869; the snapshot was not updated) | `check:css-vars` exit 0; snapshot diff adds only `--width-content`; `check:css-vars:verify` 13/13 (7 plants failed, 6 controls passed); `css-var-resolvability.test.ts` 48/48 | `E/05-*` |
| R2 / AC3 | F2 = **test wrong** (asserted a production title that Task 896 legitimately removed) | rewritten against a fixture entry added to, and always removed from, the real exported map; 8/8. Planted sibling-accepting `isCanonicalMantineTitle` → 2 tests fail; lib hash before = after `ed51c0a0…` | `E/07-*` |
| R3 / AC4 | F3 = **frozen evidence, not a regression test** (O790-1) | `exclude: [...configDefaults.exclude, 'docs/**']`; `vitest list` has 0 `docs/` paths (154 files); evidence file hash `109a1cf8…` unchanged | `E/06-vitest-list.txt` |
| R4 / AC5 | **STOP (kickoff §5, timeout-shaped)** | F5 `RangeDatePicker` does not reproduce locally (3/3 alone, passes in the Phase-1 suite runs); characterisation below. The only fix available is a longer timeout, which needs an owner decision | `E/02*`, `E/02b-*`, `E/12-*` |
| R5 / AC6 | **gate script wrong** (two defects) | `check:card-track-monotonicity:verify` exit 0, all arms pass. Negative plant (style rule matching nothing) → both arms `plant did not apply`; file hash before = after `da51b614…` | `E/09-card-track-verify-3.txt`, `E/10-*` |
| R6 / AC7 | **STOP (kickoff §5, linear growth)** | timing below; no per-story hang reproducible. Not implemented | `E/04-*` |
| R7 / AC8 | done | census below; new red steps recorded, not fixed | `E/census/03-gate-census.txt` |
| R8 / AC9 | done | no `.skip`/`.todo`/`it.fails`, no removed `it(`, no raised timeout or `retry`; one `it` added (R2); the only exclude is R3 | file diff review |
| R9 / AC11 | done | governance before exit 0, after exit 0, "no new findings, baseline current" | `E/01-*`, `E/09-governance-after.txt` |
| AC12 | done | `npm run build` exit 0 | `E/10-build.txt` |
| AC10 | **NOT MET** | see the Phase-4 vitest table | `E/12-final-vitest-run1..6.txt` |

### R5 detail (two defects in `scripts/check-card-track-monotonicity.mjs`)
1. The constants `expectedProducedWidth` 864 / 1000 are removed. The kickoff's formula (unplanted width − 2 × padding) was tried first. It works for the rail arm (936 = 1216 − 280) but **not for the grid arm**: the grid track is 960 px with or without padding, so a width check cannot prove that plant. "Plant applied" is now read from the geometry the plant changes: the tagged parent's computed `padding-inline-start` at the rung must equal `paddingPx`.
2. The grid plant itself was inert. The story parent's own Mantine padding (32 px at 1024) beat the injected `[data-task815-plant]{padding-inline:80px}`. The rule is now `!important`. With it the grid arm yields 864 px and the 3→2 column drop; the old constants were numerically right, the plant had simply stopped applying.

## 3. Current versus required behavior
| Item | Before | After |
|---|---|---|
| `check:css-vars` | exit 1, `+--width-content` | exit 0 |
| `vitest list` | includes the task763 evidence test under `docs/` | 154 files, none under `docs/` |
| `mantine-story-scope.test.ts` | 1 red | 8/8 |
| card-track verify | arms b/c red | exit 0 (third run); negative plant red |
| `npm test` | 5 red files (CI); F1, F2, F3 + 2 more locally | F1/F2/F3 green; remaining red is timeout-shaped (below) |
| locale-leak job | cancelled at 45 min | **unchanged — stopped (§5)** |

Negative flows: a removed referenced token still fails (verify plants); exact-title broken (R2 plant); plant not applied (R5 plant); a new red step is recorded; a missing secret is not applicable (`.env.local` holds all three Supabase keys).

## 4. Files Changed (real diff, §7 paths)
| Path | Reason |
|---|---|
| `scripts/css-var-ownership-snapshot.json` | +`--width-content`, via `check:css-vars:update-snapshot` |
| `scripts/__tests__/mantine-story-scope.test.ts` | R2 fixture-based exact-title test, `afterEach` cleanup, +1 `it` asserting no leftover entry |
| `vitest.config.ts` | R3 exclude `docs/**` (O790-1) |
| `scripts/check-card-track-monotonicity.mjs` | R5 plant-applied check + `!important` plant |
| `docs/backlog.md` | row 790 state only (80 lines; `check:backlog-active` passes) |
| `docs/sessions/2026-10-07-task790-rest-main-ci-green.md`, `docs/sessions/evidence/task790/**` | this log and evidence |

Not touched: `.github/workflows/governance-pr.yml` (hash unchanged), `scripts/check-locale-leak.mjs`, `RangeDatePicker.smoke.test.tsx`, `src/tests/setup.ts`; `scripts/lib/mantine-story-scope.mjs` was planted and restored (hash equal). The dirty-worktree manifest diff (`E/11-manifest-diff.txt`) shows every other change belongs to a **parallel Task 859 session working in the same tree** (its session log, research-exec, new Stories, `r5-*` evidence). None of it is mine.

## 5. Validation evidence
### Vitest, Phase 1 (before fixes) — `E/02-vitest-run{1,2,3}.txt`, alone `E/02b-*`
| File | run1 | run2 | run3 | alone ×3 |
|---|---|---|---|---|
| css-var-resolvability (F1) | red | red | red | n/a |
| mantine-story-scope (F2) | red | red | red | n/a |
| task763 evidence test (F3) | red | red | red | n/a |
| ResetPasswordClient | red (4) | red | red | 3/3 pass |
| CabinetPasswordSection | red (5) | red | red | 3/3 pass |
| AdminPagesManager | pass | red | pass | 3/3 pass |
| filtersRangeDatePicker | pass | red | pass | 3/3 pass |
| filtersPanelShell | pass | red (2) | pass | 3/3 pass |
| RangeDatePicker.smoke (F5) | pass | pass | pass | 3/3 pass (47 tests, ~19 s) |

Duration 48–51 s. `theme.d69-18` did not fail locally (the 859 worktree already carries its fix). The other C12 files were not red in Phase 1; heroSearch failed in later runs.

### Vitest, Phase 4 (after fixes) — 6 consecutive runs, no change between them
Failed files per run: 13, 11, 11, 11, 15, 11. F1/F2/F3 are green in all six. Every failure is `Test timed out in 5000ms` or a cascade from one (`Unable to fire a "change" event`, `getByText… null`). Durations were 143–181 s (run 5: 1964 s) against 48–51 s in Phase 1: the host was about 3× slower and import time dominates (1200–1500 s aggregate vs 370 s). A first-test `await import(...)` of the Mantine graph counts against the 5 s test timeout, so suite load decides which file fails. **Cause characterised, no fix applied**: hoisting the import to a hook only moves it under a hook timeout, and raising any timeout is forbidden by R4/§5 without an owner decision. AC10 (3 consecutive runs with only d69-18 red) is **NOT MET**.

### Gate census — `E/census/03-gate-census.txt`
Run after R1–R5 were applied, so it doubles as the Phase-4 census and was not repeated. 48 steps: 45 exit 0 (test:auth/listings/admin/rls-guards/admin-freshness/i18n-hydration, check:i18n, check:stories, governance:verify and the 5 scans, i18n-hardcode/dynamic, mojibake, story-coverage, badge/dialog ×2, rendered-scope ×2, enrolled-tailwind ×2, surface-census ×2, pattern/media enrolment ×4, type-responsive ×2, design-tokens:strict, tailwind-runtime-tokens, hydration ×2, grants ×3, listing-visibility ×2, review-ledger:verify, card-track (616 s)), plus css-vars and click-shield:verify run separately, both exit 0.

**Red steps not in §3 (§5 STOP — recorded, not fixed):**
| Step | Result |
|---|---|
| `check:file-integrity:all` | 130 files with a stray BOM. 38 (47 files after later evidence) were my own evidence (PowerShell 5.1 `-Encoding utf8`) and are stripped. **92 remain**, all other tasks' evidence (task741r3 16, task765 24, task767 1, task778 32, task857 1, task876 3, task877 1, task891 3, task912 11). Hypothesis: the files are wrong (BOM), not the source |
| `check:homepage-grid` and `:verify` | invariant I-F page cap 0/12, `page-frame-not-found` at 1536/1920/2560 × sq/en/uk/it; I-C/D/E pass. Hypothesis: the gate's page-frame locator no longer matches the Storybook DOM |
| `check:click-shield` | 4 interceptions (base ×2, drawer ×2), e.g. `MantineCopyIdButton` "#7" at 375 px; the self-test passes. Hypothesis: source (an overlay covers a control) or a stale exemption |

Not run locally: `tsc`, `eslint`, `check:review-ledger` (needs CI SHAs), Playwright browser install (already present). No grant check was `NOT RUNNABLE`: all three exited 0.

### Locale-leak (R6 STOP) — `E/04-locale-leak-timing.txt`
The full run was stopped after about 64 min at 1221/4032 checks (rate 35 → 16 per minute). An instrumented copy (repo script untouched) sampled every 5th story: **44 valid stories, mean 16.4 s per story (12 loads, ≈1.37 s per load), max 19.4 s, 0 swallowed errors, so ≈123 min for 448 stories against a 45-min limit** (last green PR run: 19 m 26 s). One story, `patterns-mantine-agentstatisticsview--agt-10-empty`, stalled about 30 min inside the sample; an isolated probe (`E/04b-hang-probe-agt10.txt`, 12 loads) shows ~1 s per load and no hang, so the stall is not reproducible per story (host stall or one-off). Raw-sample entries 46–90 are artefacts of my killing Chrome and carry no data. Conclusion: linear growth, a decision for Opus (shard, raise `timeout-minutes`, or narrow scope). Extra fact for that decision: `check-locale-leak.mjs` never closes a page on its `catch` path, so failed loads leak pages.

### Other commands (actual results)
`node -p process.platform` = win32; `npm run governance` 0 before and 0 after; `npm run build` 0; `check:mojibake` 0 ("0 artifacts in 10606 files"); `check:file-integrity --all` lists no task790 path after the BOM strip (92 foreign failures remain); `check:backlog-active` passes; click-shield server was started from the fresh build and stopped afterwards (port 3000 free).

## 6. Visual source trace / 7. Canonical UI decision record
Not applicable: no visible artifact, Story, component or style changed (kickoff §15). GR-0/1/3/3a–3g/8/10/11 not applicable.

## 8. Implementation validation notes
- My first R5 attempt (width-derived expectation) was wrong for the grid arm; corrected as described.
- Evidence-capture defect: PowerShell 5.1 `Add-Content`/`Set-Content -Encoding utf8` wrote BOMs into 47 of my evidence files. They were stripped through a manifest-guarded Node script (its first attempt tripped its own scope guard on Windows path separators and wrote nothing).
- The host slowed about 3× after Phase 1, which is why Phase 4 differs from Phase 1.

## 9. Assumptions, deviations, limitations
- The kickoff wants the census before fixes; it ran after R1–R5 (pre-fix reds are the CI logs in kickoff §3). The Phase-4 census was not repeated.
- R2 uses the real exported map with a fixture entry, not a new lib helper (the lib is not in §7).
- R5 departs from the kickoff formula for the grid arm (reason above), using "the equivalent geometry the arm actually changes", which the kickoff allows.
- `docs/backlog.md` still has two other "KICKOFF FILED" mentions of 790 (lines 9 and 42) that I did not edit.

## 10. Opus handoff
Inspect: (1) the file diffs of the five code paths; (2) the hash witnesses in `E/07-r2-plant.txt` and `E/10-r5-negative-plant.txt`; (3) decide R4 (an owner decision on timeouts or the import-heavy smoke tests; I changed none); (4) decide R6 (linear growth, numbers above); (5) disposition the three new red steps and the 92 foreign BOM files; (6) a parallel 859 session shares this worktree; `governance-pr.yml` was not touched by me.

## 11. Backlog update
Row 790 (line 63) state rewritten in place, no new lines: `PARTIALLY IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. `docs/backlog.md` = 80 lines; `check:backlog-active` passes; no `BACKLOG LIMIT BREACH`.

Status: **PARTIALLY IMPLEMENTED**
