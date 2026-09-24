# Task 830 — `raw-dimension-responsive-prop` stops scanning a file silently on an unbalanced `prop={{`, and §23.1.d omits two blind spots

Sprint 75 · P3 · QA profile **Q4** (detector arm change)

**Status: ✅ `APPROVED WITH NOTES` 2026-09-17 (Opus implementation review 1) — archived; ledger `docs/reviews/2026-09-17-task830-responsive-object-unbalanced-opener.review-ledger.json`. The review added the stray-`}`-in-string blind spot to §23.1.d and replaced its `§451-454` line reference.** Was: `READY FOR SONNET` 2026-09-17. Task 797 is committed (`ce0a9afb0`). Sequence **before Task 829**, which
also edits `docs/design-system.md`.

## 1. Mode and task type

`IMPLEMENTATION` — detector fix in `scripts/check-design-tokens.mjs` + tests + one docs subsection. Bundle:
**TailAdmin / Styling Governance** (`check:design-tokens`) + **Docs / Governance**. No product source changes.

## 2. Objective

When a `prop={{` opener's braces never balance (a `'{'` inside a string value, `prop={{` text inside a string, or a
line truncated at a `//` inside a string), `findResponsiveDimensionFindings` executes `break` and every later
responsive-object prop in that file goes unscanned, with no finding and exit 0. Replace the silent stop with a visible
`<prop>: unparsed-object` finding and continue scanning after the opener. Record the two remaining blind spots in
§23.1.d.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

`FACT` — `scripts/check-design-tokens.mjs:450-533` `findResponsiveDimensionFindings`: its brace counter counts every `{`/`}` without tracking quotes (`:481-489`), then `:490`
`if (matchEnd === -1) break; // unterminated on this content — nothing more to scan safely`. `break` leaves the
`while (RESPONSIVE_PROP_OPEN_RE.exec(content))` loop, so no later opener in the file is examined. The nested-body case
(`:495-505`) already reports `match: \`${propName}: unparsed-object\`` with label
`raw dimension in Mantine responsive object prop (unparsed nested object)` and continues. The unbalanced case does
neither.

`FACT` — `:451-454` blanks skip-lines and strips a trailing `//…` from each physical line
(`.replace(/\s*\/\/.*$/, '')`) **before** scanning. A `//` inside a string value (e.g. `'https://…'`) truncates the line
and can itself leave the object unbalanced.

`FACT` — `RESPONSIVE_PROP_OPEN_RE` (`:411`) = `\b(?:<DIMENSION_PROP_NAMES minus offset>)=\{\{`, global flag. The
loop resumes via `RESPONSIVE_PROP_OPEN_RE.lastIndex = matchEnd` (`:504`, `:529`).

`FACT` — `docs/reviews/2026-09-16-task797-responsive-object-raw-dimension-detector.review-ledger.json` (Task 797 review):
"a '{' inside a string or an unmatched 'prop={{' text ends the scan of the rest of that file with no finding (latent —
0 of 651 real src files hit it); a template-literal unit value and a line carrying '//' inside a string are not seen.
Filed as P3 notes, Task 830."

`FACT` — tests: `scripts/__tests__/check-design-tokens.test.ts:893-1004` `describe('raw-dimension-responsive-prop …')`,
including `:958` "a nested object body is NOT skipped silently — it reports unparsed-object".

`FACT` — `docs/design-system.md:910-948` §23.1.d. Its "What it still cannot see" paragraph (`:942`) lists
variable/function-call values, spreads and non-listed props only.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3 | An unterminated opener produces exactly one finding `{ cat: 'raw-dimension-responsive-prop', match: '<prop>: unparsed-object', line: <opener line> }` with a label naming the unbalanced case, then sets `lastIndex` to just after the opener (`bodyStart`) and **continues** the loop. | **P0** | AC1 | Confirmed |
| **R2** | §3 | A later, well-formed responsive-object prop in the same file is still reported normally after an unbalanced opener. | **P0** | AC1 | Confirmed |
| **R3** | marker contract | A same-line `design-tokens-allow: <prop>: unparsed-object — <reason>` marker suppresses the R1 finding exactly as it does the nested-object finding (same `rawValue` string). | P1 | AC1 | Confirmed |
| **R4** | no regression | Every existing test in the file passes unchanged, and `check:design-tokens:strict` on the real tree reports the same total as I0 (expected 0). | **P0** | AC2 | Confirmed |
| **R5** | §3 | §23.1.d states: an unbalanced opener is reported as `unparsed-object` (not skipped), and the scanner still cannot see (a) a template-literal value (`` `12px` ``) and (b) content after a `//` inside a string on the same line, which is truncated before scanning and may surface as `unparsed-object`. It names Task 830. | P1 | AC3 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (I0 freshness) — 0 real `src` files hit the unbalanced branch (797 ledger). **Stop:** if the post-fix
  strict run reports any new `unparsed-object` finding on the real tree, report the file and line as `BLOCKED` for Opus.
  Do not add a marker to make it pass.
