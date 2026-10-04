# Task 741 Revision 3c — GR-7 reference research, moment: review (Opus), 2026-10-04

Subject: listing-card status badges (every `ListingStatus`), the sold/rented overlay label, and the grid/list view
toggle below 640px (owner D46-3). Revision 3c itself changes three Story badge-label keys and one unit test.

## Library read (`docs/research/references/2026-10-04/`)

| Reference | Enumerated | Inspected | Blocked | Library note | Rows read for the subject |
|---|---|---|---|---|---|
| Lahomes | 106 | 106 | 0 | — | 008 `/property-grid.html`, 009 `/property-list.html`, 049 `/ui-badge.html`, 052 `/ui-card.html` |
| Kamr | 62 | 62 | 0 | library crawl: "login failed with both credential sets" | 005 `/room`, 026 `/ui-badge`, 031 `/ui-card` |
| Omah | 339 | 339 | 0 | — | 013 `/property-list.html`, 019 `/ecom-product-grid.html` |
| TailAdmin | 88 | 88 | 0 | — | 064 `/badge`, 068 `/cards` |

## Live check, this session (`../review/gr7-live-check.mjs` → `../review/gr7-live-check.json`, `../review/live-*.png`)

Each page opened at 1440 and 390 (`deviceScaleFactor` 1), full-page screenshot, badge `getComputedStyle`
(font size/weight, radius, background), view-toggle controls listed, document overflow measured. Kamr signed in
live with `demo@example.com` / `123456` (difference from the library, which recorded a failed login).

| Page | Shots | Observed for the subject | vs library |
|---|---|---|---|
| Lahomes `/property-grid.html` | live-00, live-01 | filled status pill at the photo's top-right (*For Rent* green, *Sold* red, *For Sale* orange), 13px/600, radius 4px; sold card strikes the price, no overlay; grid/list are separate pages (sidebar *Property Grid* / *Property List*) | unchanged |
| Lahomes `/property-list.html` | live-02, live-03 | list rows carry a tinted *Rent*/*Sale* pill, 13px/600, radius 4px | unchanged |
| Omah `/property-list.html` | live-04, live-05 | filled *For Rent* pill (11px/400, radius 4px, `rgb(59,76,184)`) at the photo's top-right; location pill top-left; grid/list icon toggle beside *Sort by*, grid filled | unchanged |
| Kamr `/room` | live-06, live-07 | *AVAILABLE* / *SOLDOUT* tinted pills, 10.5px, radius 7px | difference: reachable after live login (library crawl failed to log in); no other change |
| TailAdmin `/cards` | live-08, live-09 | *NEW* pill 12px/500, full radius, tinted green | unchanged |
| TailAdmin `/badge` | live-10, live-11 | solid and light pill variants per colour, 12px/500, full radius | unchanged |

No page overflowed at 390.

## Options and the 2026 best practice

| Choice | Options seen | Pages | lero.al (shipped) | Verdict |
|---|---|---|---|---|
| status badge position | on the photo, top corner | Lahomes 008, Omah 013 | on the photo (`MantineListingCardPattern` `badges`) | matches |
| status badge style | filled (Lahomes, Omah) vs tinted light (Kamr, TailAdmin) | as above | filled, `LISTING_STATUS_COLOR` per status | matches the two real-estate references; one colour per status, so the label (not colour alone) carries the state (WCAG 1.4.1) |
| closed listing | strike-through price only (Lahomes) | Lahomes 008 | overlay label + badge (owner-accepted O83-1, 2026-09-30; D46-2) | owner decision, not re-opened |
| grid/list on a phone | separate routes (Lahomes); icon toggle beside sort (Omah) | Lahomes 008/009, Omah 013 | icon toggle beside sort, hidden below 640, list→grid reset (D46-3) | owner decision; matches Omah's toggle placement |
| badge label text | — | — | Story labels now come from production keys (R42) | a Story must show production's label; no visual value chosen |

Absent or unverified: no reference shows inactive/pending ("under review") listing badges on a card; D46-4 (owner)
decides them. No reference demonstrates a portrait/landscape list→grid reset; D46-3 (owner) decides it.

## lero.al data map

| Surface | Entity / fields | Actions / guards | Routes | UI |
|---|---|---|---|---|
| `ListingCard` (`/listings`, `/favorites`, owner listings) | `listings.status` ∈ active, inactive, sold, rented, archived, pending, expired; `created_at`, `price`, `price_old`, `is_premium`, `images` | favourites exclude only `archived` (`favoritesQueries.ts`) | `/[locale]/listings`, `/[locale]/favorites` | `getBadges` → `MantineListingCardPattern` badges + overlay |
| `ListingsShellView` | `view: 'grid' \| 'list'` (client state, `ListingsShell.tsx`) | none | `/[locale]/listings` | `ListingsSortBar` toggle `visibleFrom="sm"`; reset below sm (R37) |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: review; role: Opus; task: 741 (Revision 3c); subject: listing-card status badges, sold/rented overlay label, grid/list toggle below 640; references: Lahomes, Kamr, Omah, TailAdmin + none; library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid.html → unchanged, /property-list.html → unchanged, Omah /property-list.html → unchanged, Kamr /room → difference (live login works; library login failed), TailAdmin /cards → unchanged, /badge → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (enumerated/inspected/blocked, library); inspected in depth: the six live pages above at 1440 and 390, rows in this file; workflow states operated: page load, Kamr sign-in, viewport 1440→390; options across references: filled photo-corner pill ← Lahomes 008, Omah 013; tinted pill ← Kamr 005, TailAdmin 064/068; toggle beside sort ← Omah 013; separate grid/list routes ← Lahomes 008/009; chosen 2026 best practice: filled photo-corner pill labelled per status (text carries the state, WCAG 1.4.1) and the owner's D46-3 toggle — matches what shipped; absent or unverified: inactive/pending card badges and an orientation reset (owner D46-4, D46-3); lero.al data map: ListingCard × listings.status/price/created_at; ListingsShellView × view state; owner decisions: D46-1…D46-4, O83-1; evidence: docs/sessions/evidence/task741r3/rev3c/research-review/gr7-review.md, ../review/gr7-live-check.json, ../review/live-00…11.png.`
