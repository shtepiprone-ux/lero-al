# Task 792 — detail-route chrome leaves Tailwind, and the status banner stops sending users nowhere

**Sprint:** 71 · **Priority:** P2 · **QA profile:** **Q2** · **Filed:** 2026-09-09 · **State:** `KICKOFF FILED`

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger**.

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **de-Tailwind migration onto existing canonical Mantine primitives +
one owner-reported behavioural fix + first canonical stories for four unproven components.**

It is not a pure chrome migration. R5 changes where a link goes; scope it deliberately.

## 2. Objective

Five artifacts on `/[locale]/listings/[slug]` still carry raw Tailwind and two still import legacy shadcn
primitives. Migrate them onto the canonical Mantine primitives that already exist, give them the standalone
Storybook proof they have never had, and fix the status banner's "similar listings" link, which today scrolls a user
down the same dead listing instead of taking them anywhere.

## 3. Verified context — measured 2026-09-09, do not re-derive from a document

### 3.1 The five artifacts

| File | ln | `className=` | Boundary | Legacy import |
|---|---:|---:|---|---|
| `src/modules/listings/components/ListingBackButton.tsx` | 44 | 2 | `'use client'` | `@/components/ui/button` |
| `src/modules/listings/components/ListingStatusBanner.tsx` | 45 | 5 | **Server Component** | — |
| `src/app/[locale]/listings/[slug]/loading.tsx` | 73 | 30 | route file, server | `@/components/ui/skeleton` |
| `src/modules/listings/components/SimilarListingsView.tsx` | 30 | 2 | server | — |
| `src/modules/listings/components/RecentlyViewedGridView.tsx` | 67 | 8 | `'use client'` | — |

⚠️ **`ListingStatusBanner.tsx` has no `'use client'`.** It is the exact file class that took `lero.al` down on
2026-09-04 (Task 784, `FooterView.tsx`). **Do not add a hook to it.** For theme values in a Server Component use the
direct `import { theme } from '@/design-system/mantine/theme'`, the pattern `PopularLocationsView.tsx` uses and
documents. Task **786**'s detector does not exist yet, so nothing in the repo will catch a violation — AC8's live
request is the only control (**D71-1**).

### 3.2 The behavioural defect — and what it actually is

`ListingStatusBanner.tsx:36-38`:

```tsx
<a href="#similar-listings" className="text-xs underline …">{similarLabel}</a>
```

`FACT`, and it corrects the backlog's own wording: **the anchor target exists.**
`ListingDetailView.tsx:347` renders `<Box id="similar-listings">{similarListingsSlot}</Box>`, **unconditionally** —
it is not gated on status. So the link is not broken; it is *semantically wrong*. A user on a sold, rented, expired,
archived, pending or inactive listing clicks "see similar listings" and is scrolled further down the same dead page.

**Required behaviour (owner, 2026-09-06):** navigate to `/{locale}/listings` pre-filtered from the current listing.

`FACT` — the canonical query params, read from `src/modules/listings/domain/filterEngine.ts:181-183`
(⚠️ the path recorded in `docs/backlog-reserved.md` and the Sprint 71 row is `…/lib/filterEngine.ts`, which **does
not exist**; the file is under `domain/`):

```
listingType:  validEnum(sp, 'type',           VALID_LISTING_TYPES)
propertyType: validEnum(sp, 'property_type',  VALID_PROPERTY_TYPES)
locationId:   n('location_id')
```

So the URL param for listing type is **`type`**, not `listing_type`. `:243-245` confirms each maps to a Supabase
`.eq()` on `listing_type` / `property_type` / `location_id`.

`FACT` — **no new data plumbing is needed.** The banner is rendered at `ListingDetailView.tsx:411-416`, and the same
component passes `propertyType={listing.property_type}` and `locationId={listing.location?.id ?? null}` to
`SimilarListings` at `:466-467`. Both fields, plus `listing.listing_type`, are already in scope at the banner call
site. Compute the href there and pass it as a prop; do not thread new props through the route.

### 3.3 The canonical primitives already exist

