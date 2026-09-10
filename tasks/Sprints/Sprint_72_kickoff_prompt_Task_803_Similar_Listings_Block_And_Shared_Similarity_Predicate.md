# Task 803 — the similar-listings block becomes a real entry point into search

**Sprint:** 72 · **Priority:** P2 · **QA profile:** **Q4** · **Filed:** 2026-09-09 · **State:** `NEEDS REVISION` (Revision 1 brief in §16, added 2026-09-09 by owner instruction)

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception (D69-3): **no
review ledger** — but see §13, the critical-flow regression evidence is **not** waived by it.

**Blocked until Task 792 is `APPROVED` / `APPROVED WITH NOTES`** (Sprint 72 precondition 1). This task edits
`SimilarListingsView.tsx` and `SimilarListingsView.stories.tsx`, both uncommitted 792 artifacts.

---

## 1. Mode and task type

`TASK DESIGN` -> implementation kickoff. Type: **feature — query semantics + responsive layout change + reuse of an
existing canonical control.** It is **not** a de-Tailwind migration; do not treat it as one.

It touches a registered critical flow. Read §13 before §10.

## 2. Objective

Today the similar-listings block shows at most four cards in a static grid and offers no way to see more. The status
banner's link (Task 792 R5) is the only path from a listing into a filtered search, and it is built from a parameter
set the block's own query does not use — so the search a user lands on is not "more of these".

Make the block a working entry point: up to eight results, a horizontal-scroll/grid switch, and a canonical
"view all" control whose href is built from **the same predicate the block queried**, after that predicate has been
relaxed to whatever actually returned rows.

## 3. Verified context — measured 2026-09-09, do not re-derive from a document

### 3.1 What the block does today

`FACT` — `src/modules/listings/components/SimilarListings.tsx` (Server Component, the container):

- `:64-72` the query is `applyPublicVisibility(supabase.from('listings').select(SELECT))` `.eq('property_type', propertyType)` `.neq('id', currentId)` `.limit(4)`.
- `:75-81` one fallback exists already: if `locationId` is set and the location-scoped query returns nothing, it re-runs without the location.
- `:83` `if (!listings?.length) return null` — the block disappears entirely when empty.
- `:87-91` speculation rules: the first **2** result URLs, skipped when `Save-Data: on`.
- `:94` the `.similar-listings` wrapper lives here, not in the View.

`FACT` — the container receives only `currentId`, `propertyType`, `locationId` (`:10-14`). `listing_type` is **not**
passed, so the block can currently return rentals as "similar" to a sale listing.

### 3.2 What the View renders today (post-792, uncommitted)

`FACT` — `SimilarListingsView.tsx` after Task 792: `Title order={2} size="h4" mb="lg"` then
`SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md"`. Zero `className=`. Props:
`heading`, `listings`, `rates`, `displayCurrency`.

### 3.3 The canonical header control already exists — this is `reuse`, not `create canonical`

`FACT` — `src/components/shared/ViewAllLink.tsx`: `'use client'`, props `{ href: string; label: string }`, renders
`Button component={Link} variant="transparent" size="sm" w={{ base: '100%', sm: 'auto' }}`.

`FACT` — the exact header composition to copy is `FeaturedListingsView.tsx:59-66`:

```tsx
<Group ...>
  <Title order={2} fw={700} fz={SECTION_HEADING_FZ}>{t('featured')}</Title>
  {!loading && listings.length > 0 && (
    <ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />
  )}
</Group>
```

`FACT` — the label needs **no new string**: `view_all` exists at `messages/{en,sq,uk,it}.json:49`
(`uk` = `"Переглянути всі"`, `sq` = `"Shiko të gjitha"`).

⚠️ `CONFLICT — resolve, do not average.` `FeaturedListingsView` sizes its heading `fw={700} fz={SECTION_HEADING_FZ}`;
`SimilarListingsView` (Task 792) uses `Title order={2} size="h4"`. **Preserve 792's `size="h4"`** — it was chosen so
the Suspense placeholder matches the real content, and 792 is under review. Copy the *composition* from
`FeaturedListingsView`, not its heading sizing. Report any pressure to change it as a deviation.

### 3.4 The scroll/grid contract already exists

`FACT` — `src/modules/listings/components/RecentlyViewedGridView.module.css` (created by Task 792) is the project's
horizontal-scroll/grid switch: flex + `overflow-x:auto` + fixed card width below `40em`, CSS grid 2/3/4 columns at
`40em`/`48em`/`64em`. Gaps consume `var(--mantine-spacing-*)`; the card width is
`calc(var(--mantine-spacing-xl) * 8)`. No bare numeric literal appears in it (D71-4).

### 3.5 What `/listings` actually accepts — the ceiling of what the href can carry

`FACT`, read from `src/modules/listings/domain/filterEngine.ts:178-212` (`parseSearchParams`) and `:225-260`
(`applyListingFilters`):

| Listing column | URL parameter | Shape |
|---|---|---|
| `listing_type` | `type` | enum |
| `property_type` | `property_type` | enum |
| `location.id` | `location_id` | number |
| `rooms` | `rooms` | comma list of numbers |
| `condition` | `condition` | comma list, enum-validated |
| `heating` | `heating` | comma list, enum-validated |
| `wall_type` | `wall_type` | comma list, enum-validated |
| `market_type` | `market_type` | single enum |
| `offer_type` | `offer_type` | comma list, enum-validated |
| `purchase_conditions` | `purchase_conditions` | comma list, enum-validated |
| `area_gross` | `area_min` / `area_max` | numbers |
| `floor` | `floor_min` / `floor_max` | numbers |
| `total_floors` | `floors_total_min` / `floors_total_max` | numbers |
| `year_built` | `year_built_min` / `year_built_max` | numbers |

`FACT` — **`bedrooms`, `bathrooms` and `toilets` have no filter parameter anywhere**: absent from `ParsedFilters`
(`:80-113`), from `FilterValues` (`:50-73`), from `parseSearchParams`, and from `applyListingFilters`. They exist as
listing columns and are declared in `propertyTypeSchema.ts:153`. They are **Task 804's** scope, not this task's.
Do not add them here.

`FACT` — `heating`, `wall_type` and `offer_type` parse and apply end-to-end but have **no control** in
`ListingsFilters.tsx` (measured: that file references `price_*`, `area_*`, `rooms`, `floor_*`, `floors_total_*`,
`year_built_*`, `conditions`, `layout_features`, `market_type`, `purchase_conditions` — and none of the other three).
A URL carrying them still filters correctly; the user simply cannot see or clear the chip. Also **804's** scope.
803 may still emit them, because the engine honours them.

### 3.6 The href builder that exists today

`FACT` — `buildSimilarListingsHref` is exported at `ListingDetailView.tsx:82` and covered by
`src/modules/listings/components/__tests__/ListingDetailView.buildSimilarListingsHref.test.ts` (Task 792
Revision 1). It carries `type`, `property_type`, `location_id` and omits falsy values. **It must keep working and its
test must keep passing unchanged** — 803 re-implements it as a thin caller of the new shared source, not as a
competing builder.

### 3.7 ⚠️ This touches a registered critical flow

`FACT` — `docs/critical-flow-registry.md`, row **"Listing public visibility invariant"**, names
`SimilarListings.tsx` explicitly among the public reads that must go through `applyPublicVisibility`. The relaxation
ladder in §10 rebuilds that query. A rung that drops or bypasses `applyPublicVisibility` publishes hidden, expired,
sold or unpublished listings to anonymous visitors.

This is why the profile is **Q4** and why §13 requires a planted-violation proof. `docs/agent-contract.md` clause 15
binds: manual checking alone cannot close it.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | One shared similarity source — a new `src/modules/listings/domain/similarity.ts` — produces an ordered, tiered structure from a listing, and exactly two consumers render it: a Supabase predicate applier and a URL builder. No second field-to-parameter mapping exists in the detail route. | P0 | AC1 |
| **R2** | `buildSimilarListingsHref` becomes a thin caller of R1's URL builder. Its existing test file passes **unchanged** (not edited, not relaxed). | P0 | AC2 |
| **R3** | The container queries at most **9** rows and the View renders at most **8**. | P0 | AC3 |
| **R4** | The header carries `ViewAllLink` **only when a 9th row was returned**, with `label={t('view_all')}` and `href` built by R1 from the **settled** predicate. | P0 | AC4 |
| **R5** | Relaxation ladder: at most **4** Supabase round trips, tiers dropped in the fixed order of §10.3, stopping at the first tier that returns at least one row. | P0 | AC5 |
| **R6** | `applyPublicVisibility`, `.neq('id', currentId)`, `property_type` and `listing_type` are present in **every** rung. Proven by an automated test that iterates every rung, plus a planted-violation failure record. | P0 | AC6 |
| **R7** | The card row scrolls horizontally at **every** width (D72-5), with a partial next card visible so the scroll is discoverable; the `.similar-listings` wrapper, the `data-testid` set and the speculation-rules script (first 2 URLs, `Save-Data` skip) are preserved verbatim. | P0 | AC7 |
| **R8** | `listing_type` reaches the container as a new prop and narrows the query. A rental is never shown as similar to a sale listing. | P0 | AC8 |
| **R9** | The canonical story `Mantine/Primitives/SimilarListingsView` is **extended** (not replaced) to cover: 8 items with the view-all control, fewer than 8 without it, and the empty branch. It keeps its static import of the real component and its manifest entry. | P0 | AC9 |
| **R10** | No new i18n string, no new theme value, token, `design-tokens-allow` marker or allowlist entry; `check:design-tokens --strict --scope=mantine` stays 0. | P1 | AC10 |