- Quote-aware brace counting is **not** in scope: it would change which bodies parse, and the Task 797 contract does not
  ask for it. It stays a stated boundary (R5).

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 9, 14 · `docs/qa-profiles.md` (Q4) · `docs/design-system.md` §23.1.d
and §23.6 (markers) · `scripts/check-design-tokens.mjs:395-540, 740-800` · `scripts/__tests__/check-design-tokens.test.ts:1-50, 893-1004` ·
this kickoff.

## 7. Scope

- **Edited:** `scripts/check-design-tokens.mjs` (`findResponsiveDimensionFindings` only) ·
  `scripts/__tests__/check-design-tokens.test.ts` (new cases in the `raw-dimension-responsive-prop` describe) ·
  `docs/design-system.md` (§23.1.d) · `docs/backlog.md` (830 state line).
- **Written:** `docs/sessions/evidence/task830/*` · `docs/sessions/<date>-task830-*.md`.

## 8. Out of scope

Every other detector category · quote-aware brace counting · `DIMENSION_PROP_NAMES` · any product file · allowlists.

## 9. Current and required behavior

**Before.** One unbalanced `prop={{` hides every later responsive-object prop in its file, and the gate stays green.
**After.** The unbalanced opener is itself a finding, and the rest of the file is still scanned.

## 10. Implementation requirements

1. **I0**: status snapshot, hashes of the three files, `check:design-tokens:strict` transcript, and the vitest file
   transcript.
2. **Failing tests first**: add the AC1 cases and run vitest on the unmodified detector. It must fail (the unbalanced
   case yields 0 findings, and the later prop is missed). If it passes, stop with `BLOCKED — TEST BLIND`.
3. Replace the `break` with R1. Re-run.
4. Edit §23.1.d (R5) through Node UTF-8 I/O.

## 11. Positive and negative flows

**Positive.** A file with `mt={{ base: '{' }}` then `h={{ base: 279 }}` produces `mt: unparsed-object` and `h.base: 279`.

| Negative flow | Applicable | Expected |
|---|---|---|
| Unbalanced opener at file end | Yes | one finding, loop terminates (no infinite loop: `lastIndex` strictly advances) |
| Two consecutive unbalanced openers | Yes | two findings |
| `//` inside a string truncating an object | Yes | `unparsed-object` finding (R5 documents it) |
| Marker on the opener line | Yes | suppressed (R3) |
| Balanced nested object | Yes | unchanged existing behaviour |

## 12. Acceptance criteria

- **AC1 [R1–R3]** — new tests: (a) `<Box mt={{ base: '{' }} />` → exactly one finding `mt: unparsed-object`;
  (b) `<Box mt={{ base: '{' }} />\n<Skeleton h={{ base: 279 }} />` → contains `mt: unparsed-object` and `h.base: 279`;
  (c) two unbalanced openers on separate lines → two findings; (d) (a) with a same-line
  `{/* design-tokens-allow: mt: unparsed-object — test */}` marker (the JSX-comment convention of the test at `:107-109`) → no reported violation through the marker path the
  existing marker tests use. The retained pre-fix run fails (a), (b), (c). The post-fix run passes all.
- **AC2 [R4]** — `npx vitest run scripts/__tests__/check-design-tokens.test.ts` exits 0 with the previous count + the
  new cases, and `npm run check:design-tokens:strict` reports the same total as I0 and exits 0. Quote both.
- **AC3 [R5]** — quote the edited §23.1.d paragraphs.

`GR-4 AC AUDIT — 3 criteria; each states an observable property; absolutes: AC2 "same total as I0" compares against a
measured baseline, not a constant.`

## 13. QA profile and verification plan

**`Q4`** — a blocking detector arm changes, so failing tests come first. No rendered change and no owner visual matrix.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts docs/design-system.md
npm.cmd run check:design-tokens:strict
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
```

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npm.cmd run check:design-tokens:strict
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts docs/design-system.md docs/backlog.md
```

Expected: every command exit 0. Each command gets its own unpiped transcript with `EXIT_CODE=`.

## 14. Completion report contract

Files with hashes · R1–R5 · I0 + failing-test transcripts · AC1–AC3 quotes · every command with exit code and path ·
assumptions · deviations · limitations. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why resume at `bodyStart`, not at file end? | Each opener counts its own braces from its own position, so a later well-formed opener is unaffected by an earlier unbalanced one (R2). |
| Can the loop hang? | `lastIndex` = `bodyStart` > `m.index`, strictly increasing (negative-flow row 1). |
| Why not quote-aware counting? | It changes the parse contract. Documented boundary instead (§5). |
| GR-1 / 16d? | No visible surface. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `qa-profiles` Q4 | failing tests before the arm change | §10.2, AC1 | COMPLIANT |
| `agent-contract` 9 / 14 | build exit 0; encoding-safe doc write | §13.2, §10.4 | COMPLIANT |
| GR-2 | blind spots documented | R5 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | §13.1 | strict non-zero at I0 → report before editing |
| 1 red | vitest pre-fix | new cases pass → `BLOCKED — TEST BLIND` |
| 2 fix | vitest post-fix | any failure → not done |
| 3 real tree | strict total vs I0 | total changed → `BLOCKED` (§5) |
| 4 final | §13.2 | any non-zero → not `IMPLEMENTED` |
