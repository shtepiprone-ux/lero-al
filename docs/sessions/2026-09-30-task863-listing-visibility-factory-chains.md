# Task 863 — `check:listing-visibility` follows arrow query-builder factories

Task: `tasks/Archive/Sprint_78_kickoff_prompt_Task_863_Listing_Visibility_Gate_Sees_Factory_Chains.md` (revision 1) ·
QA profile Q4 · executed 2026-09-30, win32 v22.22.3 · Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Task path and status

Implemented by Sonnet; not approved. R8 is `HELD — TEXT RECORDED` (§6): `docs/critical-flow-registry.md` carried another
task's uncommitted hunks at step R8 (`git diff --quiet` exit **1**, `14-r8-diff-quiet.txt`).

## 2. Requirement and acceptance-criteria evidence

| ID / AC | Evidence | Result |
|---|---|---|
| R1, R3, R5 / AC1 | `01-verify-before-detector.txt`: BAD 1–5 `MISSED` on the shipped extractor (25 passed, 5 failed; the five NO-FP already clean). `02-verify-after-detector.txt` and `20-verify-final.txt`: 30 passed, 0 failed (13+5 BAD, 3 GOOD, 4+5 NO-FP), exit 0 | met |
| R2 / AC2 | BAD 4 detected (write at one call site, read with literal at another); NO-FP 4 clean (write-only call site) | met |
| R4 / AC3 | `21-gate-final.txt`: `Allowlist: 8 entries, 0 stale.`; `queries.ts:241` and `data.ts:281` not reported; diff adds exactly the two R4 entries | met |
| R4, §3.2 / AC4 | gate exit **1**, violation list = exactly `contactEvents.ts:50` (887 not landed); not touched, not allowlisted | met |
| R4 / AC5 (P3) | `12-plant-p3-gate.txt`: fingerprint `.gte('expires_at', window.startUtcX)` → entry listed under "Stale allowlist entries", `Allowlist: 8 entries, 1 stale`, exit 1. Script hash before `f5d50aab7f9c423c07a3e8394dddc96666e44dec`, after restore identical (`13-plant-hashes.txt`) | met |
| R6 / AC6 (P0–P2) | P0 `queries.ts` = `d263d56baabdeaee6ecd2c04efa7cbd7bbe81339`. P1 (`10-plant-p1-gate.txt`): line 237 → `countOf(() => listingCount().in('status', ['active', 'pending'])),` → exit 1 naming `src/modules/admin/dashboard/queries.ts:237`. P2 restore via Node from P0 bytes: hash equal; `11-plant-p2-gate.txt` has no `:237`. `queries.ts` absent from final `git status --porcelain` (`29-end-hash-status.txt`) | met |
| R7 / AC7 | One scope line printed at the top of `--verify-gate`, scan and `--report` (`grep -c Scope:` = 1 in each of `20/21/22`) | met |
| R8 / AC8(b) | see §6 | HELD — TEXT RECORDED |
| R9 / AC8 | this log; `docs/backlog.md` 863 cell edited only; backlog physical lines = 80 | met |

## 3. Current versus required behavior

| Case | Before | After |
|---|---|---|
| `listingCount().eq('status','active')` behind an arrow factory | passes silently | fails, line named |
| Factory wrapped by `applyPublicVisibility`; dynamic `status`; other table; write call site; never-called factory | clean | clean (NO-FP 1–5) |
| Direct chains, derived variables, the six original allowlist entries | as before | unchanged, none stale |
| Console output | no scope statement | scope line once per run; failing runs also print the `Allowlist: N entries, K stale` line |

## 4. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-listing-visibility.mjs` | shape 3 (`extractFactoryCallBlocks`), 2 R4 allowlist entries, 10 self-test snippets, scope line, allowlist count on failing runs |
| `docs/sessions/2026-09-30-task863-listing-visibility-factory-chains.md` | this log |
| `docs/sessions/evidence/task863/` (new files `00-*`…`29-*`) | transcripts, plant witnesses, hashes |
| `docs/backlog.md` | 863 fragment in the Sprint 78 registry row only |

