# GR-7 — task execution (Sonnet), 2026-10-04: Task 741 Revision 3h (one canonical card for grid and list; round paginator corners)

Scripts and data in this folder: `gr7-omah-toggle-{1440,390}.mjs/.json/.txt` (Omah grid → list toggle operated), `gr7-rozetka-catalog-{1440,390}.mjs/.json/.txt` (headed Chrome, both tile views), `tailadmin-corner-probe.mjs/.json` (DPR 1 and 1.25), screenshots `omah-*.png`, `rozetka-catalog-*.png`, crops in `crops/`.

| Page | Library row | Viewport | Observed | Result |
|---|---|---|---|---|
| Omah `/xhtml/property-list.html`, list toggle clicked | 013 | 1440 | price `$…` 21px/600 `rgb(0,0,0)`, description 12.25px/400 `rgb(136,136,136)`, agent 13.132px/600 `rgb(34,43,64)`: the same three values in the grid and in the list view; only the photo and card width move (382x254 → 343x254) | unchanged: same card |
| same | 013 | 390 | the same three values; grid and list render the same single column at this width | unchanged |
| Rozetka catalogue `/ua/notebooks/c80004/`, "Мала плитка" → "Крупна плитка" (owner link) | not in library | 1440 | title 14px/400 `rgb(34,31,31)`; struck old price 14px/400 `rgb(121,120,120)`; current price 20px/700 `rgb(248,65,71)`; identical in both tile views (tile 205px → 261px wide) | same card in both views |
| same | not in library | 390 | the same values; both views are one 171px tile | same |
| TailAdmin `/pagination` | 076 | 1440, DPR 1 and 1.25 | "Previous": radius 8px, `1px solid rgb(208,213,221)` on white, `box-shadow … rgba(16,24,40,0.05) 0 1px 2px`, not faded; active "1": radius 8px, fill `rgb(70,95,255)`, `0px` border | unchanged |

Difference from the kickoff: none. The kickoff's §18.19.4 values hold.

## Options across references and choice

| Choice | Options <- pages | Chosen |
|---|---|---|
| Grid vs list card | the same card with only the photo position changing <- Omah property-list, Kamr ecom, Rozetka both tile views; a per-layout restyle <- Omah ecom; a table <- Lahomes | one card, one source per part (D46-9) |
| Page control corners | filled control without a border; bordered edge control with a light shadow, not faded <- TailAdmin | the same: transparent border on the active control, `shadow-xs` on edge controls, no opacity fade |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: execution (741 Revision 3h); role: Sonnet; task: 741; subject: one listing card for grid and list; paginator control corners; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Omah /property-list (013, list toggle operated) → unchanged; Rozetka catalogue (both tile views) → unchanged; TailAdmin /pagination (076, DPR 1 and 1.25) → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 2/2/0; inspected in depth: the pages above at 1440 and 390 (computed text styles, toggle operated, corner crops at two DPR); workflow states operated: Omah grid→list toggle, Rozetka tile toggle; options across references: one card ← Omah /property-list, Kamr ecom, Rozetka; per-layout restyle ← Omah ecom; table ← Lahomes; corner: fill without border ← TailAdmin active; bordered edge with shadow-xs, not faded ← TailAdmin Previous; chosen 2026 best practice: one card with one source per part (D46-9) and TailAdmin's control painting; absent or unverified: Kamr and Lahomes card pairs not re-opened (918 §16.2's 17-page record stands; the library rows are unchanged); lero.al data map: ListingCard → MantineListingCardPattern (grid on /listings, /favorites and the home rails; list on /listings from 640), MantinePagination consumers; owner decisions: D46-5, D46-9, D89-10, D90-1; evidence: docs/sessions/evidence/task741r3/rev3h/exec/research-exec/.`
