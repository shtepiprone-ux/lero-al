# Task 923 R52 / AC36 - owner table of the final rows (2026-10-19)

Rows: `r10-108-full-merged/rows.jsonl` = the final full run `r8-full` (34 369 rows, 19 201 jobs, runtime 11 258 s, 10 workers) with the rows of the nine Stories of R33 handling replaced by
their run `a` of `r10-107` (the registry fix and the three gate fixes of R52 applied): 34 417 rows, **81 failing rows** (`r10-110-owner-table-source.txt`, one line per Story x rule).
Everything else of `r8-full` is green: 34 336 of 34 417 rows pass.

| # | Story x rule | Rows | Where | Owner |
|---|---|---:|---|---|
| 1 | `dashboardperiodcontrol--custom-range-too-long` x `error-screen` (closed, app root) | 1 | 390 | **925** (the Story's play function throws; C53, C54) |
| 2 | `listingdetailpattern--default` x `component-overflow`: `p "Bathrooms" x 156.5..218.7 past div 138.5..216.5` (2px past its box) | 4 | states `add-to-favorites`, `modern-apartment-in-tirana`, `save-to-collection`, `share-listing`; 768, en | **new - Opus to file** (width 768 is measured since the D36 matrix; `r7-full-b` has no 768 row) |
| 3 | `listingdetailview--{public-listing, public-listing-converted, public-listing-not-reduced, staff-preview-published, staff-preview-unpublished, archived-listing}` x `text-overlap`: `div.leaflet-popup-content "Shitet apartament 2+1 në" overlaps span "×" by 2.2x15px` (the popup's title reaches under its own close glyph) | 76 (16 + 16 + 16 + 12 + 12 + 4) | the map popup states (`call`, `send-message`, `share-listing`, `write-on-whatsapp`), 639, four locales | **new - Opus to file** (`src/components/shared/Map.tsx`, the popup width: D17 / R38 (3) / the Leaflet popup race of Revision 7; stable in 5 isolated runs, so it is not a race) |

`r8-full` itself has 471 failing rows. Gate findings of the same run, resolved (not owner rows): `admincurrencytabs--default` (60 rows: `widths-mismatch` 48, `open-failed` 12, `portal-count` 12;
the registry `widths` were still at the pre-D36 640 / 639, changed with the owner's answer of 2026-10-19, now 0 rows); the six `listingdetailview` Stories (342 failing rows: 340 `text-overlap` and
2 `dismiss-escape`; 264 of the `text-overlap` rows were text below the fold covered by the map's zoom control, a gate defect, fixed; the other 76 are row 3, a real overlap) and the two
`delete-confirm` Stories (64 rows of `text-overlap` for text of an inert dialog under the confirm dialog: a gate defect, fixed, now 0 rows). 471 - 342 - 64 - 60 = 5 rows are rows 1 and 2.
See the iteration table of the session log.

Revision 6 / 7 rows that still stand: the share tooltip that reappears after Escape (`ListingShareButton`; class 3 of the comparator): `r8-full` has it in two cells (the `~share-listing` portal root
of `public-listing` and of `public-listing-converted`, one `dismiss-escape` cell each); isolated run 1 of `public-listing` (`r8-story/full-02-listingdetailview--public-listing-1`, summary `r10-100`) had it in another cell (it, 320) together with a
render timeout on the reopen (the third gate fix); the final rows hold none of those cells because they come from run `a`. The AdminShell drawer's initial-focus race (C118) did not occur:
`adminshell--drawer-open` is green in `r8-full`.