## 5. Assumptions and open questions

- **`OWNER DECISION — settled 2026-09-09 (D72-5).`** The row scrolls horizontally at **every** width — a true
  carousel, not the project's existing scroll-below-`sm`/grid-above contract. The owner ruled on this after seeing
  the live route. §3.4's file is therefore the **mechanical** reference (how gaps, card width and scrollbar hiding
  are expressed without a raw literal), not the responsive shape to copy. `SimpleGrid` leaves the View entirely.
  Do not change `RecentlyViewedGridView` to match — it keeps its own breakpointed contract (§8).
- **`ASSUMPTION (reversible, stated)` — tier C's numeric derivations.** `area_min`/`area_max` = `area_gross` ±25%;
  `rooms` = the listing's exact value; `floor_min`/`floor_max` = the listing's exact floor;
  `year_built_min`/`max` = ±5 years. Each is emitted only when its column is non-null. These are similarity
  heuristics, not measured product rules; they sit in the tier that is dropped first among the numerics.
- **`ASSUMPTION (reversible, stated)`** — "more than 8" is detected by requesting 9 and checking for a 9th row, not
  by a separate `count` query. One round trip, no extra load.
- **`UNKNOWN`** — whether `layout_features` has a corresponding listing column. It is a valid filter parameter
  (`filterEngine.ts:208`) but no `layout_features` field was found on the `Listing` type. **Do not emit it** until
  Task 804 establishes the mapping. If the executor finds the column, that is a deviation to report, not to act on.
- **Out of this task by owner instruction:** `bedrooms` / `bathrooms` / `toilets` filters and the three
  control-less parameters of §3.5 — Task **804**.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15 especially) · `docs/ai-behavior.md` Notes 18–23 ·
`docs/rule-index.md` -> **Current Mantine path**: `docs/mantine-responsive-design-system.md`,
`docs/tailadmin-style-reference.md`, `docs/component-rules.md` · `docs/data-access-rules.md` ·
`docs/rls-rules.md` · `docs/qa-rules.md` · `docs/qa-profiles.md` · `docs/critical-flow-registry.md`
(the "Listing public visibility invariant" row) · `docs/storybook-governance.md` · `docs/backlog.md` ·
this sprint's plan file for **D72-1 … D72-4**.

## 7. Scope

`src/modules/listings/domain/similarity.ts` (new) and its unit test · `SimilarListings.tsx` (query, tiers, limit,
props) · `SimilarListingsView.tsx` (header composition, scroll/grid switch, 8-item cap) · a new
`SimilarListingsView.module.css` · `ListingDetailView.tsx` (`buildSimilarListingsHref` becomes a caller; the
`SimilarListings` call site gains `listingType`) · `SimilarListingsView.stories.tsx` (extend) · the
public-visibility regression test · `docs/component-catalog.md` rows · `docs/backlog.md` state and the session log.

## 8. Out of scope

`filterEngine.ts` itself — **no parameter is added, renamed or re-validated here** · `bedrooms`/`bathrooms`/
`toilets` and the three control-less parameters (**804**) · `ListingsFilters.tsx` and `ActiveFilterChips.tsx` ·
`ListingCard` and `MantineListingCardPattern` · the status banner's own href, which stays as Task 792 shipped it
(owner decision 2026-09-09: the banner keeps pointing at the filtered search) · `RecentlyViewedGridView` and its
CSS module — **read it as the pattern source, do not edit it** · the gallery/lightbox (**794**) · everything Sprint
71 owns.

## 9. Current and required behavior

**Before:** up to 4 cards, static responsive grid, no way to see more, query narrowed only by `property_type` and
optionally `location_id`, and rentals can appear under a sale listing. The block vanishes when the query is empty.

**After:** up to 8 cards in a horizontal scroll below `sm` and a grid above it; a "view all" control in the header
when a 9th match exists, pointing at `/{locale}/listings` carrying exactly the parameters that produced the visible
set; and a 4-rung relaxation ladder so the block is populated far more often. Public visibility, the current-listing
exclusion, `property_type` and `listing_type` hold at every rung.

## 10. Implementation requirements

### 10.1 The shared source (R1)

`similarity.ts` exports a pure function that takes the current listing's relevant fields and returns an ordered list
of `{ tier, param, value }` entries, plus two renderers over that list: one that chains Supabase `.eq()`/`.gte()`/
`.lte()`/`.in()` calls, and one that emits a `URLSearchParams`. Both consume the identical structure — that is
D72-3, and it is the whole point of the task. A parameter must not be able to appear in the URL without being
expressible in the query, or vice versa.

Keep it a pure domain module: no Supabase client, no `next/*` import, no translation. The query renderer takes the
builder as a parameter, the same way `applyListingFilters` does.

### 10.2 Core, never dropped (R6, D72-2)

`applyPublicVisibility(...)`, `.neq('id', currentId)`, `property_type`, `listing_type`. These are not tiers. They are
applied outside the ladder so no future edit can accidentally schedule them for relaxation.

### 10.3 The ladder (R5, D72-4) — exactly four attempts

| Attempt | Predicate |
|---|---|
| 1 | core + tier A (`location_id`) + tier B (amenity enums: `condition`, `heating`, `wall_type`, `market_type`, `offer_type`, `purchase_conditions`) + tier C (numerics: `rooms`, `area`, `floor`, `year_built`) |
| 2 | core + tier A + tier C — amenity enums dropped |
| 3 | core + tier A — numerics dropped |
| 4 | core only — `location_id` dropped |

Stop at the first attempt returning at least one row. Attempt 4 reproduces today's behaviour, so the block can never
be emptier than it is now. If attempt 4 is also empty, `return null` exactly as `:83` does today.

The **settled** predicate — the one belonging to the attempt that produced the rendered rows — is what R4's href is
built from. Building the href from attempt 1 while displaying attempt 3's rows is precisely the defect D72-1
forbids.

### 10.4 Layout (R7, D72-5)

New `SimilarListingsView.module.css`. Do not import `RecentlyViewedGridView.module.css` across components and do not
edit it — read it only for the mechanics (gap from `var(--mantine-spacing-*)`, `scrollbar-width:none` plus the
`::-webkit-scrollbar` rule, `flex-shrink:0` on the card).

The row is `display:flex; overflow-x:auto` with **no** grid breakpoint. `SimpleGrid` is removed from the View.

Card width is a **percentage-based flex-basis**, not a fixed token width, so the row adapts without a raw px value
(D71-4 — a percentage is not a px/rem/em literal, the same reasoning Task 792 applied to `h="100%"`):

| Width | Cards fully visible | Basis |
|---|---|---|
| base | 1 + a peek | `calc(100% / 1.2)` |
| `40em`+ | 2 + a peek | `calc(100% / 2.2)` |
| `48em`+ | 3 + a peek | `calc(100% / 3.2)` |
| `64em`+ | 4 + a peek | `calc(100% / 4.2)` |

`ASSUMPTION (reversible, stated)` — the `.2` peek is the affordance that tells a user the row scrolls; without it a
full-width row of exactly N cards reads as a static grid and D72-5's intent is lost. The fractions are a starting
point for the owner's visual review, not a measured product rule.

The media queries here change only the flex-basis, never `display`. Add `scroll-snap-type: x proximity` on the row
and `scroll-snap-align: start` on the card. Keyboard and trackpad scrolling must work; do not add arrow buttons —
no canonical carousel-control contract exists in this repo, and inventing one is exactly what §4's R10 and the
canonical-first gate forbid.

### 10.5 Preservation

The `.similar-listings` wrapper, the speculation-rules script and its `Save-Data` skip, and the first-2-URLs slice
stay in the container, byte-identical in behaviour. The speculation slice reads from the **rendered** 8, not the
fetched 9.

## 11. Positive and negative flows

**Positive flow:** open a listing whose type/location/amenities match many others -> the block renders 8 cards,
scrollable on mobile -> the header shows "Переглянути всі" -> clicking it lands on `/{locale}/listings` carrying the
settled parameters -> that page's result set contains the 8 that were visible.

