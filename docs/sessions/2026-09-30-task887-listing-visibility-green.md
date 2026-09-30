# Task 887 — `check:listing-visibility` exits 0 again (session log, 2026-09-30)

## 1. Task path and status

`tasks/Sprints/Sprint_78_kickoff_prompt_Task_887_Listing_Visibility_Gate_Green_Again.md` —
**IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Win32 v22.22.3 (`docs/sessions/evidence/task887/` commands). No UI, no
Story, no visible text: GR-1/GR-3/3a/3b/3c/3d not applicable.

Receipt: `GR-0 CANONICAL REUSE PREFLIGHT — request: one gate-script allowlist entry, no visible UI, Story or style; ... decision: REUSE; selected canonical owner: scripts/check-listing-visibility.mjs ALLOWLIST; new hardcoded visual values: NONE.`

## 2. Requirement and acceptance-criteria evidence

| ID | Evidence | Result |
|---|---|---|
| R1 / AC1 | `git diff --stat`: `scripts/check-listing-visibility.mjs | 2 ++` (one comment line + one entry, nothing else). Gate prints `Allowlist: 9 entries, 0 stale.`; `02` printed 8 (Task 863 had already landed, so the baseline is 8, not 6). `20-gate-final.txt` | met |
| R2 / AC2 | `01-hash-before.txt` and `28-hash-final.txt`: `contactEvents.ts` = `fac96fca513fc161bc91800a2c42e30cf780bab7` both; path absent from `29-status-final.txt` | met |
| R3 / AC3 | P1 `05` exit 1 naming `:51` and `:50`; P2 `06` hash restored, exit 1 on `:50` only; P3 `07` exit 1 naming `:51` only; P4 `08` hash restored, exit 0 | met |
| R4 / AC4 | `03` and `21`: `Self-test: 30 passed, 0 failed` both | met |
| R5 / AC5 | §6 below | met |
| R6 / AC5 | this log; `docs/backlog.md` 887 cell edited in place, 80 lines | met |

Plant table:

| Plant | Hash of `contactEvents.ts` | Gate exit | Violations named |
|---|---|---|---|
| P1 (before R1) | `10c4645d5497249ca588e3b11c75b6e8dc8446ed` | 1 | `:50`, `:51` |
| P2 (restore) | `fac96fca513fc161bc91800a2c42e30cf780bab7` = `01` | 1 | `:50` |
| P3 (after R1) | `10c4645d5497249ca588e3b11c75b6e8dc8446ed` | 1 | `:51` |
| P4 (restore) | `fac96fca513fc161bc91800a2c42e30cf780bab7` = `01` | 0 | none |

## 3. Current versus required behavior

Before: gate exit 1 on `contactEvents.ts:50`. After: exit 0. Product behavior unchanged (file hash equal): WhatsApp
clicks on sold/rented/archived listings are still recorded. A new non-fingerprinted literal in the file is still
reported (P3).

## 4. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-listing-visibility.mjs` | R1: one fingerprinted `ALLOWLIST` entry (+ comment line) |
| `docs/sessions/2026-09-30-task887-listing-visibility-green.md` | this log |
| `docs/sessions/evidence/task887/` | new evidence files only (`00`–`29`) |
| `docs/backlog.md` | 887 cell updated in place |

Final hash of `scripts/check-listing-visibility.mjs`: `3f070cbd020767000142247d8f64d5568209ba52`.
`contactEvents.ts` was touched only by the plant and restored byte-identical. The other modified paths in
`29-status-final.txt` belong to Task 893 (`EXCLUDED AS UNRELATED`).

## 5. Validation evidence (actual exit codes)

`node -p platform` → `win32 v22.22.3`; `check:listing-visibility` 0; `:verify` 0; `:report` 0; `typecheck` 0; `lint` 0;
`check:file-integrity` 0 (after the BOM fix below); `check:mojibake` 0; `build` 0.

## 6. Limitations

- **R5 blind spot.** An allowlist entry matches path + substring, not line. The R1 entry therefore also silences any
  later *identical* `.in('status', ['active', 'sold', 'rented', 'archived'])` literal added elsewhere in
  `contactEvents.ts`. P3 proves only that a *different* literal is still caught. Stated, not fixed.
- GR-2 scope: the gate inspects inline status/expiry literals on `from('listings')` blocks in non-excluded `src` files.
  The criteria are closed by the P1–P4 transcripts and hashes, not by the green line alone.

## 7. Implementation validation notes

- First `check:file-integrity` run exited 1: PowerShell 5.1 `*>` / `Out-File -Encoding utf8` wrote a UTF-8 BOM into the
  15 `NN-*.txt` transcripts I created. I stripped it with Node over that exact manifest (`docs/sessions/evidence/task887/NN-*.txt`, 15 files) and re-ran the gate → exit 0 (`25`). Transcript content is otherwise unchanged; the
  `*> ` redirect of a failing npm run also shows a PowerShell `NativeCommandError` wrapper around the allowlist line in
  `02` and `07`, which is a capture artifact.
- The kickoff expected allowlist size N = 6+1 (or 8+1 if 863 landed); 863 had landed, so 8 → 9.

## 8. Opus handoff

Evidence: `docs/sessions/evidence/task887/`. Please check: the diff is exactly two added lines; the `contactEvents.ts`
hash equality; and that the R5 blind spot is acceptable.

## 9. Backlog update

887 cell edited in place in `docs/backlog.md` row 53; resulting length 80 lines (no breach).
