# Task 923 Revision 6 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 6 write)

Sonnet, 2026-10-15, win32, Node v22.22.3, Playwright from the repo. Kickoff section 15 (R28-R31, AC29-AC33); sections 1-14
stay binding and section 15 wins where they differ. Evidence prefix `r7-`; `review-1/` ... `review-6/` and every `r2-` ... `r6-`
file stay untouched. HEAD `003e6f82f` (`r7-11-i0.txt`); the hashes of the write-set code equal the Revision 5 end hashes
(`r6-87-hashes-end.txt`), checked.

## GR-7 (moment: execution)

Subject: (R28) a modal dialog's dismissal is judged on whether it closes; (R29-R30) evidence rows; (R31) a page that loads
content late is measured once it has settled. Library read: `docs/research/references/2026-10-04`. Live check, this session
(`r7-10-gr7-live.mjs` -> `r7-10-gr7-live.json`):

| Source | Observed | Reading |
|---|---|---|
| WAI-ARIA APG Dialog (Modal), https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (HTTP 200) | literal: "Escape : Closes the dialog."; "modal dialogs contain their tab sequence. That is, Tab and Shift + Tab do not move focus outside the dialog." | the pattern says that Escape closes the dialog; it states no time within which it must. R28 judges whether the overlay closes, not how fast; the 5 000ms bound only separates "closes" from "never closes" |
| WCAG 2.2 SC 1.4.10 Reflow (Understanding), https://www.w3.org/WAI/WCAG21/Understanding/reflow (HTTP 200) | literal: "Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions" | the criterion is about the content a page presents; measuring a page whose lazy content has not arrived yet measures a different page (R31) |
| Lahomes, Kamr, Omah, TailAdmin | not re-operated for this subject | no visible reference applies to the timing of a measurement; UNVERIFIED, not relied on |

Chosen practice: WAI-ARIA modal-dialog pattern and WCAG 1.4.10 as in Revisions 1-5. R28-R31 are tooling. No reference
contradicts them.

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R28 | `dismissCheck` polls the visible portal count every 50ms until 0, bound 5 000ms; message `<rule>: the portal is still visible 5000ms after the dismissal`; rows carry `dismissMs` | `runner.mjs`; fixture `slow-close` | self-test; mutation (bound back to 1 000) |
| R29 | `runWithRetry` returns the second attempt's rows only; a job is retried only for a load / open failure; the C148 unit test rewritten | `runner.mjs`; test file (C148 test only); fixture `open-flaky-once-closed-violation` | self-test; unit test; mutation (merge put back) |
| R30 | every row carries `skippedActions`; `markSkippedActions` no longer writes `notApplicable` | `runner.mjs`, `verify.mjs` (`track-flex-synced` asserts it) | self-test |
| R31 | one settle: 3 consecutive polls 100ms apart; portal count, finite animations, no in-flight same-origin request, unchanged layout signature; bound 8 000ms; rows carry `settle`; summary lists bounded jobs; static server `__census_delay` | `runner.mjs`, `in-page.mjs`; fixtures `late-fetch-overflow`, `late-fetch-inside`, `raf-grow-overflow`, `raf-grow-inside` | self-test; three mutations; AC31 probe |

AC29 (self-test 58 cases, mutation proof 26 of 26) -> AC30 (throttle probe) -> AC31 (chart chunk delay probe) -> AC32 (two full
runs, determinism) -> AC33 (vitest, typecheck, lint, build, build-storybook, file-integrity, mojibake, `git status`).

Order of work (kickoff 15.5): I0 and hashes -> R29, R30, R28, R31 with fixtures -> AC29 -> build-storybook -> AC30, AC31 ->
`r7-full-a` -> `r7-full-b` -> AC32 scripts -> AC33 -> session log. One writer per evidence file; nothing else runs while a
full run or the self-test runs.
