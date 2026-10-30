# Task 923 R55 / AC58 - owner table of the final rows (2026-10-19)

Rows: `r12-full/rows.jsonl` = the repeated full run after R53 and R54 (`r12-82-full-run.txt`: 34 417 rows, 19 225 app + 15 192 portal, 15 192 state jobs + 3 572 out-of-range widths jobs + 461 closed jobs,
runtime 11 104 s, 10 workers, 3 retried jobs, all three recovered, exit 1). **181 failing rows** (`r12-110-owner-table-source.txt`, one line per Story x rule); 34 236 of 34 417 rows pass.
Gate-level cells (`r12-84-ac32-checks.txt`): only the 925 cell below; 0 owned by neither 924 nor 925; 0 `image-layer` details; 0 rows with a rule both not applicable and violated (`r12-10-na-vs-violation.txt`).

| # | Story x rule | Rows | Where | Owner / outcome |
|---|---|---:|---|---|
| 1 | `dashboardperiodcontrol--custom-range-too-long` x `error-screen` (closed, app root) | 1 | 390 | **925** (the Story's play function throws; C53, C54) |
| 2 | `listingdetailpattern--default` x `component-overflow`: `p "Bathrooms" x 156.5..218.7 past div 138.5..216.5` (2px past its box) | 4 | states `add-to-favorites`, `modern-apartment-in-tirana`, `save-to-collection`, `share-listing`; 768, en | **new - Opus to file** (unchanged from `r10-110`; width 768 is measured since the D36 matrix) |
| 3a | `listingdetailview--{public-listing, public-listing-converted, public-listing-not-reduced, staff-preview-published, staff-preview-unpublished, archived-listing}` x `text-overlap`: `div.leaflet-popup-content "Shitet apartament 2+1 në" overlaps span "×" by 2.2x15px` (the popup's title reaches under its own close glyph) | 76 (16 + 16 + 16 + 12 + 12 + 4) | the map popup states (`call`, `send-message`, `share-listing`, `write-on-whatsapp`; `call`, `share-listing`, `write-on-whatsapp` for the staff previews; `share-listing` for `archived-listing`), 639, four locales | **(iv) stable product finding** - unchanged from `r10-110` row 3 |
| 3b | the same six Stories x `text-overlap`: `div.leaflet-popup-content "Shitet apartament 2+1 në" overlaps span "−" by 13.7x15px` (the popup's title lies under the map's zoom-out control) | 100 (24 + 24 + 24 + 10 + 10 + 8) | the same states, 320 and 390 (the staff previews: 6 at 320 and 4 at 390 per Story), four locales | **(iv) stable product finding** - reported since R54 (the cover exemption no longer hides a popup under a control of its own layer) |

Rows 3a + 3b = 176 (12 + 40 + 40 + 40 + 22 + 22), per width and Story in `r12-113-r54-rows.txt`.

## Outcome (iv) for rows 3a and 3b (R55)

1. **Same verdict in the full run and in three isolated runs** (`r12-112-iv-isolation.txt`): for each of the six Stories, every row (185 / 377 / 313 rows) equals its row in `r12-full` in the runs `a`, `b` (`r12-story/<id>-a` / `-b`) and `c` (`r12-story/<id>-c`): **0 rows differ**. The `public-listing` run of AC57 (`r12-20-ac57-listing.txt`, 320 / 390 / 639) names the same findings.
2. **A probe with the gate unchanged places the cause in a product file** (`r12-111-popup-geometry-probe.txt`, no census code; `public-listing`, en, boxes of the built Story):
   - 320: popup content `x 78..237` (width 159 px) against the zoom-out button `x 93..137` (44 x 44 px): 44.0 x 28.7 px of the content box under it; zoom-in `x 49..93`: 15.0 x 29.2 px; the close button `x 218..262` lies over the content's right 19.0 x 30.0 px.
   - 390: content `x 78..307` against zoom-out `x 93..137`: 44.0 x 28.8 px; against the close button `x 288..332`: 19.0 x 30.0 px.
   - 639: content `x 193..441` against the close button `x 422..466`: 19.0 x 16.9 px; no overlap with a zoom control.
   - 768: the controls are Leaflet's own 30 px / 24 px and the popup is clear of both: no overlap.
   FACT, source: `src/components/shared/Map.tsx` line 29 (`zoomControl: true`, Leaflet's default top-left position), lines 46-47 (the popup's `maxWidth` = `min(300, max(120, containerWidth - 88))`, bound to the marker; no option keeps the popup clear of the controls) and `src/components/shared/Map.module.css` lines 14-22 and 28-34 (the zoom and close controls take the 44 px touch floor below 640 px and Leaflet's own size from 640 px up). INFERENCE: these two files decide the geometry above (the 44 px controls below 640 px against a popup 159-229 px wide, bound to the marker and not to the controls). Both are product files; neither is changed here (§17.5 (3); the working-tree `Map.tsx` already carries the unrequested D17 change of C434).
3. **Neither a gate defect nor a race**: the cover exemption was narrowed by R54 on purpose (an opaque control of the popup's own layer is no cover); the same pair inside the viewport and below the fold gives the same verdict (`html-text-under-control`, `html-text-under-control-below-fold`); the verdict is the same in four runs (item 1); the popup is not an `inert` layer (R53 changes no row, see below).

No row is (iii). Opus files rows 2, 3a and 3b with the D17 decision at closure (§9).

## Comparison with `r10-108-full-merged` (`r12-61-full-vs-r10-108.txt`, comparator `r12-61-compare-full.mjs`, a copy of `r10-61-compare-full.mjs`)

Rows in both runs 34 417; **100 differ; each of the 100 is a `text-overlap` finding that R54 now reports** (`r12-113-r54-rows.txt`: the base row has no `text-overlap` finding, every other rule of the row is equal; 0 rows with any other change) - they are rows 3b, 320 and 390, handled as (iv) on their Stories. The 76 rows at 639 (3a) and the 5 rows 1-2 are unchanged from the base. **R53 changes no row** of the full run (no differing row is explained by it; its effect is on the planted fixtures of AC56).
The comparator's own line "NOT ALLOWED: 100" counts these 100 as differences without an allowed class (classes 1-3; class 4 unused); each has its handling here, as R55 prescribes.
