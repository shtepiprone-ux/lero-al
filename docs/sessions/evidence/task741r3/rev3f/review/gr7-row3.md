# GR-7 — task creation (Opus), 2026-10-04: Task 741 O46-2 row 3 (`ListingsShellView`): "show more", pagination, states

Subject: the end-of-list "show more" control and paginator, and which listing states a catalogue page shows.

## Library (`docs/research/references/2026-10-04/`)

| Reference | Enumerated / inspected / blocked | Rows read |
|---|---|---|
| Lahomes | 106 / 106 / 0 | 008 `/property-grid.html`, 060 `/ui-pagination.html` |
| Kamr | 62 / 62 / 0 | 013 `/ecom-product-grid`, 038 `/ui-pagination` |
| Omah | 339 / 339 / 0 | 013 `/property-list.html` |
| TailAdmin | 88 / 88 / 0 | 016 `/products-list`; `/buttons` (button sizes); library has "View More" buttons that are dropdown triggers, not list loaders |
| Rozetka (owner, D89-3) | not in the library | catalogue `/ua/notebooks/c80004/` |

## Live, this session

Scripts and data: `gr7-loadmore.mjs` → `gr7-loadmore/gr7-loadmore.json`; `gr7-rozetka-more.mjs` → `gr7-loadmore/gr7-rozetka-more.json`. Screenshots are in `gr7-loadmore/*.png`. Everything ran in headed Chrome, because Rozetka blocks headless, at 1440 and 390. Kamr was signed in.

| Page | End-of-list control | Measured | vs library |
|---|---|---|---|
| Rozetka catalogue | **"Показати ще"** button centred above the paginator | `button button_size_medium button_color_green`: the site's standard primary button, filled brand green `rgb(0,160,70)`, white 16px/500, radius 8px, 130×40, padding 1px 16px; the same at 390. The paginator is 42×42 bordered squares, radius 8px, with arrows | n/a (owner link) |
| Lahomes `/property-grid.html` | paginator only | Previous · 1 · 2 · 3 · Next; 14px, 35px high, the active page filled primary `rgb(96,74,227)` | unchanged |
| Lahomes `/ui-pagination.html` | paginator variants | the same, plus a «/» variant | unchanged |
| Kamr `/ui-pagination` | paginator variants | 38px squares; the current page filled coral `rgb(248,133,125)` | unchanged; live login works |
| Kamr `/ecom-product-grid` | none on the page | — | unchanged |
| Omah `/property-list.html` | none | — | unchanged |
| TailAdmin `/products-list`, `/buttons` | none for list loading; buttons in sm/md sizes | — | unchanged |

No page overflowed at 390.

## Options and choice

| Choice | Options ← pages | Chosen (owner) |
|---|---|---|
| "Show more" style | the site's primary button ← Rozetka; no load-more, pagination only ← Lahomes, Kamr | **D46-7:** the canonical theme `Button`, `variant="filled" color="brand"`, theme default size, `loading` prop, centred above the paginator, full width below 640 |
| States shown by the page Story | as production (tabs: active · sold/rented) ← Rozetka's catalogue shows only what is on sale, and the closed tab is lero.al's own; every card state ← the card Stories | **D46-6:** the page Story shows exactly what `/listings` can render |

## lero.al data map

- `/[locale]/listings/page.tsx:46-49`: the `closed` tab → `status in (sold, rented)`. The active tab → `applyPublicVisibility` (public statuses, unexpired).
- `ListingsShell.tsx:167`: `showLoadMore = allListings.length < total`.
- `ListingsPagination.tsx:21`: hidden when `totalPages <= 1`.
- `ActiveFilterChips`: reads the URL (`type`, `rooms`, `price_min`, …).
- `ListingsStatusTabs`: reads `tab` from the URL.

## Receipt

`GR-7 REFERENCE RESEARCH — moment: task creation (741 §18.15, O46-2 row 3 return); role: Opus; task: 741; subject: end-of-list "show more" and paginator, page states; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Rozetka catalogue → primary "Показати ще" + paginator; Lahomes /property-grid, /ui-pagination → unchanged; Kamr /ui-pagination, /ecom-product-grid → unchanged (live login works); Omah /property-list → unchanged; TailAdmin /products-list, /buttons → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0, Rozetka 1/1/0; inspected in depth: the 8 pages at 1440 and 390 (rows above); workflow states operated: Kamr sign-in, scroll to list end; options across references: primary load-more ← Rozetka; pagination only ← Lahomes, Kamr; chosen 2026 best practice: canonical primary Button with loading state above the paginator (D46-7), Story states equal to production (D46-6); absent or unverified: none; lero.al data map: page.tsx:46-49, ListingsShell.tsx:167, ListingsPagination.tsx:21, ActiveFilterChips/ListingsStatusTabs URL params; owner decisions: D46-6, D46-7; evidence: docs/sessions/evidence/task741r3/rev3f/review/.`
