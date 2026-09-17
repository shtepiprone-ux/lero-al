# Task 830 — `raw-dimension-responsive-prop` stops scanning a file silently on an unbalanced `prop={{`, and §23.1.d omits two blind spots

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Sprint 75 · P3 · QA profile **Q4** (detector arm change). Kickoff:
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_830_Responsive_Object_Unbalanced_Scan_Reported.md`.

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Status |
|---|---|---|---|
| R1 | An unterminated opener produces exactly one finding `{ cat: 'raw-dimension-responsive-prop', match: '<prop>: unparsed-object', line: <opener line> }`, sets `lastIndex` to `bodyStart`, continues the loop. | `scripts/check-design-tokens.mjs:490-507` (new branch replacing `break`); test AC1(a) `check-design-tokens.test.ts:1006-1010`. | Confirmed |
| R2 | A later well-formed responsive-object prop in the same file is still reported after an unbalanced opener. | Test AC1(b) `:1012-1021`; passes post-fix (failed pre-fix — see §3 red transcript). | Confirmed |
| R3 | A same-line marker suppresses the R1 finding exactly as the nested-object finding. | Test AC1(d) `:1034-1039`, JSX-comment convention (`:107-109`'s existing pattern). | Confirmed |
| R4 | No regression: every existing test passes; `check:design-tokens:strict` reports the same total as I0 (0). | 148/148 vitest green (144 pre-existing + 4 new); strict 0 violations both I0 and post-fix. | Confirmed |
| R5 | §23.1.d documents the unbalanced-opener fix and the two remaining blind spots (template-literal value, `//`-in-string truncation), names Task 830. | `docs/design-system.md:933-955` (quoted §3 below). | Confirmed |

## 2. Current versus required behavior