Not changed: `docs/critical-flow-registry.md` (R8 held), `queries.ts` (plant only, restored), `data.ts`.

## 5. Validation evidence (all unpiped; exit code appended as a separate line)

| Command | Exit | Transcript |
|---|---|---|
| `check:listing-visibility:verify` | 0 (30/0) | `20-verify-final.txt` |
| `check:listing-visibility` | 1 (AC4: only `contactEvents.ts:50`) | `21-gate-final.txt` |
| `check:listing-visibility:report` | 0 | `22-report-final.txt` |
| `vitest run …/visibility.test.ts` | 0 (66 tests) | `23-visibility-vitest.txt` |
| `typecheck` | 0 | `24-typecheck.txt` |
| `lint` | 0 | `25-lint.txt` |
| `check:file-integrity` | 0 (155 files) | `26-file-integrity.txt` |
| `check:mojibake` | 0 | `27-mojibake.txt` |
| `build` | 0 | `28-build.txt` |

I0: `00-start-status.txt`, `00-start-manifest.txt`, `00-gate-baseline.txt` (exit 1, only the 887 line), `00-verify-baseline.txt` (20/0),
`00-probe.txt` (exactly the two expected `NEW` lines, text identical).
Encoding: PowerShell redirects wrote BOMs into the evidence files; stripped through Node over a printed 22-file manifest (`design/` excluded), and the
integrity/mojibake transcripts re-captured from Bash. The script itself has no BOM.

## 6. R8 — registry text held (docs/critical-flow-registry.md carries another task's uncommitted hunks)

`git --no-optional-locks diff --quiet -- docs/critical-flow-registry.md` → exit **1**. Row 70 was `ROW70 = HEAD` at I0.

Old substring (present verbatim in row 70, exactly once):

`gate self-test (7 bad variants + 3 good + 4 no-false-positive)`

Replacement (counts from `20-verify-final.txt`; the 45 → 66 totals in the row are the vitest count and are unchanged):

`gate self-test (18 bad variants + 3 good + 9 no-false-positive; Task 863 adds same-file arrow-factory call sites, their continuation lines and variables assigned from them)`

## 7. Assumptions, deviations, limitations

- **CHANGED — NOT ATTRIBUTED:** `docs/critical-flow-registry.md` hash at end `ddaf47db921ba46d44f6b7c9f3e2f25ff33e1fc3`; the I0 manifest recorded
  `481A06842877D5051EA9AC3693AE8BAE715AF7EC1704EB4D738069E0F6FDABDD` (SHA-256, so not directly comparable; the file was modified before and after by Task 893).
  `docs/backlog.md` was modified at line 54 (Sprint 84 row) by another session before my edit; I changed only the 863 fragment on line 53.
  `r3-build.txt` under `task893/` was locked when the manifest was taken and is not hashed.
- Task 893 was still executing while this ran (its `r3-*` files appear in the tree). The gate scan includes its untracked files; no violation or reach change appeared.
- Path+substring allowlisting cannot tell two identical literals in one file apart (pre-existing property, unchanged). It is why P1 uses `.in(...)`.
- Deviation, minor: the failing-run output now prints `Allowlist: N entries, K stale.` so AC3 can be evidenced while 887 keeps the gate red.
- Cross-task: a later edit rewriting `data.ts:281`'s `.gte('expires_at', window.startUtc)` text makes the R4 entry stale and the gate names it (intended).
- Blind classes (R7 line): `function` factories, later-line `from('listings')`, imported/argument-passed/stored factories, dynamic strings. Over-capture of a same-named identifier in another scope of one file (A1) accepted.

## 8. Opus handoff

Inspect: `scripts/check-listing-visibility.mjs` diff; `01` vs `02` transcripts (failing arm); `10`/`11`/`12`/`13` (plants); §6 recorded text and
whether the registry is clean at closure. Open question for Opus: apply §6 at closure or file it as an active item (AC8).

## 9. Backlog update

863 fragment on line 53 set to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; `docs/backlog.md` = 80 physical lines, no `BACKLOG LIMIT BREACH` from this task.
