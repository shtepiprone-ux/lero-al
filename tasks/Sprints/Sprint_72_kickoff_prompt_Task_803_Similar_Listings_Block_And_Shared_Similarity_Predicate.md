# Task 803 — the similar-listings block becomes a real entry point into search

**Sprint:** 72 · **Priority:** P2 · **QA profile:** **Q4** · **Filed:** 2026-09-09 · **State:** `KICKOFF FILED`

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
| **R7** | The card row uses the horizontal-scroll/grid switch, reusing the §3.4 contract; the `.similar-listings` wrapper, the `data-testid` set and the speculation-rules script (first 2 URLs, `Save-Data` skip) are preserved verbatim. | P0 | AC7 |
| **R8** | `listing_type` reaches the container as a new prop and narrows the query. A rental is never shown as similar to a sale listing. | P0 | AC8 |
| **R9** | The canonical story `Mantine/Primitives/SimilarListingsView` is **extended** (not replaced) to cover: 8 items with the view-all control, fewer than 8 without it, and the empty branch. It keeps its static import of the real component and its manifest entry. | P0 | AC9 |
| **R10** | No new i18n string, no new theme value, token, `design-tokens-allow` marker or allowlist entry; `check:design-tokens --strict --scope=mantine` stays 0. | P1 | AC10 |

## 5. Assumptions and open questions

- **`OWNER DECISION — stated default, reversible.`** The owner asked for "8 listings with horizontal scroll". Two
  readings: scroll at every width, or the project's existing scroll-below-`sm`/grid-above contract (§3.4). **Default
  taken: reuse the existing contract**, because it is an established in-repo pattern and eight cards in a 4-column
  grid is two clean rows on desktop. If the owner wants a true carousel at all widths, that is a one-file change to
  the CSS module and a re-review, not a redesign.
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

### 10.4 Layout (R7)

New `SimilarListingsView.module.css`, modelled on §3.4's file. Do not import `RecentlyViewedGridView.module.css`
across components and do not edit it. Breakpoint literals in `em`, matching `theme.ts`; spacing and card width
composed from `var(--mantine-*)`; no bare numeric literal (D71-4).

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
  exactly the first 2 of the **rendered** URLs and is absent under `Save-Data: on`, and the card row is
  `display:flex; overflow-x:auto` below `40em` and `display:grid` at/above it.
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
| Similar-listings block | 8 cards + view-all control | uk, sq | 320, 390, 768, 1024, 1440 |
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
| Can it start before 792 is reviewed? | No — stated in the header and in the sprint's precondition 1. |
