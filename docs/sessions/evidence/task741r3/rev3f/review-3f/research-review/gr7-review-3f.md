# GR-7 — review (Opus), 2026-10-04: Task 741 Revision 3f (canonical paginator width budget)

Scripts: `gr7-review-3f.mjs` → `gr7-review-3f.json`, `.txt`, `rv-NN-*.png`; `gr7-review-3f-tailadmin.mjs` →
`gr7-review-3f-tailadmin.json`, `.txt`, `rv-tailadmin-*.png`. `win32`, Node v22.22.3, Playwright Chromium (Rozetka:
headed Chrome, as in the 3e/3f precedent). Library: `docs/research/references/2026-10-04/`. Kamr signed in with
`demo@example.com`.

## Live-checked pages (1440 and 390)

| Ref | Page | Library row | Paginator observed | Keyboard focus on a page control | Result vs library |
|---|---|---|---|---|---|
| TailAdmin | `/pagination` | 076 | 1440: "Previous 1 2 3 … 8 9 10 Next", 40×40, radius 8. 390: "← Page 1 of 10 →" | browser `auto` outline; nearest clipping ancestor is the page scroller, 260px room: not cut | unchanged |
| TailAdmin | `/products-list` | 016 | 1440: "‹ 1 2 3 ›" 40×40; 390: no numbered paginator detected by the probe (screenshot `rv-tailadmin-products-list-390-pager.png`) | — | unchanged |
| Lahomes | `/ui-pagination.html` | 060 | "Previous 1 2 3 Next", "« 1 2 3 »", 35px high, same at 390 | outline `none` (no visible ring) | unchanged |
| Lahomes | `/property-grid.html` | 008 | "Previous 1 2 3 Next", same at 390 | outline `none` | unchanged |
| Kamr | `/ui-pagination` | 038 | "‹ 1 2 3 4 ›" in three sizes (37×39, 26×26, 22×22), same at 390 | 3px ring; its `overflow: hidden` ancestor leaves room: cut 0px on all sides | unchanged |
| Omah | `/property-list.html` | 013 | no paginator | — | unchanged |
| Omah | `/order-list.html` | 006 | "‹ 1 2 ›" 30×30, radius 8 | 3px ring, inside a `table-responsive` scroller: cut 0px | unchanged |
| Rozetka (owner) | `/ua/notebooks/c80004/` | not in library | "Показати ще" above "‹ 1 2 3 4 … 100 ›", at 1440 and 390 | 2px `box-shadow` ring, no clipping ancestor | consistent with 3e/3f records |

## Options and choice

| Question | Options ← pages | 2026 best practice chosen |
|---|---|---|
| Page numbers on a phone | neighbouring numbers that fit ← Rozetka 390, Kamr 390, Lahomes 390; "Page X of Y" ← TailAdmin 390; current + boundaries only ← none | **fill to the width** (owner **D46-8**, 2026-10-04): show as many neighbours of the current page as fit, keep 44px targets |
| Focus ring | a full ring, never cut ← Kamr, Omah, Rozetka, TailAdmin; no ring ← Lahomes (fails WCAG 2.4.7) | a complete, uncut ring on every control (WCAG 2.2 2.4.7; GR-3g "a clip never cuts it") |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3f); role: Opus; task: 741; subject: paginator page numbers per width, keyboard focus ring; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: TailAdmin /pagination (076), /products-list (016); Lahomes /ui-pagination (060), /property-grid (008); Kamr /ui-pagination (038); Omah /property-list (013), /order-list (006); Rozetka catalogue → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 1/1/0; inspected in depth: the 8 pages above at 1440 and 390 with paginator items, control size and a keyboard-focused page control; workflow states operated: Kamr sign-in, Rozetka scroll to list end, Tab focus on a page control on every paginator; options across references: neighbours that fit ← Rozetka, Kamr, Lahomes; Page X of Y ← TailAdmin 390; uncut focus ring ← Kamr, Omah, Rozetka, TailAdmin; chosen 2026 best practice: fill-to-width ladder (D46-8) and an uncut focus ring; absent or unverified: none; lero.al data map: MantinePagination consumers ListingsPagination (/listings, /favorites), AdminListingsView (/admin/listings), AgentStatisticsView (cabinet statistics), MantineAdminSurfacePattern (Story only); owner decisions: D46-6, D46-7, D46-8; evidence: docs/sessions/evidence/task741r3/rev3f/review-3f/research-review/.`
