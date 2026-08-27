# Task 771 — Global Tailwind retirement readiness

## 1. Task path and status

`tasks/Sprints/Sprint_65_kickoff_prompt_Task_771_Global_Tailwind_Retirement_Readiness_Decision.md`

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

This Q0 task writes a decision record only. It deleted and modified no `@import`, `@apply`, `@source`,
`@custom-variant`, dependency, PostCSS plugin, token, component, story or script.

## 2. Audited SHA and start state

- Audited SHA: `960e78c50 docs(task771): correct native evidence commands`.
- `node.exe -p process.platform` reported `win32`.
- Before any Task-771 repository file was written, `git --no-optional-locks status --porcelain` wrote no stdout
  path. Its transcript separately retains two unrelated stderr warnings about an unreadable user Git ignore file.
- `scripts/check-homepage-theme-runtime-deps.mjs` is tracked, and
  `src/app/globals.css:370` contains `--homepage-runtime-space-0`.
- All five predecessor commands exited 0, including the 10/10 and 6/6 verify-gates.

Evidence: `docs/sessions/evidence/task771/preflight-git.txt`, `preflight-gates.txt`.

## 3. Files changed

| Path | Reason |
|---|---|
| `docs/tailwind-governance.md` | Appended §17 decision record. |
| `docs/sessions/2026-08-27-task771-global-tailwind-retirement-readiness.md` | This session log. |
| `docs/sessions/evidence/task771/` | Command transcripts. |
| `docs/backlog.md` | Concise Task-771 state. |

## 4. Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 / AC1 | met | §17.1 states `NOT_READY`, SHA and date; §1–§16 are unchanged. |
| R2 / AC2 | met | §17.3–17.6 give values, exact commands and named evidence. |
| R3 / AC3 | met | Five native predecessor exits are 0 in `preflight-gates.txt`. |
| R4 / AC4 | met | §17.8 states all gate bounds and excludes `governance:tailwind`. |
| R5 / AC5 | met | `preflight-git.txt` proves empty porcelain stdout before repository writes and Task-770 presence. |
| R6 / AC6 | met | Final porcelain contains only the four allowed documentation paths. |
| R7 / AC7 | met | Only the sanctioned B3 temporary probe exists outside the repository; no new repo detector or script exists. |
| R8 / AC8 | met | §17.7 records the accepted limitation and task-scoped route evidence, with no route blocker. |
| R9 / AC9 | met | §17.9 contains conditions only and ends with the required sentence. |
| R10 / AC10 | met | This log and concise backlog state are present. |
| R11 / AC11 | met | Final mojibake and file-integrity transcripts both exit 0. |
| R12 / AC12 | met | B3 transcript and §17.5 reproduce the eight-file table. |

## 5. Current and required behavior

Current behavior is preserved: Tailwind still compiles, the 185 `@theme inline` aliases remain, the 18 residual
reads resolve, and the three Homepage gates remain green. Required after behavior is a citable, read-only
`NOT_READY` record; no compiler-removal work is authorized.

Applicable negative flows passed: the start worktree was clean, Task 770 was in the audited commit, predecessor
gates were green, no measured blocker was empty, and the B3 probe left no repository path.

## 6. Commands and actual results

| Command | Exit | Evidence |
|---|---:|---|
| `node.exe -p process.platform` | 0 (`win32`) | `preflight-git.txt` |
| `git --no-optional-locks status --porcelain` | 0 (stdout empty) | `preflight-git.txt` |
| `git --no-optional-locks status --short --branch` | 0 | `preflight-git.txt` |
| `git --no-optional-locks log -1 --oneline` | 0 | `preflight-git.txt` |
| `git --no-optional-locks ls-files --error-unmatch scripts/check-homepage-theme-runtime-deps.mjs` | 0 | `preflight-git.txt` |
| `Select-String -Path src/app/globals.css -Pattern '--homepage-runtime-space-0'` | 0 | `preflight-git.txt` |
| `npm.cmd run check:homepage-literal-utilities` | 0 | `preflight-gates.txt`, `final-gates.txt` |
| `npm.cmd run check:tailwind-runtime-tokens` | 0 | `preflight-gates.txt`, `final-gates.txt` |
| `npm.cmd run check:tailwind-runtime-tokens:verify-gate` | 0 (10/10) | `preflight-gates.txt` |
| `npm.cmd run check:homepage-theme-runtime-deps` | 0 | `preflight-gates.txt`, `final-gates.txt` |
| `npm.cmd run check:homepage-theme-runtime-deps:verify-gate` | 0 (6/6) | `preflight-gates.txt` |
| B1 exact three commands in §17.3 | 0 | `b1-build-wiring.txt` |
| B2 exact three commands in §17.4 | 0 | `b2-apply.txt` |
| `node.exe $env:TEMP\task771-theme-inline-census.mjs (Get-Location).Path` | 0 | `b3-theme-inline-census.txt` |
| B4 exact six commands in §17.6 | 0 | `b4-utility-census.txt` |
| `npm.cmd run check:mojibake` | 0 | `final-checks.txt` |
| `npm.cmd run check:file-integrity` | 0 | `final-checks.txt` |

`npm run build` and screenshots were not run: Q0 changes no rendered code, package/configuration, or referenced
command.

## 7. Measured versus kickoff

| Class | Kickoff | Measured | Drift |
|---|---:|---:|---|
| B1 directives / PostCSS plugin / package entries | 7 / 1 / 7 | 7 / 1 / 7 | none |
| B2 live rules / comment hits | 10 / 6 | 10 / 6 | none |
| B3 names / plain root / overlap | 185 / 111 / 0 | 185 / 111 / 0 | none |
| B3 files / pairs / uses / story uses | 8 / 18 / 27 / 4 | 8 / 18 / 27 / 4 | none |
| B4 `className` files / lines | 152 / 2350 | 152 / 2350 | none |
| B4 UI-reference files excl. / incl. stories | 102 / 110 | 102 / 110 | none |
| B4 `src/components/ui/` files | 49 | 49 | none |

## 8. Verdict

> **`NOT_READY`** — B1–B4 are measured non-empty at SHA `960e78c50`; no task state or route-certification
> question enters the formula.

## 9. Deviations and limitations

- Amendment 2 replaced the unrelated `npx.cmd rg` package with direct native `rg.exe`; B2/B4 query semantics and
  baseline values are unchanged. No B4 substitute probe was created.
- The two Git warnings in `preflight-git.txt` are stderr-only and not porcelain paths.
- D65-A and the deliberate `HeroSearch.stories.tsx` divergence remain recorded but unchanged.
- Route-composition certification is an accepted repository limitation; the replacement control is task-scoped
  real-route evidence, not an unresolved blocker.

## 10. No removal confirmation

No `@import`, `@apply`, `@source`, `@custom-variant`, dependency, PostCSS plugin, token, component, story or script
was deleted or modified. `docs/tailwind-governance.md` §1–§16 remain byte-identical.

Read-after-write passed: §17.1–§17.10 are present and the ten evidence files are UTF-8 without BOM or replacement
characters. Reference validation passed for both decision documents and all eight B3 reader paths. The contradiction
scan against §1–§16, Sprint 65 §2/§8 and `docs/backlog.md` found no removal authorization, route-certification
claim, closed-sprint claim or D65-A decision.

## 11. Backlog update

`docs/backlog.md` contains only the Task-771 status and this session-log path. It does not repeat §17, B1–B4 or
evidence details.

## 12. Opus handoff

Review the real diff, the ten files under `docs/sessions/evidence/task771/`, and the Amendment 2 clean-start
evidence. This is a factual implementation handoff, not an approval.