| Branch | Applicable? | Expected | Why |
|---|---:|---|---|
| Empty at every rung | **Yes** | Attempt 4 empty -> `return null`, no header, no link, no empty shell | `:83` is today's behaviour and must not regress |
| Fewer than 9 matches | **Yes** | Cards render, **no** view-all control | R4 — the owner's ">8" condition |
| Exactly 9+ matches | **Yes** | 8 cards + the control | R3/R4 |
| Null optional columns | **Yes** | A listing with null `area_gross`/`floor`/`year_built`/`location_id` omits those parameters from both query and URL; the link still resolves | every one of those columns is nullable |
| Relaxation fired | **Yes** | Href carries the settled tier's parameters only — verify attempt 3's href does not carry amenity enums | D72-1 |
| Public visibility | **Yes** | No rung can return a non-publicly-visible row | R6, critical flow |
| Locale expansion | **Yes** | Header + control hold at `uk@320` without overflow; href carries the active locale | Q4 keeps Q2's `uk@320` mandatory |
| Small viewport | **Yes** | Horizontal scroll below `sm`, no page-level horizontal overflow at 320/390 | R7 |
| Authorization / RLS | **Yes** | The query is anonymous-readable only; no new RLS surface, and `applyPublicVisibility` is the boundary | registered critical flow |
| Concurrent writer | No | — | Read-only path |
| Repeated execution | No | — | Idempotent read |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `similarity.ts`, when a listing is passed, then one ordered structure is returned and both the
  query renderer and the URL renderer consume it; a repo-wide grep finds no second listing-field-to-URL-parameter
  mapping in `src/modules/listings/components/`.
- **AC2 [R2]** — Given `npx vitest run src/modules/listings/components/__tests__/ListingDetailView.buildSimilarListingsHref.test.ts`,
  then it passes with the test file unmodified (`git diff --stat` shows no change to that path).
- **AC3 [R3]** — Given a listing with 12 eligible matches, then the query requests 9 and the DOM contains exactly 8
  listing cards inside `.similar-listings`.
- **AC4 [R4]** — Given 9 rows returned, then one `ViewAllLink` renders in the header with the `view_all` label for the
  active locale, and its `href` equals the URL rendered from the settled predicate. Given 8 or fewer, then no
  `ViewAllLink` is in the DOM. Assert the href in a test, not by eye.
- **AC5 [R5]** — Given a listing whose full predicate matches nothing but whose `property_type` matches others, then
  at most 4 queries run and the block renders the widest non-empty rung. Assert the attempt count.
- **AC6 [R6]** — Given a test that walks all 4 rungs, then every rung's built query contains the visibility
  predicate, the `neq` on the current id, `property_type` and `listing_type`. **Planted-violation proof required:**
  remove the visibility predicate from one rung, record the test failing, restore it, record the test passing. Quote
  both outputs.
- **AC7 [R7]** — Given the rendered block, then `.similar-listings` is present, the speculation-rules script carries
  exactly the first 2 of the **rendered** URLs and is absent under `Save-Data: on`, and the card row computes to
  `display:flex; overflow-x:auto` at **every** tested width — 320, 390, 768, 1024 and 1440 — with `display:grid`
  appearing at none of them. State the computed value per width; a screenshot alone does not close this.
- **AC8 [R8]** — Given a `sale` listing, then no rendered card and no href parameter set can include a `rent`
  listing; `type=sale` is present in every rung's URL.
- **AC9 [R9]** — Given `npm run check:story-coverage`, then `SimilarListingsView` remains covered, the story still
  statically imports the real component, and it exports the three states of R9. State the before/after counts.
- **AC10 [R10]** — Given `node scripts/check-design-tokens.mjs --strict --scope=mantine`, then 0 violations and 0
  stale markers; and `git diff messages/` is empty.

## 13. QA profile and verification plan

**Profile: `Q4 Release/Critical Flow`.** Not a judgement call: `docs/qa-profiles.md` assigns Q4 to "changes touching
`docs/critical-flow-registry.md`", and §3.7 shows this task rebuilds the query of a named consumer of the
"Listing public visibility invariant" row. Q4 requires the Q1/Q2/Q3 evidence that applies **plus** a regression
baseline, a changed-behavior test, and a planted-violation failure proof — AC6 is that proof.

