# Task 923 — review 6 (Revision 5, kickoff §14) — `NEEDS REVISION`

Reviewer: Opus, 2026-10-15, native Windows (win32), Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, HEAD
`448ebdaa8`. QA profile Q4. Diagnosis only; nothing under `scripts/` or `src/` was written by this review.

## Baseline

- The 62 delivered code and fixture files hash-equal `r6-87-hashes-end.txt` (`sha1sum -c`: 0 mismatches). The
  porcelain outside `task923/` differs from `r6-11-status-before.txt` only by `docs/backlog.md` and
  `scripts/check-mojibake.mjs`, and today's porcelain equals `r6-87-status-after.txt`.
- `git diff scripts/check-mojibake.mjs`: only `maxBuffer: 64 * 1024 * 1024` and the error code in the message (R27).
- Code read: `in-page.mjs` `clippedAwayBy` / the action skip (R24), `insidePaddingBox` / `trackSlideInFrame` (R25),
  `runningAnimations` / `settleFocus` (R26); `runner.mjs` `waitStable`, `settleFocus` after open / each Tab / the focus
  return, `markSkippedActions`; `verify.mjs` without `greenRules`. Each matches its requirement as written.
- GR-7: `rv6-03-gr7.md` (WAI-ARIA APG Carousel, live).

## Reproduced

| Check | Result | Evidence |
|---|---|---|
| AC23 self-test | 52 cases, "every case behaves as stated", exit 0 | `rv6-01-verify.txt` |
| AC23 mutations | 21 of 21 proved (R25 straddle by its detail, D33 accepted) | `rv6-02-mutations.txt` |
| AC25 AuthSheet | my two runs + executor run 1: 0 rows differ | `rv6-40-*`, `rv6-41-authsheet-compare.txt` |
| AC25 misc | my two runs + executor run 1: 7 differences, all `focus-open` on `adminshell--drawer-open` | `rv6-43-*`, `rv6-44-misc-compare.txt` |
| AC27 | listing 1 063 514 bytes, `npm run check:mojibake` exit 0 | `rv6-20-mojibake.txt` |
| AC24 / AC26 / AC28 | evidence read: in-flow slide details 0, tail rows 0, `image-layer` 0, Leaflet lines equal review 3, gate-level cells 924 / 925 only; the 13 red suite files are green alone and import no write-set path | `r6-71`, `r6-72`, `r6-70`, `r6-84-ac18-checks.txt`, `r6-91-*` |

Every AC23–AC28 holds as written. The executor's status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` is correct.

## Findings

1. **P1 (kickoff defect, R26 (c)): the full run's verdict still flips on dismissal.** Between `r5-full` and `r6-full`,
   11 rows change pass / fail on `dismiss-outside` alone — 6 turn red, 5 turn green (`rv6-11-verdict-flips.txt:3-4`),
   on code R24–R26 do not touch. Run alone, three times, the five Stories of the red-turning rows show 0 dismissal
   violations in 168 rows each (`rv6-52-dismiss-isolation-counts.txt`). Through the gate's own `dismissCheck` the menu
   of `adminuserstable--default~en-english` (uk, 1024) always closes, in about 310 ms at CPU 1x and up to 1 306 ms at 8x
   (`rv6-51-dismiss-throttle-probe.txt`). The full run uses 10 workers (`r6-82-full-run.txt:9`), and the 1 000 ms
   bound (`runner.mjs:250`) that §14 R26 (c) kept judges how fast a loaded machine closes the overlay, not whether it
   closes. The contract makes the whole-registry CI step blocking once a full run is green
   (`rendered-state-census.md:62`); a verdict that flips with machine load can never be that.
2. **P2 (kickoff defect, R16): a retry merges a different page into the row.** `runWithRetry` copies every rule the
   first attempt violated into the second attempt's row (`runner.mjs:476`). A retried first attempt never reached the
   state: its open timed out (`runner.mjs:283`), so the app root was measured on the closed, non-inert page
   (`runner.mjs:287`). In `r5-full`, 16 retried rows record the action rules as not measured ("a modal overlay is
   open") and carry the closed page's action violations (`rv6-10-na-vs-violation.txt:2-3`). R16's sentence "a retry
   never clears a violation of a measured rule" caused this; it meant "a failed measured rule is never retried".
3. **P3: the R24 skip count is written as a "not applicable" reason.** `markSkippedActions` puts it in `notApplicable`
   (`runner.mjs:94`) while the same rule keeps violations of other controls: 64 rows of `r6-full`
   (`rv6-10-na-vs-violation.txt:11-12`). A reader cannot tell "not measured" from "partly measured".
4. **P1 (D34, root cause found after the owner's D2): the gate measures a page that is still loading.** Every dashboard
   chart is a lazy, browser-only import (`MantineDashboardBarChart.tsx:14`). With the chunk on time the gate measures
   the chart's 3 overflow details (`rv6-57-chart-chunk-delay-probe.txt:2`); with the chunk 2 000ms late, `waitStable`
   returns at ~440ms with 0 chart details, and the page grows from 756 to 1 145 elements after the measurement
   (`rv6-57…:7`). Ruled out: one page or 10 parallel pages at CPU 1x/4x (`rv6-53`, `rv6-54`), page reuse and storage
   (`rv6-55`), late images (`rv6-56`).

## Rulings on the executor's points

- D33 accepted (the straddle fixture is also red through R22's positioned path; the detail proof is right).
- D34 accepted as explained; Finding 4.
- D35 accepted: AC28 holds; the whole-suite timeouts are filed at closure (§14).
- D36 (v) is Finding 1. D36 (ii) is Finding 2. D37, D38 accepted.

## Verdict

`NEEDS REVISION` → kickoff §15, Revision 6 (R28–R31, AC29–AC33; owner D2, 2026-10-15: keep the full run, a kickoff that
lets the executor find every defect). R31 settles the page before measuring (no same-origin request in flight, an
unchanged layout signature, an 8 000ms bound); AC32 proves determinism by two full runs that agree. The code delivered
for R24–R27 stays as it is.