**Before.** `findResponsiveDimensionFindings` (`scripts/check-design-tokens.mjs:450-533`) counted braces without tracking quotes. When an opener's braces never balanced (a `'{'` inside a string, unmatched `prop={{` text, or a line truncated by the pre-scan `// comment` strip hitting a `//` inside a string), the loop hit `if (matchEnd === -1) break;` — exiting the **entire** `while` loop, so every later responsive-object prop in the file went unscanned with no finding, at exit 0.

**After.** The unterminated-opener case reports one `<prop>: unparsed-object` finding (same shape the pre-existing nested-object case already used) at the opener's own line, then resumes the regex search at `bodyStart` (just past the opener) instead of breaking — so a later well-formed opener in the same file is scanned from its own position, unaffected by the earlier failure.

**Negative flows** (all applicable, per kickoff §11):

| Flow | Result |
|---|---|
| Unbalanced opener at file end | One finding; loop terminates naturally (no infinite loop — `lastIndex = bodyStart > m.index`, strictly increasing). |
| Two consecutive unbalanced openers | Two findings (AC1(c)). |
| `//` inside a string truncating an object | Surfaces as `unparsed-object` — documented in §23.1.d, not separately tested (same code path as any other unbalanced opener; the pre-scan strip at `:451-454` is what produces the truncated content this scanner then sees). |
| Marker on the opener line | Suppressed (AC1(d)). |
| Balanced nested object | Unchanged (pre-existing tests still pass). |

## 3. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | `findResponsiveDimensionFindings`: replaced `break` on `matchEnd === -1` with an `unparsed-object` finding + resume-at-`bodyStart` (R1/R2); moved `openLine` computation earlier so both branches can use it. |
| `scripts/__tests__/check-design-tokens.test.ts` | Added `describe('unbalanced/unterminated opener …')` with AC1(a)-(d) cases inside the existing `raw-dimension-responsive-prop` describe block. |
| `docs/design-system.md` | §23.1.d: **Boundary** paragraph gained the unbalanced-opener sentence; **What it still cannot see** paragraph gained the template-literal and `//`-in-string blind spots, naming Task 830. |
| `docs/backlog.md` | Task 830 state line updated in place (no new physical lines — file stays at 80). |

## 4. Validation evidence

All commands run from `C:\Claude_Code_Projects\lero-al`. Transcripts under `docs/sessions/evidence/task830/`.

### I0 baseline (§13.1)

```
node.exe -p process.platform        → win32                     EXIT_CODE=0   (i0-platform.txt)
node.exe --version                  → v22.22.3                  EXIT_CODE=0   (i0-node-version.txt)
git --no-optional-locks status --porcelain → clean (only the new evidence dir) EXIT_CODE=0 (i0-git-status.txt)
git --no-optional-locks hash-object scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts docs/design-system.md
  → 2dda492c91ccabe375339f7ed9f15c948f7755bb
  → 5ea2db79bbe5f14c3b1415f90fd009630d4195d7
  → 793a59c3dc207fd85a4a83fbb5341ff49de81838            EXIT_CODE=0   (i0-hashes.txt)
npm.cmd run check:design-tokens:strict → 0 violations   EXIT_CODE=0   (i0-strict.txt)
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts → 144 passed EXIT_CODE=0 (i0-vitest.txt)
```

### Failing tests first (step 2 — red, unmodified detector)

Added AC1(a)-(d) to the test file, ran vitest against the **unmodified** `check-design-tokens.mjs`:

```
Test Files  1 failed (1)
Tests  3 failed | 145 passed (148)
```

AC1(a), (b), (c) failed exactly as the kickoff predicted (0 findings where 1/2/2 were expected). AC1(d) passed vacuously (an empty findings array already has length 0 before the marker logic is even exercised — the kickoff's own AC1 text only requires (a),(b),(c) to fail pre-fix). Full transcript: `red-vitest-pre-fix.txt`.

### Fix applied, re-run (step 3 — green)

```
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
  → Test Files 1 passed (1); Tests 148 passed (148)   EXIT_CODE=0   (green-vitest-post-fix.txt)
```

(One intermediate fix: `openLine` was referenced before its `const` declaration in the first patch — moved the declaration above the `matchEnd === -1` branch; re-run confirmed green.)

### Real-tree strict re-check (§5 assumption)

```
npm.cmd run check:design-tokens:strict → 0 violations, same total as I0 (0)   EXIT_CODE=0   (post-fix-strict.txt)
```

No new `unparsed-object` finding surfaced on the real tree — the I0-freshness assumption (0 real files hit the unbalanced branch) holds; no `BLOCKED` needed.

### §23.1.d edit (step 4)

Edited via the Edit tool (UTF-8, no BOM round-trip through `Get-Content -Raw`).

### Final gate block (§13.2)

```
node.exe -p process.platform                          → win32                          EXIT_CODE=0  (final-platform.txt)
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts → 148/148 passed        EXIT_CODE=0  (final-vitest.txt)
npm.cmd run check:design-tokens:strict                 → 0 violations                   EXIT_CODE=0  (final-strict.txt)
npm.cmd run typecheck                                   → tsc --noEmit clean             EXIT_CODE=0  (final-typecheck.txt)
npm.cmd run lint                                        → 0 errors, 78 pre-existing warnings (unrelated files) EXIT_CODE=0 (final-lint.txt)
npm.cmd run build                                       → production build succeeded     EXIT_CODE=0  (final-build.txt)
npm.cmd run check:file-integrity                        → PASSED, 22 files clean          EXIT_CODE=0  (final-file-integrity-confirm.txt)
npm.cmd run check:mojibake                              → 0 artifacts in 5470 files       EXIT_CODE=0  (final-mojibake-confirm.txt)
git --no-optional-locks diff --stat                     → 4 files changed, 74(+)/9(-)    (final-diffstat.txt)
git --no-optional-locks hash-object <4 files>            → see §5 below                   (final-hashes.txt)
```

**Self-inflicted evidence-file BOM note (not a task-scope defect):** the first `check:file-integrity` pass (`final-file-integrity.txt`) failed at exit 1 — but the 16 flagged files were all my own PowerShell-redirected (`*>`) evidence transcripts under `docs/sessions/evidence/task830/`, which Windows PowerShell 5.1's `Out-File`/`*>` writes with a UTF-8 BOM by default (5.1 has no `utf8NoBOM` option). None of the flagged files were the task's owned `scripts/`/`docs/` files. Stripped the BOM from every affected transcript (`python3`, byte-level truncation of the 3-byte `EF BB BF` prefix), then re-ran the check via **Bash** (Unix redirection, no BOM) for a clean confirmation transcript (`final-file-integrity-confirm.txt`, PASSED, 22/22 clean). The intermediate failing transcripts are retained in the evidence directory as part of the real session record.

## 5. Visual source trace

Not applicable — no visible UI surface. This is a Node governance script (`scripts/check-design-tokens.mjs`) plus its test file and a docs section. Per the kickoff's own task-quality-gate answer: "GR-1 / 16d? No visible surface."

## 6. Canonical UI decision record

Not applicable — no visible UI artifact changed.

## 7. Implementation validation notes

- The one defect found during implementation (not a task requirement gap): the first patch referenced `openLine` before its `const` declaration inside the loop body, causing a `ReferenceError` on every call into the new unbalanced-opener branch. Caught immediately by the first post-fix vitest run (all 4 new tests failed with `Cannot access 'openLine' before initialization`); fixed by hoisting the `const openLine = lineNumberAt(m.index);` line above the `if (matchEnd === -1)` branch (both branches need it). Re-run confirmed 148/148 green.
- No other implementation gaps. All five requirements (R1-R5) are evidenced; all three acceptance criteria (AC1-AC3) are met.

## 8. Assumptions, deviations, and limitations

- Followed the kickoff's stated boundary: quote-aware brace counting is explicitly out of scope (§5 of the kickoff) — the fix only changes what happens *after* the existing quote-unaware counter fails to balance, not the counting itself.
- The I0-freshness assumption (0 real `src` files hit the unbalanced branch) was re-verified post-fix: strict total is still 0, so no new file needed a `BLOCKED` report or a marker.
- `AC1(d)`'s pre-fix vitest run does not "fail" in the literal sense (empty array already has length 0), but this matches the kickoff's own AC1 text, which only requires (a), (b), (c) to fail pre-fix.
- No product source files were touched, per Out of Scope §8 of the kickoff.

## 9. Opus handoff

- Evidence directory: `docs/sessions/evidence/task830/` (I0 baseline, red pre-fix, green post-fix, full final gate block, diff stat, hashes).
- Real diff: `scripts/check-design-tokens.mjs` (lines ~472-508 area, `findResponsiveDimensionFindings`), `scripts/__tests__/check-design-tokens.test.ts` (new describe block after line 1003 of the original file), `docs/design-system.md` §23.1.d (lines 933-955), `docs/backlog.md` (Task 830 state line, in place, file still 80 physical lines).
- Suggested inspection points for review: (1) confirm the `lastIndex = bodyStart` resume point is correct per R1's exact wording; (2) confirm the marker-suppression test (AC1(d)) genuinely exercises the suppression path and isn't vacuously true — the JSX-comment brace characters are blanked by `stripJsxComments` before the brace-counter ever sees them, so they can't corrupt the unbalanced count, but worth a second look; (3) confirm §23.1.d's two new blind-spot sentences match R5's exact wording requirement.
- No open risks identified by the executor beyond the above.

## 10. Backlog update

`docs/backlog.md` Task 830 state updated in place (Last Session paragraph + Sprint 75 summary line) — no new physical lines added. File remains at **80 physical lines**, at the budget ceiling but not over it. No `BACKLOG LIMIT BREACH`.
