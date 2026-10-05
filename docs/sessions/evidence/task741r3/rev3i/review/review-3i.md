# Task 741 Revision 3i — Opus review record, 2026-10-05

Decision: `NEEDS REVISION` → Revision 3j (kickoff §18.21). Platform `win32`, Node v22.22.3, the final 3i `storybook-static`
(22:55, after the last source write at 22:54; `final/18_hashes.txt` equals the working tree).

## Inspected
- Kickoff §18.19–§18.20; session log `## Revision 3i`; `MantineListingCardPattern.tsx` / `.module.css` (full),
  `FavoriteButton.stories.tsx` (full), the R73a test diff; `rev3i/exec/` final gate transcripts 00–22, `01_red.txt`,
  `badge-visible-probe.mjs` + JSON, `corner-check-r71.mjs` + `corners-r71.json` + `corners/`, `probe-fav.*`,
  `shell-shots.*`, `research-exec/gr7-exec-3i.md`.
- Own probes: `review-probe.mjs` → `review-probe.json`, `crops/`; `research-review/gr7-review-3i.mjs` → `.json`, `shots/`;
  `research-review/lahomes-sold.mjs` → `.json`, `shots/lahomes-sold-card-1440.png`.

## Verified
- R69: `resolveGalleryOffsetValue(theme, 'xs')` imported from `./GalleryNavActionIcon`, used for top/left and
  bottom/right (`MantineListingCardPattern.tsx:7,146,150,184-185`). R73a red 2/14 on 3h, green on final. R73b probe
  checks `elementFromPoint` + inside-photo and exits 1 on any failure; 226/226 hidden on 3h, 0/226 on final.
- Overlay order (executor addition): `{image}{overlayPart}{badgesPart}{photoCountPart}` in both layouts; parts unchanged,
  parity 424/0. Accepted.
- R70 root: `opacity: 1`, `grayscale(1)` on both archived roots (own probe).
- R72 / AC62: no `w={`/`h={`/`gap={4}`/`style={{` (only `fw={500}`); fluid `SimpleGrid`, production `AppImage`.
- Gates: build-storybook, typecheck, lint, build, vitest, design-tokens, integrity, mojibake, backlog-active exit 0;
  census only `ListingsShell.tsx` FAIL.

## Findings
- **F62 P1 (GR-11; production; orchestrator error in R70).** `.archived .imageSection { opacity: 0.6 }` fades every
  child of the photo section. Own probe (`review-probe.json` → `archived`): in both card Stories the Archived badge and
  the photo count have effective opacity **0.6** in grid and list, and the grid favourite 0.6. GR-11 forbids an
  `opacity` fade on a filled rounded shape. Reference: Lahomes `/property-grid` "Sold" card — label, photo and card all
  at opacity 1, no filter (`lahomes-sold.json`). → R74.
- **F63 P1 (CONTRADICTION; R71/AC61).** `corner-check-r71.mjs` opens one page at `deviceScaleFactor: 1` and its
  `for (const dpr of [1, 1.25])` loop never changes the scale: 26 of 30 "dpr1.25" PNGs are byte-identical to the dpr1
  PNGs (md5, `corners/`), the other 4 differ only by re-render. The receipts' "DPR 1.25 crops" do not exist. The probe
  always `process.exit(0)`; its area-ratio metric scores a 1px ring against a filled quarter circle (card roots 21–40);
  the TailAdmin card selector found nothing, so no reference number exists; 5 objects are outside 10 points.
  AC61 is not met. Own real-DPR crops (`crops/grid-root-bl-dpr{1,1.25}-10x.png` beside
  `tailadmin-card-bl-dpr1-10x.png`, viewed) show the 6px card ring as a smooth arc; the defect is the evidence, not
  (as far as measured) the corner. → R75.
- NOTE: the executor's GR-7 receipt did not open TailAdmin `/cards` live although R71 names it as the reference. → R75
  opens it in the probe.

## GR-7 (review)
Live this session at 1440 and 390 (`research-review/gr7-review-3i.json`, `shots/`): Lahomes `/property-grid.html`
(status labels on the photo; "Sold" card not faded), Omah `/property-list.html` and `/ecom-product-grid.html` (cards
12px radius), TailAdmin `/cards` (`rounded-xl border border-gray-200`, 12px, 1px `rgb(228,231,236)`) and `/badge`
(pill badges, opacity 1), Kamr `/ecom-product-grid` (logged in, 7px, 1px border). Library
`docs/research/references/2026-10-04` rows 008/009 (Lahomes), 013/019 (Omah), 013 (Kamr) → unchanged.

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3i) and task creation (Revision 3j); role: Opus; task: 741; subject: archived card look, card-chrome corners; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner, record of §18.19.4); library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid, Omah /property-list + /ecom-product-grid, TailAdmin /cards + /badge, Kamr /ecom-product-grid → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 2/2/0; inspected in depth: the six pages above at 1440 and 390 (full-page shots, computed radius/border/opacity of cards and labels); workflow states operated: Kamr login, scroll to the Lahomes Sold card; options across references: a closed listing keeps its label and photo at full opacity ← Lahomes /property-grid; no reference fades a label; chosen 2026 best practice: keep lero.al's archived photo fade (existing behaviour) but never on the badges, photo count, label or favourite (GR-11, label contrast WCAG 1.4.3); absent or unverified: none; lero.al data map: ListingCard → MantineListingCardPattern isArchived (archived/expired) on /favorites, cabinet and the card Stories; owner decisions: D46-9, D90-1; evidence: docs/sessions/evidence/task741r3/rev3i/review/.`

## Receipts
`GR-9 REVIEW DEPTH — patterns-mantine-listingcardpattern--default, mantine-primitives-listingcard--default, patterns-mantine-listingsshellview--default/--closed-tab, mantine-primitives-favoritebutton--default: elements per card 9 parts (each → MantineListingCardPattern); non-canonical props/values: .archived .imageSection opacity reaches the badges (F62); production states open/new/reduced/premium/inactive/pending/sold/rented/archived/expired/no-image → rendered, badges on screen 226/226, missing NONE, unreachable shown NONE; variant parity grid/list 424/0, archived parts equal (both 0.6, F62); executor claims checked 9/9, contradictions: DPR 1.25 crops (F63), "AC61 met for the filled objects" (F63); evidence docs/sessions/evidence/task741r3/rev3i/review/.`

`GR-10 CANONICAL MATCH — ListingsShellView → ListingCard → MantineListingCardPattern: elements 9 per card; with canonical owner 9/9; matching the original between layouts 9/9; differing: archived badge/photo-count/favourite faded (F62, Lahomes keeps full opacity); card vs Rozetka part by part → Task 918.`

`GR-11 CORNER CHECK — card root grid rest: radius md → 6px; fill white / border 1px rgb(208,213,221); opacity 1; DPR 1 ring 77 % of ideal vs TailAdmin card 92 % (12px); DPR 1.25 crop crops/grid-root-bl-dpr1.25-10x.png (real 1.25 context); reads as a smooth curve like the reference: yes (viewed). Archived badge / photo count / grid favourite: opacity 0.6 → FAIL (F62). Other objects: no valid executor receipt (F63).`