| Needed by | Canonical primitive | Canonical story (inspected) |
|---|---|---|
| status banner | Mantine `Alert` | `src/stories/mantine/primitives/Alert.stories.tsx` → `Mantine/Primitives/Alert`, imports `Alert` from `@mantine/core` with `lucide-react` icons incl. `Info` |
| `loading.tsx` | Mantine `Skeleton` | `src/stories/mantine/primitives/Skeleton.stories.tsx` → `Mantine/Primitives/Skeleton` |
| back button | Mantine `Button` | `src/stories/mantine/primitives/Button.stories.tsx` → `Mantine/Primitives/Button` |

`FACT` — Mantine `Skeleton` is already consumed in `src/` (6 import sites) and has theme chrome at
`src/design-system/mantine/skeleton-chrome.css`. This is `reuse`, not a new primitive.

`FACT` — `@/components/ui/skeleton` has **three** consumers repo-wide: `src/app/[locale]/favorites/loading.tsx`,
this route's `loading.tsx`, and `src/stories/AdminLayout.stories.tsx`. 792 removes **one**. It is the last consumer
*on this route*, not repo-wide — do not delete the legacy primitive.

### 3.4 ⚠️ None of the four components has any Storybook proof

`FACT` — `ListingBackButton`, `ListingStatusBanner`, `SimilarListingsView` and `RecentlyViewedGridView` each return
**0** matches in `scripts/mantine-migration-scope.json` and have **no** `*.stories.tsx`. A grep for
`StatusBanner|statusBanner` across `src/stories/` and the listings stories returns nothing — so
`ListingDetailView.stories.tsx` does not render the banner either. This is the same class Task **800** filed: the
story shares the component but not the state.

The story-first gate therefore **binds**: these are changed visible artifacts with no standalone contract. The
existing `Alert`/`Skeleton`/`Button` stories prove the *primitives*, not these production components, so `reuse` is
not available for the components themselves.

### 3.5 ⚠️ Storybook's viewport switcher is broken — review on the live route

`FACT` — Task **799** (P1, open, unowned) records that the Storybook toolbar viewport control has never resized the
preview. Measured again for this kickoff: `.storybook/main.ts:16` registers `addons: ['@storybook/addon-docs']`
only, while `.storybook/preview.tsx:203-204` sets `parameters.viewport.options = VIEWPORTS`. Whether Storybook 10
needs a separate viewport addon is `UNKNOWN` here and is 799's to settle — what matters for 792 is that **the owner
cannot resize the Storybook preview**.

Consequence for this task, and it is a scoping decision, not a workaround: **§13's owner visual matrix runs against
the live `next start` route in the browser's responsive mode**, not the Storybook toolbar. That is also the only
place `loading.tsx` and the six banner statuses can be seen in their real context. The new stories are still
required by §3.4 — they are the standalone contract and the regression surface — but they are not the owner's
viewport review instrument for this task.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | `ListingBackButton` renders on Mantine `Button`; `@/components/ui/button` is no longer imported by it; its two raw Tailwind class strings are gone. | P0 | AC1 |
| **R2** | `ListingStatusBanner` renders on Mantine `Alert`; the six-status `STYLES` record no longer carries Tailwind class strings; each status keeps its current semantic colour provenance (`--status-info`, `--status-rented`, `--status-warning`, muted/border) — no new token, no invented value. | P0 | AC2 |
| **R3** | `loading.tsx` renders on Mantine `Skeleton`; `@/components/ui/skeleton` is not imported by it; the skeleton geometry still mirrors the real gallery grid and page grid so no layout shift is introduced. | P0 | AC3 |
| **R4** | `SimilarListingsView` and `RecentlyViewedGridView` carry no raw Tailwind dimension/layout utility; their `.similar-listings` / `.recently-viewed` semantic markers, `data-testid` attributes and the horizontal-scroll-to-grid switch are preserved verbatim. | P0 | AC4 |
| **R5** | The status banner's "similar listings" control navigates to `/{locale}/listings` pre-filtered by the current listing's `type`, `property_type` and `location_id`; omitted values are absent from the query string rather than empty. The `#similar-listings` in-page anchor is gone. | P0 | AC5 |
| **R6** | Each of the four components has a canonical Storybook story that statically imports the real component and covers its changed states — the banner all **six** statuses, `RecentlyViewedGridView` both its empty and populated branches — and is registered in `scripts/mantine-migration-scope.json` with `check:story-coverage` passing. | P0 | AC6 |
| **R7** | No hook is added to `ListingStatusBanner.tsx`, `loading.tsx`, or any other file lacking `'use client'`. | P0 | AC7 |
| **R8** | The route still renders: `/sq/listings/<slug>` and `/uk/listings/<slug>` return 200 with the detail body present, against a real `next start`. | P0 | AC8 |
| **R9** | No new theme value, breakpoint, token, `design-tokens-allow` marker or allowlist entry; `check:design-tokens --scope=mantine` stays 0 and the global finding set is unchanged. | P0 | AC9 |

