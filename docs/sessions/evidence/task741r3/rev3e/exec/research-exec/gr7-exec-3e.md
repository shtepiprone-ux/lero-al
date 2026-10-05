# GR-7 — task execution (Sonnet), 2026-10-04: Task 741 Revision 3e (`ListingsShellView` "Show more", empty state, sort-bar line, Story states)

Scripts: `gr7-exec-3e.mjs` → `gr7-exec-3e.json` + `exec-NN-*.png` (full page, 1440 and 390); `gr7-rozetka-3e.mjs` (headed Chrome) → `gr7-rozetka-more.json` + `rozetka-paginator-{1440,390}.png`. Kamr signed in with `demo@example.com`.

| Page | Library row | Live at 1440 / 390 | Result |
|---|---|---|---|
| Lahomes `/property-grid.html` | 008 | paginator only (12 items), no load-more; no overflow at 390 | unchanged |
| Lahomes `/ui-pagination.html` | 060 | paginator variants; no overflow at 390 | unchanged |
| Kamr `/ui-pagination` | 038 | paginator variants; no overflow at 390 | unchanged |
| Kamr `/ecom-product-grid` | 013 | no list-end control | unchanged |
| Omah `/property-list.html` | 013 | no list-end control | unchanged |
| TailAdmin `/products-list` | 016 | no list-end control | unchanged |
| TailAdmin `/buttons` | 066 | button variants/sizes only | unchanged |
| Rozetka catalogue `/ua/notebooks/c80004/` (owner link) | not in library | "Показати ще": `button button_size_medium button_color_green`, filled `rgb(0,160,70)`, white 16px/500, radius 8px, 130x40, padding 1px 16px, centred above the paginator (42x42 bordered squares, radius 8px); at 390 the same button stays 130x40 (not full width) | matches the kickoff's choice |

Difference from the kickoff: none that changes the pattern. One detail: Rozetka's button keeps its natural width at 390,
while D46-7 (owner decision) sets full width below 640. D46-7 is an owner decision and is executed as written.

## Options and choice

| Choice | Options <- pages | Chosen |
|---|---|---|
| "Show more" style | site primary button <- Rozetka; no load-more, pagination only <- Lahomes 008/060, Kamr 038 | canonical theme `Button` filled brand, `loading`, centred above paginator (D46-7) |
| Page Story states | production states <- the kickoff's data map | as production (D46-6) |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: execution (741 Revision 3e); role: Sonnet; task: 741; subject: end-of-list "show more", paginator, page states; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid, /ui-pagination → unchanged; Kamr /ui-pagination, /ecom-product-grid → unchanged (live login works); Omah /property-list → unchanged; TailAdmin /products-list, /buttons → unchanged; Rozetka catalogue → primary "Показати ще" 16/500 r8 40px high above paginator; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 1/1/0; inspected in depth: the 8 pages at 1440 and 390 (full-page screenshots, computed styles); workflow states operated: Kamr sign-in, Rozetka scroll to list end; options across references: primary load-more <- Rozetka; pagination only <- Lahomes, Kamr; chosen 2026 best practice: canonical primary Button with loading state above the paginator; Story states equal to production; absent or unverified: none; lero.al data map: page.tsx:46-49, ListingsShell.tsx:167, ListingsPagination.tsx:21, URL-driven chips and tabs; owner decisions: D46-6, D46-7; evidence: docs/sessions/evidence/task741r3/rev3e/exec/research-exec/.`
