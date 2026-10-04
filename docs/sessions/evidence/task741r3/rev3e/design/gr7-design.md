# GR-7 reference research — task creation (Opus), 2026-10-04: one listing card for grid and list

Trigger: the owner returned O46-2 rows 1–2 (Task 741). Decision **D46-5 / D89-10**: the fix moves into Task 918 with harder rules.
Subject: does a reference keep the same part styles when one entity is shown as a grid card and as a list item?

## Library (`docs/research/references/2026-10-04/`)

| Reference | Enumerated / inspected / blocked | Grid/list pages found in the library |
|---|---|---|
| Lahomes | 106 / 106 / 0 | 008 `/property-grid.html` · 009 `/property-list.html`; 013 `/agents-grid.html` · 012 `/agents-list.html`; 017 `/customers-grid.html` · 016 `/customers-list.html`; 052 `/ui-card.html` |
| Kamr | 62 / 62 / 0 (library crawl: login failed) | 005 `/room`; 013 `/ecom-product-grid` · 014 `/ecom-product-list`; 031 `/ui-card` |
| Omah | 339 / 339 / 0 | 013 `/property-list.html` (grid/list toggle); 019 `/ecom-product-grid.html` · 020 `/ecom-product-list.html` |
| TailAdmin | 88 / 88 / 0 | 016 `/products-list` (table); 026 `/task-list`; 073 `/list`; 068 `/cards` — no grid/list pair for one entity |
| Owner link: Rozetka (D89-3) | 2 pages live (home, notebooks catalogue) | not in the library |

## Live, this session (`gr7-pairs/pairs.mjs` → `gr7-pairs/pairs.json`, screenshots `gr7-pairs/*-1440.png`, `*-390.png`)

Each page opened at 1440 (full page) and 390. Leaf-text `getComputedStyle` (font size / weight / colour) collected per page. Kamr signed in with `demo@example.com` / `123456`. Omah's list mode was operated by clicking its list toggle (`omah-list-1440.png`, `gr7-omah-toggle.json`). No page overflowed at 390.

| Reference | Grid page | List page | Shared parts, grid → list | Verdict |
|---|---|---|---|---|
| Omah | `/property-list.html` (grid) | same page, list toggle | price 21/600 black → same; "For Rent" badge 11/400 white on blue → same; agent 13.1/600 → same; description 12.25 grey → same; photo moves left, nothing else changes | **same card** |
| Kamr | `/ecom-product-grid` | `/ecom-product-list` | title 14/600 black → same; price 21/600 coral → same; the list only adds reviews and a code line | **same card** |
| Omah | `/ecom-product-grid.html` | `/ecom-product-list.html` | title 14/500 → same; price 14/600 blue (+ old 12.25 coral) → 21/600 blue | differs (price size jumps) |
| Lahomes | `/property-grid.html`, `/agents-grid.html`, `/customers-grid.html` | `/property-list.html`, `/agents-list.html`, `/customers-list.html` | the list is an admin data table: title 16/500 → 15/500; status badge filled white-on-colour → tinted coloured text | different pattern (table) |
| TailAdmin | `/cards` | — | no grid/list pair for one entity | nothing shown |
| Kamr | `/room` | — | room cards only | nothing shown |
| Rozetka (owner, D89-3) | `https://rozetka.com.ua/` + catalogue `/ua/notebooks/c80004/` (headed Chrome; headless got HTTP 403) | toggle "Мала плитка" → "Крупна плитка" operated | title 14/400, struck old price 14/400 grey **above** the current 20/700 (red when reduced, dark when not): identical in both views; home tiles the same (`gr7-rozetka-catalog.json`, `rozetka-*.png`) | **same card** |

## Options and the 2026 best practice

- **One card, the same parts in the same tokens, only the photo position changes**. Seen in Omah `/property-list.html`, Kamr `/ecom-product-grid` + `/ecom-product-list` and Rozetka's catalogue (both tile views).
- **The list as a different pattern (a table)**. Seen in Lahomes. It is an admin data view, and it changes the badge style.
- **The same card, but a part restyled per layout**. Seen in Omah ecom (the price jumps from 14 to 21px).

Chosen: the first option. Two references show it on public-style catalogues, and it is the owner's rule (O46-2 return, D89-2, D89-10). One source per part also stops the two layouts drifting apart. That is design-system consistency (a responsive variant of one component), and it is what lets a parity test exist. The other two options produce the exact defect the owner returned.

## lero.al data map

- `ListingCard` (`/listings` grid and list; `/favorites` and the home rails use grid only): the same `CardListingData` feeds both `variant`s.
- `MantineListingCardPattern` renders `layout="grid"` and `layout="list"` today as two separate markups with separate CSS classes. Measured differences (`variant-diff.json`, 1440, the same listing):
  - type label and location colour: `rgb(71,84,103)` vs `oklch(0.556 0 0)`;
  - location line height: 18px vs 16px;
  - per-m²: 10px/12px line at 70% vs 12px/18px;
  - block order differs;
  - favourite: on the photo vs inline;
  - photo count: bottom-right vs bottom-left;
  - badges: a row vs a column;
  - overlay: grid only.

## Receipt

`GR-7 REFERENCE RESEARCH — moment: task creation (Task 918 amendment D89-10; Task 741 §18.13); role: Opus; task: 918, 741; subject: one listing card for grid and list, identical part styles; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner, D89-3); library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid, /property-list, /agents-grid, /agents-list, /customers-grid, /customers-list → unchanged; Kamr /room, /ecom-product-grid, /ecom-product-list → unchanged except the live login works; Omah /property-list (grid + list toggle), /ecom-product-grid, /ecom-product-list → unchanged; TailAdmin /products-list, /task-list, /list, /cards → unchanged; Rozetka home + /ua/notebooks/c80004/ (both views) → live in headed Chrome (headless 403); route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0, Rozetka 2/2/0; inspected in depth: 17 live pages at 1440 and 390 (rows above); workflow states operated: Kamr sign-in, Omah grid→list toggle, 1440→390; options across references: same card ← Omah /property-list, Kamr ecom, Rozetka catalogue; table ← Lahomes lists; per-layout restyle ← Omah ecom; chosen 2026 best practice: one card, one source per part, only the photo position changes; absent or unverified: none; lero.al data map: ListingCard/MantineListingCardPattern × grid/list (variant-diff.json); owner decisions: D46-5 = D89-10 (2026-10-04), D89-2; evidence: docs/sessions/evidence/task741r3/rev3e/design/.`