## 5. Assumptions and open questions

- **Assumption (reversible, stated):** the banner receives the pre-filtered href as a **prop** computed at its call
  site, keeping it a data-free presentational Server Component. If the executor finds a reason the href must be
  built inside the banner, that is a deviation to report, not to decide silently.
- **Assumption:** `SimilarListingsView`'s `<h2>` and `RecentlyViewedGridView`'s `<h2>` become Mantine `Title`/`Text`
  with existing theme sizing. If no existing contract supplies the current `text-xl font-bold` weight/size pair,
  **stop and report `CANONICAL STYLE DECISION REQUIRED`** — do not invent a local value (**D71-4**).
- **`OWNER DECISION — non-blocking.`** With the banner linking out to a filtered search, the `<Box id="similar-listings">`
  wrapper at `ListingDetailView.tsx:347` has no remaining in-page referrer. Leave it in place; whether to remove it
  is the owner's call at review, not the executor's.
- **`UNKNOWN`** — whether Storybook 10 needs a separate viewport addon (§3.5). Owned by Task 799, out of scope here.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` · `docs/ai-behavior.md` Notes 18–23 · `docs/rule-index.md` →
**Current Mantine path**: `docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md`,
`docs/component-rules.md`, `docs/ui-rules.md` (routing and legacy boundary notes only), `docs/qa-rules.md` ·
`docs/qa-profiles.md` · `docs/storybook-governance.md` · `docs/design-system.md` (§22 tokens) · `docs/backlog.md` ·
this sprint's plan file for **D71-1 … D71-4**.

## 7. Scope

The five files in §3.1; the banner's call site in `ListingDetailView.tsx` (href computation only); four new
canonical stories plus their `scripts/mantine-migration-scope.json` entries; `docs/component-catalog.md` rows for
the four components; `docs/backlog.md` state and the session log.

## 8. Out of scope

`MantineListingDetailPattern`, `MantineListingContactPattern`, `MantineListingGalleryPattern` and everything Tasks
791/793 already migrated · the gallery and lightbox (**794**) · the three legacy dialogs (**795**) · the form family
(**796**) · `@/components/ui/skeleton` itself and its two other consumers · `SimilarListings.tsx`'s server container,
its speculation-rules script and the `.similar-listings` wrapper · Storybook's viewport wiring (**799**) · the
story-fixture view-model problem (**800**) · the responsive-object detector blind spot (**797**) · Leaflet chrome
(**798**) · any change to `filterEngine.ts`.

## 9. Current and required behavior

**Before:** the back button is a shadcn `Button` with four raw utilities; the status banner is a `div` with a
six-entry Tailwind class record and an in-page anchor that scrolls the reader down a dead listing; the route's
Suspense shell is 30 Tailwind classes over a legacy `Skeleton`; two section views carry raw grid and heading
utilities. None of the four has ever been rendered in Storybook.

**After:** all five render on canonical Mantine primitives with their semantic markers, test ids and responsive
behaviour byte-preserved; the banner's control is a real link into a pre-filtered search; each component has a
standalone story covering its real states, registered and gate-proven.

## 10. Implementation requirements

1. Migrate in the order **back button → banner → section views → `loading.tsx`**, creating each component's story
   before or with its migration (story-first gate, `create-task/SKILL.md` → "UI hierarchy").
2. The banner's colour provenance is a preservation problem, not a design problem: each of the six statuses already
   names its token in-file (`:14-23`), including the deliberate `--status-warning` reuse for `pending`/`inactive`
   recorded in its own comment. Carry those tokens across; do not re-pick colours.
3. `loading.tsx`'s geometry exists to prevent layout shift — its comment at `:28-31` records that the grid mirrors
   `ListingGallery` exactly. Preserve the `--listing-gallery-h-*` heights and the `grid-cols-4 grid-rows-2` shape.
4. `RecentlyViewedGridView`'s `:58` switch (horizontal scroll below `sm`, grid above) is behaviour. Preserve it.
5. Do not introduce a `useMediaQuery` where a Mantine responsive prop or `visibleFrom`/`hiddenFrom` expresses the
   same thing, and never in a Server Component.

## 11. Positive and negative flows

**Positive flow:** open a sold listing → the banner renders in its status colour → its control navigates to
`/{locale}/listings?type=…&property_type=…&location_id=…` → that page shows the pre-filtered results.

| Branch | Applicable? | Expected | Why |
|---|---:|---|---|
| Missing/absent input | **Yes** | A listing with no `location_id` (or no `property_type`) omits that param entirely; the link still resolves to a valid filtered search | `listing.location?.id ?? null` at `:467` proves the field is nullable |
| Locale expansion | **Yes** | Banner message and link label wrap without clipping at 320 in `uk`; the href carries the active locale | Q2 makes `uk@320` mandatory |
| Small viewport | **Yes** | Banner, back button and both section views hold at 320/390 with no horizontal overflow | R4's scroll/grid switch is width-dependent |
| Server-Component hook | **Yes** | No hook reaches `ListingStatusBanner.tsx` or `loading.tsx` | §3.1; the Task 784 outage class, with no detector until 786 |
| Authorization / RLS | No | — | No route, action or policy touched |
| Concurrent writer | No | — | No data model touched |
| Repeated execution | No | — | Idempotent presentational change |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `ListingBackButton.tsx`, when the migration is complete, then it imports no
  `@/components/ui/*`, contains no raw Tailwind utility string, and its rendered control keeps its current label,
  icon and `handleBack` behaviour (`returnUrl` from `sessionStorage`, else `/{locale}/listings`).
- **AC2 [R2]** — Given `ListingStatusBanner.tsx`, then it renders a Mantine `Alert`, carries no Tailwind class
  string, and each of the six statuses resolves to the same semantic token it names today. Quote the before/after
  for each of the six.
- **AC3 [R3]** — Given `loading.tsx`, then `@/components/ui/skeleton` is not imported, every placeholder is a
  Mantine `Skeleton`, and the gallery block still consumes `--listing-gallery-h-mobile/tablet/desktop` in a
  `grid-cols-4 grid-rows-2` shape.
- **AC4 [R4]** — Given both section views, then `grep -c 'className='` returns only module-CSS or semantic-marker
  references; `.similar-listings`, `.recently-viewed` and `data-testid="recently-viewed-section"` are present
  unchanged; the `<sm` horizontal scroll and `≥sm` grid both render.
- **AC5 [R5]** — Given a listing whose `listing_type`, `property_type` and `location_id` are known, when the banner's
  control is activated, then the browser navigates to `/{locale}/listings` carrying exactly those three params under
  the names `type`, `property_type`, `location_id`; and `grep -c '#similar-listings' src/modules/listings/components/ListingStatusBanner.tsx`
  returns **0**. Assert the built href in a test, not by eye.
- **AC6 [R6]** — Given `npm run check:story-coverage`, then every newly registered component is covered, the count
  rises by exactly four from its pre-change value, and each story statically imports the real component. State the
  before and after counts.
- **AC7 [R7]** — Given `grep -n "'use client'"` and a `use[A-Z]` scan across the five files, then every file that
  calls a hook carries the directive and `ListingStatusBanner.tsx` / `loading.tsx` call none.
- **AC8 [R8]** — Given `npm run build` exit 0 **and** `npm run start`, when `/sq/listings/$slug` and
  `/uk/listings/$slug` are requested, then both return 200 with the detail body present. A green build alone does
  **not** satisfy this (**D71-1**).
- **AC9 [R9]** — Given `node scripts/check-design-tokens.mjs --strict --scope=mantine`, then 0 violations and 0 stale
  markers; and the unscoped finding set is diffed against the most recent retained baseline log under
  `docs/sessions/evidence/`, differing only by findings inside the five changed files, each named.

## 13. QA profile and verification plan

**Profile: `Q2 Standard UI`**, as recorded in the Sprint 71 Tasks table and re-checked against the actual scope:
these five artifacts consume existing canonical primitives (`Alert`, `Skeleton`, `Button`) and create no primitive,
overlay, table strategy or page shell. `docs/qa-profiles.md` requires for Q2: `Q1` plus rendered checks at minimum
`320`, `390`, `768`, `1024` and one desktop width, with **`uk@320` mandatory**, all four locales at `320` and the
desktop width. **Escalate to Q3 and stop** if the migration turns out to require a new primitive or a page-shell
change.

```powershell
$slug = "11-mr7ucly4"
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npx.cmd vitest run src/modules/listings
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run start
Invoke-WebRequest "http://localhost:3000/sq/listings/$slug" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest "http://localhost:3000/uk/listings/$slug" -UseBasicParsing | Select-Object StatusCode
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32`; every gate exit 0 except `check:design-tokens` unscoped, which exits 1 on its pre-existing
baseline only; `check:story-coverage` up by exactly four; both requests `StatusCode 200`. Return each command's real
exit code read from inside its retained transcript. Replace `$slug` with a real listing slug from the seeded
database if that one does not resolve.

**Transcript rule.** Do not pipe a native command through `Tee-Object` — in Windows PowerShell 5.1 it writes
UTF-16LE, which `check:file-integrity` rejects as NUL bytes and `check:mojibake` reads as U+FFFD. Capture with
`& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, and append
`EXIT_CODE=$LASTEXITCODE` **inside** the file. Retain everything under `docs/sessions/evidence/task792/`.

**`OWNER VISUAL QA REQUIRED`** — on the **live route**, not the Storybook toolbar (§3.5, Task 799):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Status banner | sold · rented · expired · archived · pending · inactive | uk, sq | 320, 390, 1024 |
| Status banner link | any non-active status — click it and confirm the filtered results page | uk | 390 |
| Back button + section views | active listing | uk, sq, en, it | 320 |
| Back button + section views | active listing | all four | 1440 |
| `loading.tsx` | navigate to a listing and watch the Suspense shell | en | 390, 1024 |

## 14. Completion report contract

Files changed · requirement IDs completed · the six-status before/after colour table (AC2) · the built href for a
listing with all three fields and for one with a null `location_id` (AC5) · `check:story-coverage` before/after
counts (AC6) · commands run with real exit codes and transcript paths · the two request results (AC8) · the
design-tokens diff against its named baseline (AC9) · assumptions · deviations · known limitations · anything left
open. Status: `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Can a hook reach a Server Component? | No — R7/AC7 names both server files, and §3.1 carries the Task 784 precedent with its named replacement pattern |
| Can this pass while the route is broken? | No — AC8 requires two real requests, per **D71-1**; 791's own review was fooled by a 200 plus a title, so AC8 asks for the body |
| Does the fix invent the filter params? | No — read from `filterEngine.ts:181-183`, and the kickoff corrects the `lib/` path the plan records |
| Is the anchor claim accurate? | Yes — the target exists at `ListingDetailView.tsx:347`; the defect is semantic, and §3.2 says so instead of repeating "dead link" |
| Does the story-first gate apply? | Yes — §3.4 measures zero stories and zero manifest entries for all four; R6 makes them a deliverable |
| Is the owner's visual review actually performable? | Yes — §3.5 moves it to the live route because Task 799 makes the Storybook viewport switcher unusable |
| Does it invent a colour? | No — R2 carries the six tokens the file already names; a missing heading contract stops the task instead |
