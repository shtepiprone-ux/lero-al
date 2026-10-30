# Task 923 Revision 5 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 5 write)

Sonnet, 2026-10-15, win32, Node v22.22.3, Playwright from the repo. Kickoff section 14 (R24-R27, AC23-AC28).
Evidence prefix `r6-`; `review-1/` ... `review-5/` and every `r2-` ... `r5-` file stay untouched. HEAD `448ebdaa8`
(`r6-11-i0.txt`); the write-set code files equal the Revision 4 end hashes (`r5-87-hashes-end.txt`), checked.

## GR-7 (moment: execution)

Subject: a control that is clipped away, hidden from assistive technology and out of the tab order (R24); the focus after
a Tab press inside a modal dialog (R26); a transformed track of in-flow slides (R25, tooling). Library read:
`docs/research/references/2026-10-04`. Live check, this session, 390x844 (`r6-10-gr7-live.mjs` -> `r6-10-gr7-live.json`):

| Source | Observed | Reading |
|---|---|---|
| WAI-ARIA APG Carousel, https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ (HTTP 200) | literal: "if slides that are not visible on screen are incorrectly hidden, e.g., displayed off-screen" | an off-screen slide is correct only when it is also out of assistive technology and the tab sequence (the basis of R22 and of the R24 bound: both halves of (i) are required) |
| WAI-ARIA APG Dialog (Modal), https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (HTTP 200) | literal: "modal dialogs contain their tab sequence. That is, Tab and Shift + Tab do not move focus outside the dialog."; "Escape : Closes the dialog." | the trap rule the gate measures. The pattern says where the focus ends after a key press, not that it is read in the same instant: R26 (b) judges the settled element, the rule itself is unchanged |
| TailAdmin /carousel | page scrollWidth 390 = 390; 4 `div.swiper` frames x 29..361, each: slide 1 inside, slide 2 partly out, slides 3-4 wholly out; 0 text, 0 controls in any slide | a slide in the frame is visible content; slides wholly out are by design; the reference has no control in a slide, so it neither supports nor contradicts the control clause |
| Lahomes, Kamr, Omah | not re-operated for this subject | UNVERIFIED, not relied on |

Chosen practice: WCAG 2.2 SC 1.4.10 Reflow and the WAI-ARIA modal-dialog pattern (as in Revisions 1-4), the APG Carousel
statement above for R24 / R25. R26 and R27 are tooling (no visible reference applies). No reference contradicts R24-R27.

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R24 | `action-hidden`, `action-covered`, `target-small` skip an action only when (i) it is out of the tab order AND hidden from AT, and (ii) a target ancestor with `overflow-x` or `overflow-y` not `visible` has its padding box wholly past the action's box on one axis (0.5px). `greenRules` removed from `verify.mjs`. New fixture `visible-hidden-control-covered`. | `in-page.mjs` actions loop; `verify.mjs` | `track-active-slide-inside` PASS on every rule of every root; `track-offscreen-slide-aria-only` FAIL `component-overflow` + `action-covered`; `visible-hidden-control-covered` FAIL `action-covered`; 2 mutations |
| R25 | in-flow path: an element whose parent has `transform` other than `none` is not measured against the parent when its box is wholly inside the padding box of `nearestClipper` (0.5px, both axes). Fixtures `track-flex-synced`, `track-flex-slide-straddles`, `inflow-past-untransformed-parent`. | `in-page.mjs` in-flow branch | 3 cases; 2 mutations |
| R26 | (a) `waitStable` counts only animations with finite iterations; (b) focus reads settle (poll 50 ms, same element on 3 consecutive polls, bound 1000 ms) after each Tab / Shift+Tab, after open, after dismissal. Fixtures `infinite-spinner-toast`, `trap-transient-body-focus`. | `runner.mjs` | 2 cases; 2 mutations |
| R27 | `check-mojibake.mjs`: `maxBuffer: 64 * 1024 * 1024`, failure message names `r.error?.code`. | `scripts/check-mojibake.mjs` | AC27 transcripts (unmodified command exits 0; planted file exits 1 and is named; deleted -> exit 0) |

## Preserved / required behaviour

Preserved: every rule key (20), the 46 self-test cases as stated (except the removed `greenRules` assertion, which R24
replaces with all-rule assertions), the 15 mutation proofs, the evidence row shape, the registry, the in-flow
`clippedAway` path (R11), the R15 bound, R16 / R20 retry design (no retry is added by R26), R19(b), R22. Required: kickoff
section 14.

## Task-owned write scope (sections 4, 10-14)

`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json`
(none expected); `scripts/__fixtures__/rendered-state-census/*.html` (six new); `scripts/__tests__/rendered-state-census.test.ts`;
`scripts/check-mojibake.mjs` (R27 only); `package.json` (none expected); `docs/sessions/evidence/task923/r6-*`; the
session log `docs/sessions/2026-10-10-task923-rendered-state-census.md` (`# Revision 5`); the 923 backlog cell.
Out of scope: AdminShell, AuthSheet and ListingContactPattern sources and Stories; every product source.

Non-visible task (`Scope: none`): no mobile / UI / Storybook-proof receipt applies; no write-set path is a UI path.

## Requirement / AC ledger

R24 -> AC23, AC24 | R25 -> AC23, AC24 | R26 -> AC23, AC25, AC26 | R27 -> AC27 | R24-R27 -> AC28.
AC23: verify 52 cases (46 + 6), all-rule PASS cases, no `greenRules` under `scripts/rendered-state-census/`, mutation proof
21 of 21 (`r6-50-...`). AC24: narrowed gallery run, `r6-71-` copy prints 0 in-flow slide details, 0 `component-overflow`
details other than counter / desync, rows with a tail = 0, action-rule counts next to `r5-full`. AC25: two narrowed
configurations x 3 runs, per-row comparison, only `focus-open` on `adminshell--drawer-open` may differ, `r6-` copy of the
toast probe returns `waitStable` under 4 000 ms. AC26: full run, 22 740 unique rows, 20 rule keys, AC4, 924 / 925 cells only,
`r6-` copy of `r5-70-d16-classes.mjs` (0 `image-layer`, `leaflet` = `rv3` lines 6-8, `chart` = lines 2-3 or explained), row diff
against `r5-full` attributed to R24 / R25 / R26 (a) / R26 (b), retried jobs and runtime in the summary, owner table = R23's +
"AdminShell drawer initial-focus race", in-flow slide row gone. AC27: mojibake three transcripts. AC28: new test file twice,
`npm test` once and kept, typecheck, lint, build, build-storybook, check:file-integrity, `git status --porcelain` before / after.

GR-7 RESEARCH (execution) COMPLETE - references: WAI-ARIA APG Carousel and APG Dialog (Modal) (live, HTTP 200), TailAdmin /carousel live at 390; Lahomes, Kamr and Omah not relied on; no conflict with section 14.
