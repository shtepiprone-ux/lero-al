# Task 923 Revision 3 - GR-7 execution audit and requirement ledger (recorded BEFORE the first Revision 3 write)

Sonnet, 2026-10-14, win32, Node v22.22.3, Playwright from the repo. Kickoff section 12 (R19-R21, AC16-AC19).
Evidence prefix `r4-`; `review-1/`, `review-2/`, `review-3/` and the `r3-*` files stay untouched.

## GR-7 (moment: execution)

Subject: positioned / transformed content inside a clipping frame (R19: a media-only slide translated wholly out of its
frame; an image that covers its frame at hover scale), a render timeout as a transient (R20), the owner table (R21).
Library read: `docs/research/references/2026-10-04` (Lahomes 057 `/ui-modal.html`, TailAdmin 074 `/modals`).
Live check, this session, 390x844 (`r4-10-gr7-live.mjs` -> `r4-10-gr7-live.json`):

| Reference | Page | Observed | vs earlier passes |
|---|---|---|---|
| Lahomes | /ui-modal.html "Launch demo modal" | page scrollWidth 390 = clientWidth 390; `div.modal-content` x 8..382; 0 positioned / transformed descendants, 0 past the box; Escape closes it | unchanged |
| TailAdmin | /carousel | page scrollWidth 390 = 390; two `div.swiper` frames (x 29..361); 8 `div.swiper-slide` translated wholly outside the frame (x 690..1350) hold media only; the next slide (x 360..690) is partly past the frame | the media-only wholly-out slide is a by-design shape of a reference carousel (R19 case a); a slide that is only partly out is not exempt |
| Lahomes | /ui-carousel.html, /property-grid.html (hover a card image), /property-details.html | page scrollWidth 390 = 390; the only wholly-out content is the off-canvas navigation / offcanvas panels and simplebar tracks past `body` (page-level, not a clipping frame inside a dialog); no image that covers a frame at hover scale was found at 390 | no conflict with R19 |
| Kamr | - | NOT re-operated this revision | earlier record stands; not relied on |
| Omah | - | no modal / carousel page in the library | UNVERIFIED, not relied on |

Chosen practice: WCAG 2.2 SC 1.4.10 Reflow plus the WAI-ARIA modal-dialog pattern, as in Revisions 1-2. TailAdmin shows the
carousel shape that R19(a) exempts, and shows that a partly visible slide stays a visible slide (not exempt). The
references say nothing on gate retries or owner tables (tooling subjects). Absent or unverified: Kamr live
re-operation, Omah. No reference contradicts R19-R21.

## Requirement -> planned evidence

| ID | Change | Where | Evidence |
|---|---|---|---|
| R19 | positioned / transformed `component-overflow`: exempt only (a) a clipped-away slide (bound clips; wholly outside on the overflowing axis; a transformed element between it and the bound, itself included; no text; no control) or (b) a media crop (`img`/`video`/`picture`/`canvas`, no text, box covers the bound's padding box on both axes within 0.5px; bound clips). Everything else fails as in R15 | `in-page.mjs` `measure` | fixtures `positioned-slide-away` PASS, `positioned-slide-away-control` FAIL, `media-cover-zoom` PASS, `media-shifted-past-frame` FAIL, `text-scaled-past-frame` FAIL; mutation proof 13 of 13 (the 9 earlier + 4 new) |
| R20 | `transientReason` also names a render timeout (`render did not reach finished/errored within <n>s`); an errored render / error display is never retried | `runner.mjs` | unit tests (i) timeout then green -> green with `retry`; (ii) `render errored, sb-show-errordisplay=true` -> run once, no `retry`; (iii) timeout twice -> `error-screen` fails |
| R21 | owner table lists the Leaflet popup (`listingdetailview`) and the dashboard chart (`admindashboardview`, `dashboardsemidonut`) as their own rows under "new - Opus to file"; `component-overflow` change against Revision 2 per component | `r4-60-owner-table.mjs` | owner table + session log |

## Preserved / required behaviour

Preserved: every rule key, the 38 self-test cases as stated, the 9 mutation proofs, the evidence row shape, the registry,
the in-flow `clippedAway` path (R11), the R15 bound (`positionedBound`), the R16 retry design. Required: kickoff section 12.

## Task-owned write scope (sections 4, 10, 11, 12)

`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json` (none
expected); `scripts/__fixtures__/rendered-state-census/*.html`; `scripts/__tests__/rendered-state-census.test.ts`;
`package.json` (none expected); `docs/sessions/evidence/task923/r4-*`; the session log
`docs/sessions/2026-10-10-task923-rendered-state-census.md` (`# Revision 3` section); the 923 backlog cell.

Non-visible task (`Scope: none`): no mobile / UI / Storybook-proof receipt applies; no write-set path is a UI path.

## Requirement / AC ledger

R19 -> AC16, AC18 | R20 -> AC17, AC18 | R21 -> AC18.
AC16 verify: 38 earlier cases + 5 new, mutation proof 13 of 13. AC17: three new unit tests, new file twice. AC18: repeated full
run on the final build; every row has 20 rule keys and `notApplicable`; AC4 holds; every `open-failed` / `portal-count` /
`widths-mismatch` cell is a 924 cell at 640, every `error-screen` is `custom-range-too-long`; `r4-` copy of
`rv3-d16-classes.mjs` (only its input path changed) prints 0 `gallery-track` and 0 `image-layer`, and its `leaflet` / `chart`
lines equal `rv3-d16-classes.txt` lines 2-3 and 6-8 or each difference is explained row by row; the summary lists every
retried job. AC19: vitest twice (new file and whole suite), typecheck, lint, build, build-storybook, check:file-integrity,
check:mojibake, `git status --porcelain` before / after.

GR-7 RESEARCH (execution) COMPLETE - references: Lahomes, TailAdmin live at 390; Kamr and Omah not relied on; no conflict with section 12.
