# GR-7 execution audit — Task 741 Revision 3d (Sonnet, 2026-10-04)

Subject: listing-card status badges, sold/rented overlay label, grid/list toggle below 640 (Revision 3c).
Library: `docs/research/references/2026-10-04/` (`summary.md`, `audit-<ref>.json`). Rows read: Lahomes 008, 009, 049, 052; Kamr 005, 026, 031; Omah 013, 019; TailAdmin 064, 068. Library totals: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (enumerated/inspected/blocked).
Live, own session, Playwright, full-page screenshots, Windows Node v22.22.3. Scripts: `gr7-exec.mjs`, `card-badges2.mjs`, `omah-badge.mjs`, `strike.mjs`. Data: `gr7-exec.json`, `card-badges2.json`, `omah-badge.json`, `strike.txt`.
Kamr signed in with `demo@example.com` / `123456` (owner, 2026-10-04).

## Evidence rows (screenshots in this folder)

| # | Reference page (library row) | Width | Screenshot | vs library | Observed |
|---|---|---|---|---|---|
| 1 | Lahomes `/property-grid.html` (008) | 1440 | exec-00-lahomes-1440.png | unchanged (title equal) | Grid of cards with a **filled status pill on the photo** (`span.badge bg-success|bg-danger|bg-warning text-white fs-13`): "For Rent" `rgb(92,193,132)`, "Sold" `rgb(233,103,103)`, "For Sale" `rgb(240,147,78)`, each 13px/600, radius 4px, padding 3px 6px, 19px high, white text (`card-badges2.json` → `lahomes-grid@1440`; re-measured in `badges-390-remeasure.json`). "For Rent/For Sale" `label.form-check-label` are also filter labels (14px/500, plain). Strike-through old price on cards (`strike.txt`). View switch = nav links to `property-grid.html` / `property-list.html` (separate routes). No overflow. |
| 2 | same | 390 | exec-01-lahomes-390.png | unchanged | The same on-photo filled pills with the same values (`badges-390-remeasure.json` → `390`: "For Rent", "Sold", "For Sale"; 13px/600, radius 4px, padding 3px 6px, `onPhoto: true`); same two route links; no overflow. |
| 3 | Lahomes `/property-list.html` (009) | 1440 | exec-02-lahomes-1440.png | unchanged | Status pills `badge bg-*-subtle text-*`: "Sold" 13px/600, radius 4px, padding 5px 10px, bg rgb(251,225,225), text rgb(233,103,103); "Rent" bg rgb(222,243,230). Tinted, not on a photo. No strike-through. |
| 4 | same | 390 | exec-03-lahomes-390.png | unchanged | Same pill values; no overflow. |
| 5 | Omah `/property-list.html` (013) | 1440 | exec-04-omah-1440.png | unchanged | `status badge badge-sm bg-primary` "For Rent", absolutely placed on the photo: 11px/400, radius 4px, bg rgb(59,76,184), white text, 25px high. Grid/list icon toggle = tab links `#navpills-1` / `#navpills-2`. |
| 6 | same | 390 | exec-05-omah-390.png | unchanged | Same badge values on the photo; the two toggle tabs stay; no overflow. |
| 7 | Kamr `/room` (005), signed in | 1440 | exec-06-kamr-1440.png | unchanged page; **difference:** the live sign-in works (library crawl recorded a failed login) | Tinted/filled pills: "AVAILABLE" 10.5px/400, radius 7px, padding 7px 12.25px, bg rgb(120,214,157), white text. No grid/list toggle on this page (links to Guest List, Reviews). |
| 8 | same | 390 | exec-07-kamr-390.png | unchanged | Same pill values; no overflow. |
| 9 | TailAdmin `/cards` (068) | 1440 | exec-08-tailadmin-1440.png | unchanged | Card with "NEW" tinted pill: 12px/500, radius 9999px, padding 2px 10px, bg rgb(236,253,243), text rgb(3,152,85). No view toggle. |
| 10 | same | 390 | exec-09-tailadmin-390.png | unchanged | Same values; no overflow. |
| 11 | TailAdmin `/badge` (064) | 1440 | exec-10-tailadmin-1440.png | unchanged | Same pill family, light and solid variants. No view toggle. |
| 12 | same | 390 | exec-11-tailadmin-390.png | unchanged | Same; no overflow. |

## Options across references

| Choice | Options ← pages |
|---|---|
| Status badge | filled pill on the photo ← Lahomes 008 (13px/600, r4), Omah 013 (11px/400, r4); tinted labelled pill ← Lahomes 009, Kamr 005, TailAdmin 064/068 |
| Closed listing | strike-through old price only ← Lahomes 008 |
| Grid/list on a phone | icon tab toggle that stays at 390 ← Omah 013; separate routes ← Lahomes 008/009; no toggle ← Kamr 005, TailAdmin |
| Inactive / pending card badge | no reference shows one |

## Chosen practice

Unchanged from kickoff §18.12.2: a labelled badge per status, colour from the one `LISTING_STATUS_COLOR` map, plus the owner D46-3 toggle hidden below 640 with a list→grid reset. The label carries the state as well as the colour (WCAG 1.4.1). Not contradicted: Omah (filled, on the photo) and Lahomes/Kamr/TailAdmin (tinted) all pair a text label with the colour.

## Difference from the kickoff's attribution (not a contradiction of the chosen practice)

§18.12.2 attributed "a filled pill at the photo's top corner (13px/600, radius 4px)" to Lahomes 008 and Omah 013. Measured: Lahomes 008 is 13px/600, radius 4px; Omah 013 has the on-photo filled pill at 11px/400, radius 4px (`omah-badge.json`). The strike-through attribution to 008 is confirmed.

## lero.al data map

- `ListingCard`: `listings.status` (7 values: active, inactive, pending, sold, rented, archived, expired), `created_at` (New window 7 days), `price` / `price_old`, `is_premium`, `images`. Favourites exclude only `archived`.
- `ListingsShellView`: client `view` state, `grid`/`list`; below 640px it is forced to `grid`.
- Badge labels: `listing.new`, `listing.price_reduced`, `listing.status_*`.

## Absent or unverified

Inactive/pending card badges (no reference). Orientation reset on a phone (no reference). Pages not opened: the other 100+ library pages of each reference; the library rows stand for them.
