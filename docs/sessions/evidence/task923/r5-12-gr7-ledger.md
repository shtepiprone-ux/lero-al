# Task 923 Revision 4 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 4 write)

Sonnet, 2026-10-15, win32, Node v22.22.3, Playwright from the repo. Kickoff section 13 (R22-R23, AC20-AC22).
Evidence prefix `r5-`; `review-1/` ... `review-4/` and every `r2-` ... `r4-` file stay untouched.

## GR-7 (moment: execution)

Subject: a transformed carousel track whose own box lies outside its clipping frame while its visible slide lies inside
(R22), and the owner table (R23, tooling). Library read: `docs/research/references/2026-10-04`.
Live check, this session, 390x844 (`r5-10-gr7-live.mjs` -> `r5-10-gr7-live.json`):

| Source | Observed | Reading |
|---|---|---|
| WAI-ARIA APG Carousel, https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ (HTTP 200) | literal: "if slides that are not visible on screen are incorrectly hidden, e.g., displayed off-screen" | an off-screen slide is correct only when it is also out of assistive technology and the tab sequence; off-screen alone is the defect (the basis of R22) |
| TailAdmin /carousel | page scrollWidth 390 = 390; 4 `div.swiper` frames x 29..361, each: slide 1 inside, slide 2 partly out, slides 3-4 wholly out; 0 text, 0 controls in any slide | a partly visible slide stays a visible slide; media-only wholly-out slides are by design; the reference has no control in a slide, so it neither supports nor contradicts the control clause |
| Lahomes /ui-carousel.html | page scrollWidth 390 = 390; the slide selector of the script matched nothing | not relied on |
| Kamr, Omah | not re-operated / no carousel page | UNVERIFIED, not relied on |

Chosen practice: WCAG 2.2 SC 1.4.10 Reflow, the WAI-ARIA modal-dialog pattern (as in Revisions 1-3) and the APG
Carousel statement above for R22. No reference contradicts R22-R23. R23 is a tooling report (no reference applies).

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R22 | `exemptSlide` judges only the element and the descendants whose box is not wholly inside the bound's padding box (0.5px; zero-size ignored): none has a non-whitespace text node of its own; each `BOUND_CONTROL` match among them is out of the tab order (`tabindex="-1"`, `disabled`, `[inert]`) AND hidden from AT (`aria-hidden="true"` on it or an ancestor, `[inert]`). A failing detail ends ` holds <describe(D)> "<text or aria-label>"`. (b) unchanged | `in-page.mjs` `measure` | fixtures `track-active-slide-inside` PASS, `track-offscreen-slide-tabbable` FAIL (`holds button`), `track-offscreen-slide-aria-only` FAIL; mutation proof 15 of 15 |
| R23 | owner table: gallery counter -> 859 R58; gallery desync (`listinggallerypattern`) own row under "new - Opus to file"; Leaflet / chart rows as R21; component-overflow change against Revision 3 per component | `r5-60-owner-table.mjs` | owner table + session log |

## Preserved / required behaviour

Preserved: every rule key, the 43 self-test cases as stated, the 13 mutation proofs, the evidence row shape, the
registry, the in-flow `clippedAway` path (R11), the R15 bound, R16/R20 retry design, R19(b). Required: kickoff section 13.

## Task-owned write scope (sections 4, 10-13)

`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json`
(none expected); `scripts/__fixtures__/rendered-state-census/*.html` (three new); `scripts/__tests__/rendered-state-census.test.ts`;
`package.json` (none expected); `docs/sessions/evidence/task923/r5-*`; the session log
`docs/sessions/2026-10-10-task923-rendered-state-census.md` (`# Revision 4`); the 923 backlog cell.

Non-visible task (`Scope: none`): no mobile / UI / Storybook-proof receipt applies; no write-set path is a UI path.

## Requirement / AC ledger

R22 -> AC20, AC21 | R23 -> AC21. AC20: verify 43 earlier + 3 new cases, mutation proof 15 of 15. AC21: repeated full run on
the final build; AC18 checks hold except its `gallery-track` clause; an `r5-` copy of `r4-70-d16-classes.mjs` (only its input
path changed) prints 0 `image-layer`, `leaflet` / `chart` lines equal `rv3-d16-classes.txt` lines 2-3 and 6-8 (or each
difference explained row by row), and every remaining `gallery-track` detail is (i) a y-axis "n / N" counter or (ii) a track
detail whose `holds` names a tabbable named slide `button`; counts (i)/(ii) by Story; 0 of any other kind; the summary lists
every retried job. AC22: new test file twice, whole suite two consecutive green runs (any red kept and reported),
typecheck, lint, build, build-storybook, check:file-integrity, check:mojibake, `git status --porcelain` before / after.

GR-7 RESEARCH (execution) COMPLETE - references: WAI-ARIA APG Carousel (live, HTTP 200), TailAdmin /carousel live at 390; Lahomes slide selector matched nothing, Kamr and Omah not relied on; no conflict with section 13.