The frontend no-review-ledger exception (D69-3) still applies to the *review record*. It does not waive clause 15's
automated regression evidence.

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npx.cmd vitest run src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32`; every gate exit 0 except `check:design-tokens` unscoped, which exits 1 on its pre-existing
baseline only, and `npm run test`, whose known-red files are Task **790**'s — name each failure and prove it
pre-existing rather than reporting a bare exit code. Return each command's real exit code read from inside its
retained transcript.

**Live-route evidence (D71-1 applies here too — a green build is not evidence for a `ƒ` route).** Run this second,
after the block above:

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
$ev = "$PWD\docs\sessions\evidence\task803"
$utf8 = New-Object System.Text.UTF8Encoding($false)
New-Item -ItemType Directory -Force -Path $ev | Out-Null
Start-Process cmd.exe -ArgumentList "/c npm.cmd run start > `"$ev\start.txt`" 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 20
[System.IO.File]::WriteAllText("$ev\body-uk.txt", (Invoke-WebRequest "http://localhost:3000/uk/listings/$slug" -UseBasicParsing).Content, $utf8)
[System.IO.File]::WriteAllText("$ev\body-sq.txt", (Invoke-WebRequest "http://localhost:3000/sq/listings/$slug" -UseBasicParsing).Content, $utf8)
Select-String -Path "$ev\body-uk.txt","$ev\body-sq.txt" -Pattern 'NEXT_HTTP_ERROR_FALLBACK' -SimpleMatch | Select-Object Filename,LineNumber
Select-String -Path "$ev\body-uk.txt","$ev\body-sq.txt" -Pattern 'data-testid="listing-detail-view"' -SimpleMatch | Select-Object Filename,LineNumber
([regex]::Matches((Get-Content -Raw "$ev\body-uk.txt"), 'href="(/uk/listings\?[^"]*)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
Get-Content "$ev\start.txt"
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Expected: the `NEXT_HTTP_ERROR_FALLBACK` match set is **empty** and the `listing-detail-view` match set is
**non-empty** — a `StatusCode 200` alone proves nothing, because Next commits the status before streaming a 404
body (measured on Task 792, `r1-body-sq.txt`). The regex line prints the view-all href. `start.txt` must contain no
`⨯ Error`.

**Transcript rule.** Do not pipe a native command through `Tee-Object` — Windows PowerShell 5.1 writes UTF-16LE,
which `check:file-integrity` rejects as NUL bytes and `check:mojibake` reads as U+FFFD. Capture with
`& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, and append
`EXIT_CODE=$LASTEXITCODE` **inside** the file. Retain everything under `docs/sessions/evidence/task803/`.

**`OWNER VISUAL QA REQUIRED`** — on the **live route**, not the Storybook toolbar (Task **799**: the viewport
switcher has never resized the preview, so it is not a review instrument):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Similar-listings block | 8 cards + view-all control, row scrolls **and a next card peeks** at every width | uk, sq | 320, 390, 768, 1024, 1440 |
| Similar-listings block | fewer than 8, no control | uk | 320, 1440 |
| Similar-listings block | empty (block absent) | uk | 390 |
| View-all control | click through | uk, sq | 390 |
| Header row | long `uk` heading + control, no overflow | uk | **320 (mandatory)** |

## 14. Completion report contract

Files changed · requirement IDs completed · the similarity structure as actually emitted for one listing with all
columns and one with three null columns · the four rungs' built predicates · the settled href for a relaxed case
(AC5) · the AC6 planted-violation before/after output quoted · story-coverage before/after counts · commands run
with real exit codes and transcript paths · the live-route grep results (AC/§13) · assumptions · deviations ·
known limitations · anything left open. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Can the link and the block disagree? | No — R1/D72-3 make them two renderings of one structure, and AC4 asserts the href equals the settled predicate's URL. |
| Can relaxation leak a hidden listing? | No — §10.2 applies the core outside the ladder, R6/AC6 walk every rung, and AC6 requires a planted-violation failure. |
| Is the QA profile justified rather than inherited? | Yes — §3.7 quotes the registry row that names `SimilarListings.tsx`; Q4 follows from `docs/qa-profiles.md`, not from habit. |
| Does it invent a filter parameter? | No — §3.5 is read from `filterEngine.ts`; the three absent ones are explicitly deferred to 804. |
| Does it invent a control or a string? | No — `ViewAllLink` and `view_all` both exist and are cited with paths; the disposition is `reuse`. |
| Is the story gate satisfied? | Yes — R9 **extends** the canonical story Task 792 created; no new permanent story is invented, and the manifest entry already exists. |
| Is the round-trip cost bounded? | Yes — D72-4 caps at 4 attempts and §10.3 groups rungs into tiers to fit it. |
| Does it silently change Task 792's work? | No — §3.3 records the heading `CONFLICT` and resolves it in favour of 792's `size="h4"`; §8 forbids editing `RecentlyViewedGridView`. |
| Is the scroll shape decided or assumed? | Decided — **D72-5**, owner, 2026-09-09, after live review. The kickoff's original reversible default is superseded and §5 says so; only the `.2` peek fraction remains a stated assumption. |
| Can it start before 792 is reviewed? | No — stated in the header and in the sprint's precondition 1. |

---

## 16. Revision 1 — owner-directed, 2026-09-09 (post-review)

**Re-entry mode: `remediation`.** Origin: the implementation review of 2026-09-09, findings **F1** (`P1`) and
**F3** (`P2`). Owner instruction, 2026-09-09: *"онови kickoff, щоб Sonnet зробила null-захист для
`purchase_conditions` та скрипт заміру computed-стилів"* — those two, and only those two, are in this revision.

Strongest permitted result is still `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

### 16.1 Already closed — preserve, do not redo, do not re-capture

`FACT` — verified in review round 1 and round 2. Treat every one of these as **frozen**:

| Closed | Evidence that closed it — keep the artifact |
|---|---|
| AC1, AC2, AC4, AC5, AC8, AC9, AC10 | `similarity.test.ts` · `ladder.test.ts` · the byte-unchanged `ListingDetailView.buildSimilarListingsHref.test.ts` · `i-story-coverage.txt` · `i-design-tokens-strict-mantine.txt` |
| AC6 + R6, **fully** | `ac6-planted-violation-FAIL.txt` (4/6 genuine FAIL) · `ac6-reverted-PASS.txt` (6/6) · `i-check-listing-visibility.txt` — gate PASSED, 0 violations, 632 files, 0 stale allowlist entries |
| The critical-flow row `docs/critical-flow-registry.md:70` | Both halves of its declared command run and green |
| `npm run test` at the Task 790 baseline | Owner run, 2026-09-09 22:43 — `4 failed \| 84 passed` files, `5 failed \| 1560 passed` tests |

**The AC6 plant MUST be re-proven in this revision.** ⚠️ This paragraph was reversed on 2026-09-09 when the owner
folded **F4** into the revision (§16.5): F4 rewrites `buildSimilarityRungQuery`'s body, so
`ac6-planted-violation-FAIL.txt` / `ac6-reverted-PASS.txt` describe a function that no longer exists. Keep both
files, mark them `SUPERSEDED`, and produce `ac6-rev1-*` per §16.9④. A plant proof for a replaced function is not
evidence. Everything else in the table above stays frozen.

**Superseded transcripts — mark them, do not delete them.** `i-lint.txt` (18:13) and `i-full-test-suite.txt` (18:15)
were captured **before** `SimilarListings.tsx`'s final write (18:24:38) and are stale for the reviewed diff; the
owner's 2026-09-09 22:38–22:44 runs are the final artifacts for lint / typecheck / full suite / build. The session
log's validation table must label the two old files `SUPERSEDED` and cite the owner runs instead. This is the defect
that produced review finding F5, which was **withdrawn as a reviewer error** — the code was always clean; the
artifact was stale. Do not "fix" the two unused `eslint-disable` directives: fresh lint reports 0 errors and
**72** warnings with neither touched file named.

### 16.2 Explicitly NOT in this revision

**Revision 1 was extended on 2026-09-09 by owner instruction** — F4 and F6 are now IN scope as §16.5 and §16.6,
and the two review `NOTE`s as §16.7. What remains out:

- **F7 (`P3`)** — `rooms` renders `.eq` here while `filterEngine.ts:263-271` reads `rooms=5` as "5 or more" and
  ignores `rooms>5`. The behavioural fix belongs to **804**, which owns the filter surface; `filterEngine.ts` is
  out of scope for 803 per §8. **In scope here: only the one-line comment in §16.3d.** 804's registry row in
  `docs/backlog.md` now carries this so it cannot be lost.
- The `OWNER VISUAL QA REQUIRED` matrix (§13) is unchanged and still owed by the **owner**, not by Sonnet. §16.6
  changes what its header row will show — the owner reviews the new shape, not the Revision 0 one.

### 16.3 R11 [`P0`, closes F1] — `purchase_conditions` must not be able to throw

### 16.3a The measured defect

`FACT` — `src/modules/listings/domain/similarity.ts:83` reads `listing.purchase_conditions.length` and `:86` reads
`.join(',')` with **no guard**. Every other field in `buildSimilarityEntries` is guarded — `!= null` for
`location_id`/`rooms`/`area_gross`/`floor`/`year_built`, truthiness for `condition`/`heating`/`wall_type`/
`market_type`/`offer_type`. This is the only unguarded dereference in the function.

`FACT` — `src/types/database.ts:267` declares `purchase_conditions: string[]` (non-nullable), which is why
`npx tsc --noEmit` is clean. That file is hand-maintained, and the repository's own runtime reads of the same column
do not trust it:

- `src/app/[locale]/listings/[slug]/edit/page.tsx:104` — `(listing.purchase_conditions as string[] | null) ?? undefined`
- `src/modules/listings/domain/filterEngine.ts:443` — `(fv.purchase_conditions?.length ?? 0)`

`INFERENCE` — the call path is `ListingDetailView.tsx:513` → `SimilarListings` (`async` Server Component) →
`buildSimilarityEntries`. A `NULL` in that column therefore throws `TypeError: Cannot read properties of null
(reading 'length')` **inside a `ƒ` route**, which is the Task **784** / **791** failure class: `tsc` types it
impossible, `next build` never executes a dynamic route, `eslint` has no such rule, `check:hydration` measures a
short console window, and Storybook renders the View as a client component and never calls this function at all.
D71-1 exists because of exactly this.

`UNKNOWN` — whether a production row currently holds `NULL`. Not resolvable from the repository, and it is not the
deciding question: the guard costs one line and removes the class.

### 16.3b Required change — exactly three edits

1. `similarity.ts` — widen the input field:
   `purchase_conditions: string[] | null | undefined` in `SimilarityListingInput` (currently `:39`).
2. `similarity.ts` — guard **once**, at the single read site, before the tier-B block that uses it:
   read into a local (`const purchaseConditions = listing.purchase_conditions ?? []`) and use that local for both
   `.length` and `.join(',')`. Do not sprinkle `?.` at each use; one normalisation, one place.
3. `SimilarListings.tsx` — widen `Props.purchaseConditions` to `string[] | null | undefined` so the prop type
   matches what the route can actually deliver.

### 16.3c Preserve — non-negotiable

- **`src/types/database.ts` is out of scope.** Do not change `:267`. Whether the generated/declared type is wrong
  is a separate question and changing it ripples through unrelated consumers.
- **`buildSimilarListingsHref` (`ListingDetailView.tsx:89-106`) keeps its literal `purchase_conditions: []`.** It
  stays valid under the widened type; changing it to `null` is a gratuitous edit.
- **`ListingDetailView.buildSimilarListingsHref.test.ts` stays byte-unchanged** — AC2 still binds.
- **`buildSimilarityRungQuery` is not edited** (see 16.1).
- Emitted entries for a non-empty array are byte-identical to today: `op:'overlaps'`, `column:'purchase_conditions'`,
  `value` the array itself, `urlValue` the comma join. `.overlaps()` was reviewed and **accepted** — it matches
  `filterEngine.ts:325` and `propertyTypeSchema.ts:137` for the same column. Do not change the operator.

### 16.3d One comment, and only one (F7)

Add a single line comment on the `rooms` entry in `buildSimilarityEntries` recording that `/listings` reads
`rooms=5` as "5 or more" (`filterEngine.ts:263-271`) and ignores `rooms>5`, so this predicate is narrower than the
URL it renders, and that reconciling the two is Task **804**. Comment only — no behaviour change.

### 16.4 R12 [`P0`, closes F3] — the computed-style probe AC7 actually asked for

### 16.4a Why the existing evidence does not close AC7

`FACT` — AC7's own text: *"the card row computes to `display:flex; overflow-x:auto` at **every** tested width —
320, 390, 768, 1024 and 1440 — with `display:grid` appearing at none of them. **State the computed value per width;
a screenshot alone does not close this.**" No such artifact exists. Revision 0 marked AC7 `✅` on a source reading
of `SimilarListingsView.module.css` and deferred the sweep to the owner's visual matrix — which measures a
different property. `docs/orchestrator-procedures.md` → "Evidence-first preflight" keeps source rules, computed CSS,
geometry and rendered pixels as separate layers; a declaration does not prove a computed value.

The source reading is *strong* — the reviewer independently confirmed `.row`'s `display`/`overflow-x` are
unconditional, the four media queries touch only `flex-basis`, and **no rule anywhere in `src/**/*.css` targets
`.similar-listings`**. That is why this is `P2` and not `P1`. It is still not the measurement.

### 16.4b Deliverable

New `scripts/task803-similar-row-computed.mjs`. **Evidence tooling, not a gate:** no `package.json` script entry,
nothing in CI depends on it — the same disposition as the four existing task-numbered probes.

`FACT` — the convention to follow is `scripts/task775-listings-frame-route-probe.mjs` (read it before writing):
`import { chromium } from 'playwright'` (`playwright ^1.60.0`, `package.json:158`), `BASE_URL` from env defaulting
to `http://127.0.0.1:3000`, top-level `probeHash`/`gitCommit` via `execFileSync('git', …)` with `cwd: ROOT` and no
shell, one immutable run directory per invocation, `writeFile(..., { flag: 'wx' })` so evidence is never silently
overwritten, `process.exit(1)` on a hard fail and `process.exit(2)` on usage error or an unhandled throw.

**Usage:** `node scripts/task803-similar-row-computed.mjs <slug> <runId>`, validating `runId` against
`/^[A-Za-z0-9][A-Za-z0-9._-]*$/` exactly as task775 does.
**Output:** `docs/sessions/evidence/task803/runs/<runId>/similar-row-computed.json`.

### 16.4c Matrix and measurements

Locale **`uk`** only — it is §13's mandatory locale and carries the longest heading. Widths **320, 390, 768, 1024,
1440** — AC7's exact set, not the Q3 canon; do not widen it.

Per cell, record:

| Field | Source |
|---|---|
| `httpStatus`, `ok`, `fallbackMarkerPresent` | the response, plus a body check for `NEXT_HTTP_ERROR_FALLBACK` — a 200 over a 404 body is the measured Task 792 hazard |
| `rowDisplay`, `rowOverflowX` | `getComputedStyle` of the row node |
| `rowScrollWidth`, `rowClientWidth`, `rowOverflows` | the row node's `scrollWidth`/`clientWidth` |
| `cardCount` | element children of the row node |
| `cardFlexBasis`, `cardFlexShrink`, `cardRectWidth` | first card node — computed, plus `getBoundingClientRect().width` |
| `docScrollWidth`, `docClientWidth`, `pageOverflows` | `document.documentElement` — closes §11's "no page-level horizontal overflow at 320/390" row |

`FACT` — the class names are hash-suffixed (`body-uk.txt` shows `SimilarListingsView_row__RKk0t` and
`SimilarListingsView_card__nEGhc`, and the hash changes per build), so both lookups **must** be substring
attribute selectors: `.similar-listings [class*="SimilarListingsView_row"]` and, within it,
`[class*="SimilarListingsView_card"]`. A literal hashed class is not a valid selector here.

### 16.4d Fail-closed contract — and the one branch that must NOT fail

Hard-fail the cell (and the run, exit 1) on: a non-OK response · `NEXT_HTTP_ERROR_FALLBACK` present · `.similar-listings`
absent · the row node absent · a zero-area row bounding rect · `rowDisplay !== 'flex'` · `rowOverflowX` not one of
`auto`/`scroll` · `rowDisplay === 'grid'` at any width · `pageOverflows === true` at 320 or 390.

**`cardCount < 2` is NOT a failure.** The dev DB is sparse — review round 1 measured a live block with exactly one
card — and a single card cannot make the row overflow, so `rowOverflows === false` there is correct, not a defect.
Record `overflowAssertionApplicable: cardCount >= 2` per cell and skip the overflow judgement when it is false. A
probe that fails closed on valid sparse data is a broken probe; a probe that silently passes a *populated* row that
does not overflow is worse. Both arms must be implemented and both must be visible in the JSON.

`$slug` is an argument precisely because the kickoff's original slug is dead: `shitet-gazonjere-ne-pogradec-mtu8u1lg`
no longer resolves in this dev DB (measured in Revision 0). Use
`shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3`, which rendered cleanly in review round 1; if it 404s,
re-derive a live slug from `/uk/listings` and record which slug was used and why in the session log.

### 16.5 R13 [`P0`, closes F4] — one applier, not two

`FACT` — `similarity.ts:145` exports `applySimilarityEntries`, and `grep -rn "applySimilarityEntries" src/` returns
only its own definition, its own doc comment, and `similarity.test.ts`. **Production never calls it.** The Supabase
dispatch that actually runs is a second, byte-equivalent `switch (entry.op)` inside
`SimilarListings.tsx:buildSimilarityRungQuery`. R1 says "exactly two consumers render it"; there are three, and the
tested one is dead.

The entries themselves cannot drift — both consumers read the same `SimilarityEntry[]` — which is why this is `P2`
and not `P1`. What drifts is the **op dispatch**: a sixth member added to `SimilarityOp` lands in one switch,
silently no-ops in the other, and `similarity.test.ts` stays green. That is the exact class of defect D72-3 exists
to prevent.

**Required change.** In `buildSimilarityRungQuery`, delete the inline `switch` loop and call the shared applier:

- keep the core exactly where it is — `applyPublicVisibility(baseQuery() as any)`, then `.eq('property_type', …)`,
  `.eq('listing_type', …)`, `.neq('id', …)` — **outside** the ladder, per §10.2/D72-2. Do not move the core into
  `similarity.ts`; D72-2 is why it lives in the caller.
- replace the loop with `q = applySimilarityEntries(q, entriesForAttempt(entries, attempt))`, import
  `applySimilarityEntries` alongside the existing `similarity.ts` imports, and drop `entriesForAttempt` from the
  function body only if it becomes unused there.
- order is load-bearing: the core predicates are applied first, then the tier entries, exactly as today. The rung
  tests assert membership, not order, so preserve order by construction rather than by test.
- if the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above `let q: any` becomes an unused
  directive after the change, remove it — `npm run lint` must stay at **0 errors, 72 warnings** with neither
  touched file named.

**Because this rewrites the plant's target function, §16.9④ re-proves AC6.** That is not optional cleanup: an
untested production dispatch replaced by a tested shared one is only an improvement once the guard has been shown
to still fail closed on the new code.

### 16.6 R14 [`P0`, closes F6] — the header row adopts the site's section-header shape (**D72-6**)

#### 16.6a The conflict, and the owner's ruling

`FACT` — the two existing `ViewAllLink` section headers do not agree:

| Consumer | Composition | Below 40em |
|---|---|---|
| `FeaturedListingsView.tsx:54-58` + `.headerRow` in its CSS module | `justify="space-between" wrap="nowrap"` | **column**, `align-items: flex-start` |
| `page.tsx:57` ("Latest listings") | `Group justify="space-between" align="center" wrap="nowrap"` | row, no stacking |
| `SimilarListingsView.tsx:42` (Revision 0) | `Group gap="sm" wrap="wrap" align="center"` — **no `justify`**, so `flex-start` | row + wrap |

`FACT` — `justify="space-between"` is the one property both existing consumers share and Revision 0 omits. The live
RSC payload confirms the omission reached production: `--group-justify:flex-start` in `body-uk.txt`.

`CONFLICT — resolved.` The two consumers disagree on stacking, and the difference is visible exactly on §13's
mandatory `uk@320` cell, so it was not Sonnet's to guess. **Owner decision D72-6, 2026-09-09: the Featured shape —
the row stacks to a column below 640px, and becomes a space-between row at and above it.** Record D72-6 alongside
D72-1…D72-5; do not re-open it.

#### 16.6b Required change — Mantine props, not a copied CSS module

Replace `SimilarListingsView.tsx:42`'s `<Group gap="sm" wrap="wrap" align="center" mb="lg">` with:

```tsx
<Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} justify="space-between" gap="sm" mb="lg">
```

`Group` is swapped for `Flex` because `Group` has no responsive `direction`. Import `Flex` from `@mantine/core` and
drop `Group` from that import if it becomes unused.

`FACT` — this is the repo's own current mechanism for this exact problem, and it is why the fix is **not** a copied
CSS module. `MantinePageHeaderWithActions.tsx:55-66` documents the migration in-source: the nested
`styles={{ root: { '@media …' } }}` object *"was not emitted by Mantine"*, and it was replaced with
*"Flex's native `w`/`direction`/`align` responsive props, gated at `sm`"* — `align={{ base: 'stretch', sm: 'center' }}`
verbatim. `AuthSheet.tsx:518` uses the identical pair. `FeaturedListingsView.module.css`'s `.headerRow` is the
**older** CSS-module expression of the same intent (its own header comment says so); do not copy it into
`SimilarListingsView.module.css` and do not import it cross-component — §8 forbids that pattern, and duplicating a
visual contract into a feature-local module is the finding the canonical-first gate exists to raise.

`INFERENCE` — `stretch` and Featured's `flex-start` produce the same button at base width, because `ViewAllLink`
itself sets `w={{ base: '100%', sm: 'auto' }}` (`ViewAllLink.tsx:18`) and an explicit width overrides
`align-items`. `stretch` is chosen because it is the shipped `Flex` precedent, not because the two differ.

#### 16.6c Preserve

- `Title order={2} size="h4"` is unchanged — §3.3's `CONFLICT` resolved in favour of Task 792's sizing, and D72-6
  does not reopen it.
- `ViewAllLink` is consumed unmodified. No local button, no copied class chain, no `styles` override.
- `mb="lg"` and `gap="sm"` are unchanged.
- `SimilarListingsView.module.css` gains **no** header rule. The card row's `.row`/`.card` are untouched by R14.
- The conditional `{viewAllHref && viewAllLabel && …}` gate is unchanged — R4 still decides whether the control
  exists at all.

#### 16.6d Story and visual consequence

`FACT` — `Mantine/Primitives/SimilarListingsView` already covers this: `Default` renders 8 fixtures **with**
`viewAllHref`/`viewAllLabel`, `FewerThanEight` without. Both states re-render through the changed header
automatically. **No new story, no manifest change, no `check:story-coverage` delta** — the count stays 32/32.
§13's owner matrix rows are unchanged in wording but now describe the D72-6 shape; the mandatory `uk@320` header
row is the cell that ruled this decision and is the cell that confirms it.

### 16.7 R15 [`P3`] — the two review `NOTE`s

1. `similarity.test.ts:113` cites `SimilarListings.regression.test.ts`, a file that has never existed. The real
   files are `SimilarListings.visibility.test.ts` and `SimilarListings.ladder.test.ts`. Fix the comment to name
   them.
2. The session log's AC1 evidence line claims a grep finds "no second listing-field-to-URL-parameter mapping in
   `src/modules/listings/components/`". `ListingDetailView.tsx:410` builds
   `` `/${locale}/listings?location_id=${listing.location.id}` `` for the location breadcrumb. It is pre-existing,
   is not a similarity mapping, and is correctly out of scope — but the sentence as written is not what the grep
   shows. Restate it precisely: no second **similarity** field-to-parameter mapping, and name the breadcrumb as the
   one unrelated hit.

### 16.8 Acceptance criteria

- **AC11 [R11]** — Given `buildSimilarityEntries` called with `purchase_conditions: null` and again with
  `undefined`, then it returns without throwing and emits **no** `purchase_conditions` entry; given a non-empty
  array, the emitted entry is unchanged from Revision 0 (`op:'overlaps'`, `urlValue` the comma join). Asserted in
  `similarity.test.ts`, which grows from **16** to **18** cases. Additionally `src/types/database.ts` and
  `ListingDetailView.buildSimilarListingsHref.test.ts` are absent from `git status --porcelain`.
- **AC12 [R12]** — Given `node scripts/task803-similar-row-computed.mjs <slug> <runId>` against a running
  `npm run start`, then it exits 0 having written one JSON with exactly **5** cells (uk × 320/390/768/1024/1440),
  each carrying `rowDisplay: "flex"` and `rowOverflowX` in `auto`/`scroll`; the string `"grid"` appears in **no**
  `rowDisplay` field; `pageOverflows` is `false` at 320 and 390; and every cell carries
  `overflowAssertionApplicable` plus a `cardCount`. Quote the five `rowDisplay`/`rowOverflowX`/`cardFlexBasis`
  triples in the session log — one line per width. **That quotation is what closes AC7**; §13's owner matrix
  remains separately owed.
- **AC14 [R13]** — Given `grep -rn "applySimilarityEntries" src/`, then `SimilarListings.tsx` appears among the
  hits: the shared applier is called by production, not only by its own test. `buildSimilarityRungQuery` contains
  **no** `switch (entry.op)` and no `case 'overlaps'`. The core four (`applyPublicVisibility`, `property_type`,
  `listing_type`, `neq('id')`) are still applied in `buildSimilarityRungQuery`, outside the ladder — proven by
  `SimilarListings.visibility.test.ts` staying 6/6 **and** by the §16.9④ re-plant failing 4/6 and recovering 6/6
  against the rewritten function.
- **AC15 [R14]** — Given the rendered header, then it is a Mantine `Flex` with
  `direction={{ base: 'column', sm: 'row' }}`, `align={{ base: 'stretch', sm: 'center' }}` and
  `justify="space-between"`; `SimilarListingsView.module.css` contains **no** header rule; `FeaturedListingsView.module.css`
  is absent from `git status --porcelain`; and `check:story-coverage` still reports 32/32 with no manifest change.
  The D72-6 shape is confirmed by the owner on §13's `uk@320` row — it is not self-certified.
- **AC16 [R15]** — Given `grep -rn "SimilarListings.regression.test.ts" src/`, then there are **0** hits; and the
  session log's AC1 evidence line names the `ListingDetailView.tsx:410` breadcrumb as the one unrelated hit instead
  of claiming none exists.
- **AC13 [R11+R12+R13+R14]** — Given the §16.9 verification blocks, then every command exits as stated there,
  `npm run test` is back at exactly the Task 790 baseline (4 files / 5 tests), and `npm run build` exits 0.

### 16.9 Verification plan — Revision 1

Run block ① after the code change, block ② after the probe script exists. Retain every transcript under
`docs/sessions/evidence/task803/` with `EXIT_CODE=` written **inside** the file; the §13 transcript rule
(no `Tee-Object` — Windows PowerShell 5.1 writes UTF-16LE, which `check:file-integrity` rejects as NUL bytes) is
unchanged and still binds.

**① Code change:**

```powershell
node.exe -p process.platform
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd vitest run src/modules/listings/domain/__tests__/similarity.test.ts src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts src/modules/listings/components/__tests__/SimilarListings.ladder.test.ts
npx.cmd vitest run src/modules/listings/components/__tests__/ListingDetailView.buildSimilarListingsHref.test.ts
npm.cmd run test
npm.cmd run build
```

Expected: `win32` · `tsc` 0 errors · lint **0 errors, 72 warnings**, with neither `SimilarListings.tsx` nor
`similarity.ts` named · the three suites **31 passed** (18 + 6 + 7), with the two new null/undefined cases visible
by name in the list · `buildSimilarListingsHref` 3/3 · `npm run test` 4 files / 5 tests failed (Task 790 baseline,
name each) · `build` exit 0 with `ƒ /[locale]/listings/[slug]` present. Return each exit code read from inside its
retained transcript, and the similarity-suite test list.

**② Probe:**

```powershell
$slug = "shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3"
$runId = "task803-rev1"
$ev = "$PWD\docs\sessions\evidence\task803"
node.exe -p process.platform
Start-Process cmd.exe -ArgumentList "/c npm.cmd run start > `"$ev\start-rev1.txt`" 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 20
node.exe scripts\task803-similar-row-computed.mjs $slug $runId
Get-Content "$ev\runs\$runId\similar-row-computed.json"
Get-Content "$ev\start-rev1.txt"
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Expected: `win32` · the probe exits **0** · the JSON holds 5 cells, all `rowDisplay: "flex"`, no `"grid"`,
`pageOverflows: false` at 320/390 · `start-rev1.txt` contains no `⨯ Error`. Return the JSON in full.

**③ Two-armed proof that the probe can actually fail (`docs/qa-profiles.md` Q4: a gate claim needs a
planted-violation failure).** Temporarily add `display: grid;` to `.row` in `SimilarListingsView.module.css`, then:

```powershell
$slug = "shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3"
$ev = "$PWD\docs\sessions\evidence\task803"
npm.cmd run build
Start-Process cmd.exe -ArgumentList "/c npm.cmd run start > `"$ev\start-rev1-plant.txt`" 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 20
node.exe scripts\task803-similar-row-computed.mjs $slug task803-rev1-planted
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Expected: the probe exits **1**, naming `rowDisplay: "grid"` as the `failReason` on every cell. Then revert the CSS
line, prove the revert with `git hash-object src/modules/listings/components/SimilarListingsView.module.css` matching
its pre-plant value, re-run block ② into a fresh `runId`, and quote both outcomes. A probe whose failing arm was
never fired is not evidence that it measures anything.

**④ AC6 re-plant — mandatory, because R13 rewrites the plant's target function.** Change
`buildSimilarityRungQuery`'s `let q: any = applyPublicVisibility(baseQuery() as any)` to
`let q: any = baseQuery()`, then:

```powershell
$ev = "$PWD\docs\sessions\evidence\task803"
node.exe -p process.platform
& cmd.exe /c "npx.cmd vitest run src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts 2>&1" | Out-String -Stream | Set-Content -Encoding utf8 "$ev\ac6-rev1-planted-violation-FAIL.txt"
```

Revert the line, then:

```powershell
$ev = "$PWD\docs\sessions\evidence\task803"
& cmd.exe /c "npx.cmd vitest run src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts 2>&1" | Out-String -Stream | Set-Content -Encoding utf8 "$ev\ac6-rev1-reverted-PASS.txt"
git --no-optional-locks diff --stat src/modules/listings/components/SimilarListings.tsx
```

Expected: the first file shows `4 failed | 2 passed (6)` with the same `expected false to be true` on the
`status`/`active` assertion; the second `6 passed (6)`; and the `diff --stat` afterwards shows only the R11/R13
changes, no residue of the plant. Return both files. Mark the Revision 0 `ac6-planted-violation-FAIL.txt` /
`ac6-reverted-PASS.txt` `SUPERSEDED` in the session log — keep the files, they are the record for Revision 0's code.

### 16.10 Completion report — Revision 1 additions

On top of §14: the three R11 edits with before/after lines · the two new test case names and the 16→18 count ·
the `git diff` proof that `buildSimilarityRungQuery` has no hunk · the probe's full JSON · the five
`rowDisplay`/`rowOverflowX`/`cardFlexBasis` lines quoted per width · the §16.9③ planted/reverted probe outputs and
the `git hash-object` revert proof · the session-log validation table updated to mark `i-lint.txt` and
`i-full-test-suite.txt` `SUPERSEDED` and cite the owner's 22:38–22:44 runs · the F4 grep proof (`applySimilarityEntries` now hit in `SimilarListings.tsx`) and the §16.9④
planted/reverted AC6 pair · the header `Flex` before/after with the D72-6 citation · confirmation that
`FeaturedListingsView.module.css`, `page.tsx` and `filterEngine.ts` were **not** touched, and that F7's behavioural
half stayed with 804. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

### 16.11 Revision quality gate

| Question | Required answer |
|---|---|
| Can the guard be added in more than one place? | No — 16.3b fixes one normalisation site and 16.3c names every file that must not move. |
| Does the revision invalidate the frozen AC6 proof? | **Yes, deliberately** — R13 rewrites `buildSimilarityRungQuery`, so §16.9④ re-plants against the new body and the Revision 0 pair is marked `SUPERSEDED`, not reused. |
| Is D72-6 an owner decision or a task-authored one? | Owner, 2026-09-09, taken after §16.6a put both conflicting shipped shapes in front of him. The kickoff records the ruling; it does not make it. |
| Does R14 duplicate a visual contract into a feature-local module? | No — `Flex` responsive props, the mechanism `MantinePageHeaderWithActions.tsx:55-66` adopted for this exact Mantine limitation. §16.6c forbids the CSS-module copy and the cross-component import. |
| Does R13 move the core into the shared module? | No — D72-2 keeps `applyPublicVisibility` + the three core predicates in the caller, outside the ladder; only the tier dispatch is shared. |
| Can the probe pass without measuring anything? | No — 16.6③ requires a planted `display:grid` to make it exit 1, and the revert to be proven by `git hash-object`. |
| Does the probe fail on valid sparse data? | No — `cardCount < 2` sets `overflowAssertionApplicable:false`; 16.4d requires both arms in the JSON. |
| Does it invent a command, script convention or selector? | No — task775 is the cited convention, `playwright` is `package.json:158`, and the substring selectors are read from `body-uk.txt`. |
| Does it quietly close the open review? | No — §16.2 records that only F7's behavioural half (→ **804**) and the owner's own visual matrix remain outside this revision. |
| Is a new story required? | No — R11 is non-visible domain logic and R12 is a script. Neither creates nor changes a visible artifact, so the UI-hierarchy/story gate does not apply; §13's owner matrix still covers the visible change from Revision 0. |

## 17. Revision 2 — orchestrator-directed, 2026-09-10 (post-review of Revision 1)

**Re-entry mode: `remediation`. Documentation and evidence only — no product code, no test, no script changes.**
Origin: the implementation review of 2026-09-10, decision `NEEDS REVISION`, findings **F8** (`P2`), **F9**, **F10**,
**F11** (all `P3`). Strongest permitted result is still `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No
self-approval, no mutating Git.

### 17.1 Frozen — do not touch, do not re-run, do not re-capture

`FACT` — verified against the real diff in the 2026-09-10 review. Every one of these is **closed**:

| Closed | Status |
|---|---|
| **AC11 / R11** | `similarity.ts:39` widened, `:83` guarded once, `SimilarListings.tsx:30` widened, `similarity.test.ts` at 18 cases with both AC11 names, `database.ts` + `buildSimilarListingsHref.test.ts` absent from porcelain |
| **AC14 / R13** | `buildSimilarityRungQuery` calls `applySimilarityEntries`; no `switch (entry.op)`, no `case 'overlaps'`; core four still in the caller; §16.9④ re-plant 4 failed/2 passed → reverted 6/6 |
| **AC16 / R15** | 0 hits for `SimilarListings.regression.test.ts` in `src/`; AC1 line names `ListingDetailView.tsx:410` |
| **AC15 / R14 — code half** | `Flex direction={{base:'column',sm:'row'}} align={{base:'stretch',sm:'center'}} justify="space-between"`, `Group` dropped, no header rule in the CSS module, `check:story-coverage` 32/32, `FeaturedListingsView.module.css`/`page.tsx`/`filterEngine.ts` absent from porcelain |
| **AC7 — computed-style half** | closed by `runs/task803-rev2-clean` (see §17.3) |
| **AC13** | `rev1-tsc-final.txt` 0 · `rev1-similarity-suites-final.txt` 31/31 · `rev1-buildSimilarListingsHref.txt` 3/3 · `rev1-full-test-suite.txt` 4 files / 5 tests = the Task 790 baseline +2 · `rev1-build-final.txt` exit 0 with `ƒ /[locale]/listings/[slug]` |

**Every file under `src/` and `scripts/` is out of scope in Revision 2.** In particular
`scripts/task803-similar-row-computed.mjs` must stay at blob `cb42864ef632415aab7a6e77486f741cb3fc27a2`; if that
hash changes for any reason, both probe arms have to be re-fired and §17.3's evidence is void.

**The `OWNER VISUAL QA REQUIRED` matrix (§13) is unchanged and remains owed by the owner, not by Sonnet.** It is not
part of this revision and cannot be closed by it.

### 17.2 What the review found, in one paragraph

Revision 1's probe evidence was produced by **two different versions** of the probe script. `runs/task803-rev1` and
`runs/task803-rev1-planted` both record `probeHash: "28a109b5ea42de2c54bb6f3b61cb6bc417e27adc"`, and the planted
cells read `"failReason": "rowDisplay: grid; rowDisplay: grid"` — the *duplicated* form. The shipped script hashes to
`cb42864ef632415aab7a6e77486f741cb3fc27a2`, which appears only on `runs/task803-rev1-reverted`. The session log's
deviation bullet states the simplification was made *"before the planted-violation run was captured"*; the artifacts
disprove it, and `git cat-file -p 28a109b5…` returns `fatal: Not a valid object name`, so the version that produced
the only failing-arm evidence is unrecoverable. Under §16.9③ — *"A probe whose failing arm was never fired is not
evidence that it measures anything"* — the shipped probe had no fired failing arm. The owner re-fired both arms
natively on 2026-09-10; §17.3 is the record Sonnet must fold in. Nothing in the product code was implicated.

### 17.3 R16 [`P2`, closes F8] — the probe evidence record becomes true

`FACT` — owner-run in native Windows PowerShell, 2026-09-10 05:41–05:47 UTC, `node.exe -p process.platform` →
`win32`, from `C:\Claude_Code_Projects\lero-al`. Results, all read from the retained artifacts:

| Artifact | Result |
|---|---|
| `git hash-object scripts\task803-similar-row-computed.mjs` | `cb42864ef632415aab7a6e77486f741cb3fc27a2` (before and unchanged throughout) |
| `git hash-object` of `SimilarListingsView.module.css` | `5486641b37c23c9297835f1ff2bad8a80fbf8461` before the plant **and** after the revert — identical |
| `runs/task803-rev2-planted/similar-row-computed.json` | `probeHash cb42864e…`, `capturedAt 2026-09-10T05:44:29.832Z`, 5 cells all `"rowDisplay": "grid"` with `"failReason": "rowDisplay: grid"` (single, not duplicated); `PLANTED_EXIT_CODE=1` |
| `runs/task803-rev2-clean/similar-row-computed.json` | `probeHash cb42864e…`, `capturedAt 2026-09-10T05:46:04.306Z`, 5 cells `"rowDisplay": "flex"` / `"rowOverflowX": "auto"`, no `"grid"`, `pageOverflows:false` at 320 and 390, `overflowAssertionApplicable:false` with `cardCount:1`; `CLEAN_EXIT_CODE=0` |
| `start-rev2-plant.txt` / `start-rev2-clean.txt` | 0 occurrences of `⨯ Error` |
| `npm run check:file-integrity` / `check:mojibake` | 66 files clean · 0 artifacts in 4033 files |
| `gitCommit` on both runs | `e67a4bbc63bdbe3b0aab165f2c128ab01e019336` |

**Required edits — session log only, no re-runs:**

1. Mark `runs/task803-rev1` and `runs/task803-rev1-planted` **`SUPERSEDED`** in the R12 section and the validation
   table. **Keep the directories** — they are the record for probe blob `28a109b5…`. `runs/task803-rev1-reverted`
   stays valid but is superseded as the *cited* clean arm by `task803-rev2-clean`, which pairs with a fired failing
   arm from the same blob.
2. Cite `runs/task803-rev2-planted` + `runs/task803-rev2-clean` as **the** two-armed proof, attributed to the owner's
   2026-09-10 native run — do not write it as Sonnet's own.
3. Replace the R12 `failReason` quotation with the artifact's verbatim string, and quote the rev2 planted string
   verbatim as well.
4. Rewrite the first *Deviations and limitations — Revision 1* bullet. It must state that the fail-reason
   simplification landed **after** `task803-rev1-planted` was captured — evidenced by that run's `probeHash`
   `28a109b5…` and its duplicated `failReason` — that the pre-simplification blob is unrecoverable
   (`git cat-file -p 28a109b5…` → `fatal: Not a valid object name`), and that this is why the arms were re-fired.
   Do not soften it to a wording change; the previous bullet asserted the opposite of the artifact.
5. Add the CSS `git hash-object` before/after identity (`5486641b…`) to the R12 evidence.

### 17.4 R17 [`P3`, closes F9] — the final lint artifact, and its encoding

`FACT` — `rev1-lint.txt` was captured 2026-09-09 21:11:31 UTC; `SimilarListings.tsx`'s final write is 21:19:58 UTC
(the §16.9④ plant/revert pair). `tsc`, the three suites and `build` were all re-taken after that write; lint was not.

`FACT` — the owner's 2026-09-10 re-run wrote `docs/sessions/evidence/task803/rev2-lint.txt`:
`72 problems (0 errors, 72 warnings)`, `EXIT_CODE=0`, neither `SimilarListings.tsx` nor `similarity.ts` named.

`FACT` — that file's eslint summary glyph is stored as `Ô£û`, i.e. `✖` (U+2716, UTF-8 `E2 9C 96`) decoded through
the console OEM code page. Cause: PowerShell decodes a native command's stdout with `[Console]::OutputEncoding`,
which is not UTF-8 by default. `check:mojibake` does not currently flag this sequence, so the file passes the gate
while still being wrong.

**Required:** re-capture the transcript with the console encoding set first (§17.8 block), then cite `rev2-lint.txt`
as the final lint artifact in the validation table and mark `rev1-lint.txt` **`SUPERSEDED`** with the timestamp
reason above. Do not "fix" any of the 72 warnings — the expected result is unchanged: **0 errors, 72 warnings**.

### 17.5 R18 [`P3`, closes F10] — the `Files Changed` table matches the worktree

`FACT` — `git --no-optional-locks status --short` currently carries fourteen entries; the session log's
`Files Changed` table lists nine. Missing: `scripts/task803-similar-row-computed.mjs` (new in Revision 1) and
`docs/sessions/2026-09-09-task803-similar-listings-block-and-shared-similarity-predicate.md` (the log itself).

**Required:** add both rows with their reason, and reconcile the table against a fresh `git status --short` so that
every path appears exactly once. `docs/sessions/evidence/task803/` is an evidence directory, not a source artifact —
name it once in the table as the evidence root rather than enumerating its files.

### 17.6 R19 [`P3`, closes F11] — the owner-authored gate transcript

`FACT` — `i-check-listing-visibility.txt` is the **owner's** Revision 0 transcript for the
`docs/critical-flow-registry.md:70` gate. Revision 1 rewrote it in place at 21:26:40 UTC to strip CP1252 mojibake and
retained no pre-image, so "content otherwise byte-identical" cannot be checked by a reviewer.

**Required:** re-run the gate natively into a new transcript (§17.8 block) and cite it alongside the owner's file.
Do not delete, rename or further edit `i-check-listing-visibility.txt`. Record in the session log that the
Revision 1 in-place re-encode had no retained pre-image and that the new transcript is what closes the gate for
review purposes.

### 17.7 Acceptance criteria

- **AC17 [R16]** — Given the session log's R12 section and validation table, then `runs/task803-rev1` and
  `runs/task803-rev1-planted` are both labelled `SUPERSEDED`, `runs/task803-rev2-planted` and
  `runs/task803-rev2-clean` are cited as the two-armed proof with their `probeHash cb42864e…` stated, the quoted
  `failReason` strings are verbatim from the JSON, and the deviation bullet states the simplification landed
  **after** the rev1 planted capture. Given `git status --porcelain`, then no file under `src/` or `scripts/`
  differs from its state at the start of Revision 2, and
  `git hash-object scripts/task803-similar-row-computed.mjs` still returns `cb42864ef632415aab7a6e77486f741cb3fc27a2`.
- **AC18 [R17]** — Given `rev2-lint.txt` after the §17.8 re-capture, then it contains the literal `✖` (not `Ô£û`),
  reports **0 errors, 72 warnings**, carries `EXIT_CODE=0` inside the file, names neither touched file, and is cited
  in the validation table with `rev1-lint.txt` marked `SUPERSEDED`.
- **AC19 [R18]** — Given the session log's `Files Changed` table and `git --no-optional-locks status --short`, then
  every status path is represented exactly once, including `scripts/task803-similar-row-computed.mjs`, the session
  log itself, and `docs/sessions/evidence/task803/` as the evidence root.
- **AC20 [R19]** — Given `rev2-check-listing-visibility.txt`, then the gate PASSES with 0 violations and 0 stale
  allowlist entries, `EXIT_CODE=0` is inside the file, and the session log records both it and the fact that the
  Revision 1 re-encode of the owner's transcript kept no pre-image.
- **AC21 [R16+R17+R18+R19]** — Given the §17.8 block, then `npm run build` exits 0 with
  `ƒ /[locale]/listings/[slug]` present in `rev2-build.txt`, and `check:file-integrity` / `check:mojibake` both exit
  0 **after** every new transcript has been written. `docs/backlog.md` stays at or below **80** physical lines
  (it is **79** now) and its Task 803 state is updated to Revision 2.

### 17.8 Verification plan — Revision 2

Run this once, after the session-log edits. `[Console]::OutputEncoding` is set first — that is what fixes AC18.

```powershell
$ev = "$PWD\docs\sessions\evidence\task803"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
git --no-optional-locks hash-object scripts\task803-similar-row-computed.mjs
$lint = & cmd.exe /c "npm.cmd run lint 2>&1"
$lint += "EXIT_CODE=$LASTEXITCODE"
[System.IO.File]::WriteAllLines("$ev\rev2-lint.txt", $lint, $utf8)
$vis = & cmd.exe /c "npm.cmd run check:listing-visibility 2>&1"
$vis += "EXIT_CODE=$LASTEXITCODE"
[System.IO.File]::WriteAllLines("$ev\rev2-check-listing-visibility.txt", $vis, $utf8)
$build = & cmd.exe /c "npm.cmd run build 2>&1"
$build += "EXIT_CODE=$LASTEXITCODE"
[System.IO.File]::WriteAllLines("$ev\rev2-build.txt", $build, $utf8)
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks status --short
(Get-Content docs\backlog.md).Count
```

Expected, per command: `win32` · the probe hash is still `cb42864ef632415aab7a6e77486f741cb3fc27a2` · `rev2-lint.txt`
shows `✖ 72 problems (0 errors, 72 warnings)` and `EXIT_CODE=0` · `rev2-check-listing-visibility.txt` shows the gate
PASSED, 0 violations, 0 stale allowlist entries, `EXIT_CODE=0` · `rev2-build.txt` contains `✓ Compiled successfully`
and `ƒ /[locale]/listings/[slug]`, `EXIT_CODE=0` · both hygiene gates exit 0 · `git status --short` shows no `src/`
or `scripts/` path that was not already modified before Revision 2 began · the backlog line count is `≤ 80`.
Return each exit code read from **inside** its transcript, the lint summary line, the visibility gate's verdict line,
the build's route line, the full `git status --short`, and the line count.

The §13 transcript rule still binds: no `Tee-Object`, `EXIT_CODE=` written inside each file, everything retained
under `docs/sessions/evidence/task803/`.

### 17.9 Completion report — Revision 2 additions

On top of §14 and §16.10: the before/after text of the corrected deviation bullet · the exact `SUPERSEDED` labels
added and where · the two rev2 probe artifacts cited with their `probeHash` · `rev2-lint.txt`'s summary line with the
`✖` glyph intact · the visibility gate verdict · the reconciled `Files Changed` table against the fresh
`git status --short` · the backlog line count before and after, taken from `git show HEAD:docs/backlog.md | wc -l`
for the baseline, never from the post-edit file · confirmation that no `src/` or `scripts/` path was touched and that
the probe blob is unchanged. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`.

### 17.10 Revision quality gate

| Question | Required answer |
|---|---|
| Does Revision 2 change product behaviour? | No — session log, backlog and new transcripts only. §17.1 freezes `src/` and `scripts/` entirely. |
| Can Sonnet close F8 by re-running the probe itself? | It does not need to: the owner already fired both arms with the shipped blob on 2026-09-10. Sonnet records that evidence; re-running would create a third pair and a new supersession problem. |
| Is the probe script allowed to change? | No. If its `git hash-object` moves off `cb42864e…`, §17.3's evidence is void and both arms must be re-fired before any completion report. |
| Why re-capture a lint result that already passed? | The stored glyph is mojibake and the artifact is the record a reviewer reads. The *result* is not in question and must not change: 0 errors, 72 warnings. |
| Does this revision close the owner visual matrix? | No. §13 is unchanged, still owed by the owner, and AC15's visual half stays open independently of Revision 2. |
| Does it re-open anything frozen in §16.1 or §17.1? | No. No frozen transcript is re-run, and no closed AC is re-verified. |
| Is any owner exception invented here? | No. The only owner input is the 2026-09-10 native run quoted in §17.3, whose artifacts are on disk. |
