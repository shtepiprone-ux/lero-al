# Kickoff — Task 665: Storybook listing/grid story cleanup via Container/Presentational View splits (zero mocks)

> Saved implementation kickoff. A fresh Sonnet session must execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** Storybook governance + production Container/Presentational refactor (current Mantine path) + dead-code
  deletion. Replaces divergent story-only card stand-ins with truthful stories that statically import **real
  production presentation Views**, extracted as genuine production splits. No visual redesign; production render stays
  byte-identical.
- **Hard constraint (owner, 2026-07-23):** **NO hook mocks, network mocks, or Storybook module aliases** — forbidden by
  `docs/component-rules.md` §Container/Presentational Primitive Split. Honesty comes from a real production View split,
  not from mocking. Fixtures may supply **data** (`CardListingData`) and a fixed `AuthContext.Provider` value only.
- **No Container→View→Container cycle (owner patch):** a View must never import its container. Skeletons
  (`CardSkeleton`/`RowSkeleton`), currently declared in the container files, move **into the View** (or a pure
  presentation module the View owns); the View renders the loading branch itself. `SimilarListingsView` takes its
  heading as a **`heading: string` prop** (no `useTranslations`), because its container is a server component.

## 2. Objective

The listing/grid Storybook cluster is polluted with a fake card (`StoryListingCard`, a shadcn re-implementation of the
real `ListingCard`) and an unused generic grid (`MantineCardGrid`). Fix it by:

1. Extracting a **production-used presentational View** from each data/auth-bearing container
   (`FeaturedListingsView`, `LatestListingsView`, `RecentlyViewedGridView`, `SimilarListingsView`); the container keeps
   its hooks/queries and **really renders** the View (byte-identical production output).
2. Rebuilding each story to **statically import the exact View**, feeding fixed `CardListingData` fixtures and — where
   favorite state is exercised — a fixed `AuthContext.Provider` (the `Mantine/Primitives/ListingCard` story pattern),
   never `AuthProvider`, never a mock.
3. Deleting the dead/fake surfaces: `System/ListingGrid` story, `StoryListingCard` (UI), and the entire
   `MantineCardGrid` cluster incl. current doc mentions.

## 3. Verified context (inspected 2026-07-23; re-verify where noted)

### 3.1 The fake-card cluster

- `src/stories/StoryListingCard.tsx` — a **story-only fake `ListingCard`** built on legacy shadcn
  (`@/components/ui/badge`, `@/components/ui/button`); exports `StoryListingCard` (UI) + `makeStoryListings` (data,
  from `src/stories/fixtures/listing.fixture.ts`) + `StoryCardData` (story-specific shape ≠ `CardListingData`).
- **Real importers** of `StoryListingCard`/`makeStoryListings` (all story-only): `stories/FeaturedListings.stories.tsx`,
  `stories/LatestListings.stories.tsx`, `stories/ListingGrid.stories.tsx`, `stories/SimilarListings.stories.tsx`,
  `stories/RecentlyViewedSection.stories.tsx`.
- **Comment-only references** (not render-importers, but must also be cleared to reach `rg`=0): `src/app/globals.css:228`
  (`/* StoryListingCard uses same pattern … Task 406 */`) and `src/stories/mantine/primitives/PopularLocationsView.stories.tsx:22`
  (a comment mentioning `StoryListingCard.tsx`'s fixture). (Re-confirm the full set with `rg "StoryListingCard" src`
  before deleting — see R8.)

### 3.2 The real containers (what to split)

- `src/modules/listings/components/FeaturedListings.tsx` — `'use client'`; calls `useFeaturedListings()` (returns
  `{ listings: CardListingData[], loading }`), `useExchangeRate()`, `useAuth()`; computes
  `displayCurrency = user?.preferred_currency ?? 'ALL'` and `favSet`. Renders a header (`Title` + `ViewAllLink` when
  `!loading && listings.length>0`), a loading branch (`CardSkeleton` grid), an empty branch (`Text`), and the loaded
  grid of `ListingCard`. `CardSkeleton` is currently declared+exported **in this container file** — it must **move into
  `FeaturedListingsView`** (or a pure presentation module the View owns) so the View renders the loading branch without
  importing the container (cycle-free). Grid classes are Tailwind
  (`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4`) — **preserve verbatim** (de-Tailwinding the
  grid is a SEPARATE future task, explicitly out of scope here).
- `src/modules/listings/components/LatestListings.tsx` — same shape; no internal header (its heading lives in
  `page.tsx`); loading→`RowSkeleton` grid, empty→`Text`, loaded→grid. `RowSkeleton` (currently in this container file)
  moves into `LatestListingsView` (cycle-free, same as `CardSkeleton`). Grid `grid-cols-1 md:grid-cols-2 2xl:grid-cols-3
  gap-3` — preserve verbatim.
- `src/modules/listings/components/RecentlyViewedGrid.tsx` — `'use client'`; already takes `listings: CardListingData[]`
  but **internally** calls `useExchangeRate()` + `useAuth()` to derive `rates`/`displayCurrency`, uses `useTranslations`,
  renders header row (title + `clearSlot`) + grid + `ListingCard`. Split the auth/exchange hooks into the container.
- `src/modules/listings/components/SimilarListings.tsx` — **server component** (`getTranslations`/`getLocale` server,
  `next/headers`, supabase server, `getUser`, `getExchangeRates`). Renders `<div className="similar-listings"><h2/>
  <div className="grid …">{ListingCard…}</div>` + a `speculationrules` `<script>` (uses `Save-Data` header). The grid
  + card render is pure presentation; the query/headers/speculation stay server-side. Because the container is a **server
  component**, `SimilarListingsView` takes a `heading: string` prop (the container passes
  `getTranslations('listing')('similar_listings')`); the View does **not** call `useTranslations`. Renders on the
  listing-detail route via `ListingDetailView` (`.similar-listings`).

### 3.3 The truthful-story pattern (template — do not deviate)

`src/stories/mantine/primitives/ListingCard.stories.tsx` statically imports the REAL `ListingCard` and, because
`ListingCard`→`FavoriteButton` calls `useAuth()`, wraps with the **exported `AuthContext.Provider`** supplying a fixed
`User` fixture + `ExchangeRates` (`FIXTURE_RATES`/`FIXTURE_USER`) — explicitly NOT `AuthProvider` (which mounts a live
Supabase controller, forbidden in stories). Reuse this exact mechanism and its `CardListingData` fixtures.

### 3.4 The dead grid

`MantineCardGrid` (`src/design-system/mantine/patterns/MantineCardGrid.tsx`) has **zero production consumers** (only the
barrel `patterns/index.ts`, its own story `stories/patterns/mantine/CardGrid.stories.tsx`, and a comment at
`src/design-system/mantine/theme.ts:708`). Not in `scripts/mantine-migration-scope.json`. Delete atomically. Also
remove current mentions in `docs/mantine-responsive-design-system.md`. **Do NOT edit historical `docs/sessions/*` logs.**

### 3.5 Titles / manifest decision (binding)

The extracted Views are page-section composites, not primitives/patterns. Their stories keep `System/*` titles.
Therefore: **do NOT add the Views to `scripts/mantine-migration-scope.json`**, and **do NOT claim `--mantine-only`
coverage** for them (structurally, `--mantine-only` only runs `Mantine/Primitives/*` + `Patterns/Mantine/*`). Rendered
proof for these `System/*` stories comes from the full `screenshots:assert` run (not `--mantine-only`).

### 3.6 Critical-flow scan

`docs/critical-flow-registry.md` (auth/RLS/moderation/reporting/payment) is not touched. Profile Q3 (production UI
refactor of homepage/listing-detail surfaces + Storybook governance), not Q4.

## 4. Requirements (ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | `FeaturedListingsView` extracted (props `listings, loading, rates, displayCurrency, favoriteIds, locale`); `FeaturedListings` keeps its hooks and renders the View; production render byte-identical. | P0 | Diff + byte-identical route parity | Confirmed |
| R2 | Owner | `LatestListingsView` extracted (props `listings, loading, rates, displayCurrency, favoriteIds`); container renders it; byte-identical. | P0 | Diff + parity | Confirmed |
| R3 | Owner | `RecentlyViewedGridView` extracted as a pure View (props `listings, rates, displayCurrency, showEmptyState, clearSlot`); `RecentlyViewedGrid` keeps `useAuth`/`useExchangeRate` and renders the View; byte-identical. | P0 | Diff + parity | Confirmed |
| R4 | Owner | `SimilarListingsView` extracted (props `heading: string, listings, rates, displayCurrency`); it does NOT call `useTranslations` — the server `SimilarListings` passes `getTranslations('listing')('similar_listings')` and keeps supabase/headers/query/speculation and renders the View; byte-identical. | P0 | Diff + parity | Confirmed |
| R4a | Owner (patch) | No Container→View→Container cycle: each `*View` (and any presentation module it uses for skeletons) imports **no** container; `CardSkeleton`/`RowSkeleton` live in the View/presentation module. | P0 | `rg` import graph; `tsc` | Confirmed |
| R5 | Owner | Stories `System/FeaturedListings`, `System/LatestListings`, `System/RecentlyViewedSection`, `System/SimilarListings` rebuilt to statically import the exact View, using fixed `CardListingData` fixtures and (for favorite state) a fixed `AuthContext.Provider` (never `AuthProvider`/mock). Default state renders the representative loaded grid — not only Loading/Empty. | P0 | Story source + rendered proof | Confirmed |
| R6 | Owner | A fixed `CardListingData[]` fixture supplies the stories (adapt `listing.fixture`/reuse the `ListingCard` story fixtures; verify `CardListingData` compatibility). No new story-only UI, no `StoryCardData`-shaped UI card. | P0 | Fixture typed `CardListingData`; `tsc` | Confirmed |
| R7 | Owner | `System/ListingGrid` story deleted. | P0 | File removed; `rg` | Confirmed |
| R8 | Owner | `StoryListingCard` (UI) deleted **only after** `rg "StoryListingCard" src` returns **0** — including the comment-only references at `src/app/globals.css:228` and `src/stories/mantine/primitives/PopularLocationsView.stories.tsx:22`, which this task also removes/updates. The reusable `CardListingData` data fixture is retained/adapted. | P0 | `rg "StoryListingCard" src` → 0 transcript + diff | Confirmed |
| R9 | Owner | `MantineCardGrid` cluster deleted atomically: `MantineCardGrid.tsx`, `CardGrid.stories.tsx`, barrel exports in `patterns/index.ts`, the `theme.ts:708` comment, and current mentions in `docs/mantine-responsive-design-system.md`. Historical `docs/sessions/*` untouched. | P0 | `rg "MantineCardGrid"` → only session logs remain | Confirmed |
| R10 | 3.5 | New Views are NOT added to `mantine-migration-scope.json`; no `--mantine-only` coverage claim. | P1 | Manifest diff empty for Views | Confirmed |
| R11 | P0.9 | `npx tsc --noEmit` clean; `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R12 | qa-profiles Q3 | Rendered proof: full `screenshots:assert` PASS (0 FAIL) for the 4 rebuilt System stories; `check:story-coverage`/`check:stories` pass; byte-identical route-parity per §13.7 captured as a **pre-code-change baseline** vs after, with the exact `{FIXED_SLUG}`, test-user session, seeded `rv_listings` ids, and frozen/cleaned DB state recorded in the session log. If the baseline cannot be captured → `PARTIALLY IMPLEMENTED` + native command (no fixture/stand-in fallback). | P0 | manifests + baseline/after parity + session-log record | Confirmed |

## 5. Assumptions and open questions

- **A1:** `useTranslations` (next-intl) is allowed inside the **client** Views (`FeaturedListingsView`,
  `LatestListingsView`, `RecentlyViewedGridView`) — globally provided in production and Storybook
  (`.storybook/preview.tsx` `NextIntlClientProvider`), and neither an auth nor a data/network hook. **Exception (owner
  patch): `SimilarListingsView` must NOT call `useTranslations`** — its container is a server component, so it receives
  `heading: string` as a prop (§3.2/R4). Only `useAuth`/`useExchangeRate`/`use*Listings` move to the container.
- **A2:** `CardSkeleton`/`RowSkeleton` are **moved out of the container files into the View / a pure presentation
  module** (owner patch — cycle-free); the View owns the loading branch. The rebuilt stories import the skeleton from
  the View/presentation module, never from a container.
- **A3:** `favoriteIds`/favorite state is exercised via the fixed `AuthContext.Provider` fixture only where a story
  needs the signed-in favorite state; guest state needs no provider (default context is null-safe).
- **OQ1 (non-blocking):** de-Tailwinding the grid/skeleton classes is a SEPARATE future task; preserve them verbatim here.

## 6. Pre-read rule bundle (exact)

1. `docs/agent-contract.md` (P0 scope §1, build gate §9, clause 16c canonical-Story).
2. `docs/component-rules.md` → **§Container/Presentational Primitive Split** (the rule mandating this approach; no mocks).
3. `docs/storybook-governance.md` §14–§15 (rendered proof, coverage, no story-only stand-ins).
4. `docs/qa-profiles.md` (Q3).
5. `src/stories/mantine/primitives/ListingCard.stories.tsx` (the `AuthContext.Provider` + `CardListingData` fixture template).
6. This kickoff; re-verify §3.1 importer list with `rg` before any deletion.

## 7. Scope

- Extract 4 production Views (§3.2) into the same module folders as their containers; containers render them.
- Rebuild 4 `System/*` stories on the Views (§3.3 pattern).
- Add/adapt a fixed `CardListingData[]` fixture (reuse the `ListingCard` story fixtures / `listing.fixture`).
- Delete `System/ListingGrid` story; delete `StoryListingCard` UI after `rg`=0; delete the `MantineCardGrid` cluster +
  its current doc mentions.
- Update `docs/backlog.md` + add session log.

## 8. Out of scope

- Any visual redesign or de-Tailwinding of grid/skeleton/hero classes (separate task, OQ1).
- Any change to `ListingCard`/`MantineListingCardPattern` or their stories (KEEP).
- Any hook/network mock, Storybook module alias, or `AuthProvider` in a story; any `STORYBOOK-SKIP`/exempt-list entry.
- Historical `docs/sessions/*` edits.
- Adding Views to the migration manifest (R10).

## 9. Current and required behavior

**Current:** `System/FeaturedListings`/`LatestListings`/`RecentlyViewedSection`/`SimilarListings`/`ListingGrid`
`Default` states render `StoryListingCard` (a shadcn fake) — divergent stand-ins; `MantineCardGrid` is unused dead code.

**Required (after):** each of the four surfaces renders its **real production View** in Storybook (fixed
`CardListingData` fixtures + fixed `AuthContext.Provider` where needed); production output of each container is
byte-identical (container → View split only); `ListingGrid`, `StoryListingCard`, and the `MantineCardGrid` cluster are
gone; no mocks/aliases introduced.

## 10. Implementation requirements

1. **View extraction (production split, byte-identical, cycle-free):** move each container's JSX return into a new
   sibling `*View.tsx` presentational component receiving the ready props listed in R1–R4; the container computes those
   from its hooks and renders `<*View … />`. Preserve every class/prop verbatim (this is a mechanism split, not a
   restyle). **No View imports its container** — `CardSkeleton`/`RowSkeleton` move into the View (or a pure presentation
   module the View owns), and the container no longer declares them. `SimilarListingsView` receives
   `heading: string, listings, rates, displayCurrency` and does **not** call `useTranslations` (the server container
   passes `getTranslations('listing')('similar_listings')`); the `speculationrules` script and all
   supabase/headers/query stay in the server container.
2. **Story rebuild:** each story `import`s the exact `*View` from its production path (static import), renders it with a
   fixed `CardListingData[]` fixture; wrap in `<AuthContext.Provider value={fixtureUser}>` only where favorite state is
   shown (mirror `ListingCard.stories.tsx`). Keep `System/*` titles. Keep truthful `Loading`/`Empty` states by passing
   `loading:true` / `listings:[]` to the same View (no separate fake markup).
3. **Fixture:** provide a fixed `CardListingData[]` (locale-aware as the current stories are). Verify field
   compatibility against `CardListingData` (`extends ListingSnapshot`); if `listing.fixture` lacks fields, adapt the
   **data fixture** only — never reintroduce a UI stand-in.
4. **Deletions:** `System/ListingGrid` story; remove the comment-only `StoryListingCard` references at
   `src/app/globals.css:228` and `src/stories/mantine/primitives/PopularLocationsView.stories.tsx:22`; then
   `rg "StoryListingCard" src` must return **0** → delete `StoryListingCard` (UI) and any now-unused
   `StoryCardData`/`makeStoryListings` UI glue (retain the data fixture the rebuilt stories consume); then the
   `MantineCardGrid` cluster per R9. Run `rg "MantineCardGrid"` and confirm only historical `docs/sessions/*` mentions
   remain.
5. No new generic grid, no story-only UI component, no mock, no module alias.

## 11. Positive and negative flows

**Positive flow:** Storybook renders each rebuilt `System/*` story showing the real View with fixture data; the
homepage/listing-detail/recently-viewed production routes render byte-identical to before (container→View split).

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Validation / RLS / offline / concurrent | No | No data-path/auth logic changed | N/A | — |
| Production render changed by the split | Yes (preserve) | R1–R4 | Byte-identical route render | computed-style/DOM parity |
| Favorite (signed-in) state in a story | Yes | R5 | Fixed `AuthContext.Provider` renders real `FavoriteButton` | story source + render |
| `StoryListingCard` still imported somewhere | Yes | R8 | Do NOT delete until `rg`=0 | `rg` transcript |
| `MantineCardGrid` referenced outside session logs | Yes | R9 | Remove all current refs incl. docs | `rg` transcript |

## 12. Acceptance criteria

- **AC1 [R1–R4,R4a]** Each container renders its extracted View (no View imports a container); production route output
  is byte-identical before/after per the **§13.7 route-parity matrix** (exact URLs/selectors/locales/viewports/data
  source) — zero computed-style/DOM diffs.
- **AC2 [R5]** Each rebuilt `System/*` story statically imports the exact `*View`, renders a representative loaded
  Default (not only Loading/Empty), and uses a fixed `AuthContext.Provider` (not `AuthProvider`, not a mock) where
  favorite state appears.
- **AC3 [R6]** The stories' fixtures are typed `CardListingData`; no `StoryListingCard`/`StoryCardData` UI remains in
  any story.
- **AC4 [R7,R8]** `System/ListingGrid` is deleted; `rg "StoryListingCard" src` returns **0** (incl. the removed
  `globals.css:228` and `PopularLocationsView.stories.tsx:22` comments) and the UI component is deleted (data fixture
  retained).
- **AC5 [R9]** `rg "MantineCardGrid"` returns only historical `docs/sessions/*` matches; the component, story, barrel
  exports, `theme.ts:708` comment, and `docs/mantine-responsive-design-system.md` mentions are gone.
- **AC6 [R10]** `scripts/mantine-migration-scope.json` has no new View entries; no `--mantine-only` coverage claimed.
- **AC7 [R11]** `npx tsc --noEmit` clean; `npm run build` exit 0.
- **AC8 [R12]** Full `npm run screenshots:assert` PASS (0 FAIL) incl. the 4 rebuilt System stories; `check:story-coverage`
  and `check:stories` pass; a **pre-code-change baseline** and matching after-capture produce zero route-parity diffs
  across §13.7 (both Recently-viewed modes), with `{FIXED_SLUG}` / test-user session / seeded `rv_listings` / DB
  freeze+teardown recorded in the session log. Baseline unobtainable → `PARTIALLY IMPLEMENTED` (never a confidence claim).

## 13. QA profile and verification plan

**Profile: Q3 Full Visual Matrix** (production UI refactor of homepage/listing-detail surfaces + Storybook governance;
byte-identical mechanism split). Plan (repo-known commands only):

1. `rg "StoryListingCard"` and `rg "MantineCardGrid"` before/after — record importer counts (R8/R9 gates).
2. `npx tsc --noEmit` → 0.
3. `npm run check:story-coverage` → exit 0 (manifest unchanged; MantineCardGrid removal is coverage-safe — not enrolled).
4. `npm run check:stories` → 0 violations.
5. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include transcript).
6. `npm run screenshots:assert` (full, NOT `--mantine-only` — the rebuilt stories are `System/*`) → PASS, 0 FAIL; the
   4 rebuilt stories render the real Views; deleted stories absent.
7. **Byte-identical production route-parity** for each View split. **Mandatory baseline BEFORE the first line of code
   changes:** with a frozen local/test DB and the fixed cookies/sessions below, capture `getComputedStyle` + DOM
   (element count/order/classes, `grid-template-columns`, `gap`, padding/margin, background) for the exact selector at
   every cell of the matrix from the **current working tree**. After the View splits, re-capture identically and diff.
   Any non-zero diff blocks approval. There is **no fixture/stand-in fallback** — if the baseline cannot be captured
   (no local/test DB, routes unreachable in the sandbox), route-parity **cannot be claimed**: return
   `PARTIALLY IMPLEMENTED` and provide the exact owner-native command to run the baseline+after capture. Concrete matrix:

   | Surface | URL (per locale) | Selector | Locales | Viewports | Fixed deterministic state |
   |---|---|---|---|---|---|
   | Featured grid | `/{locale}` | `.featured-listings` (+ its `ListingCard` children) | sq · en · uk · it | 375 · 768 · 1440 · 1536 · 1920 | guest (no auth); frozen local/test DB with a fixed published-featured row set |
   | Latest grid | `/{locale}` | `.latest-listings` | sq · en · uk · it | 375 · 768 · 1440 · 1536 · 1920 | guest; same frozen DB |
   | Similar grid | `/{locale}/listings/{FIXED_SLUG}` | `.similar-listings` | sq · en · uk · it | 375 · 768 · 1440 · 1536 · 1920 | guest; `{FIXED_SLUG}` = one fixed published listing with ≥3 similar rows in the frozen DB |
   | Recently-viewed — **listing-detail** | `/{locale}/listings/{FIXED_SLUG}` | `.recently-viewed` | sq · en · uk · it | 375 · 768 · 1440 · 1536 · 1920 | **guest** + fixed `rv_listings` cookie holding valid published IDs from the frozen DB, **excluding** `{FIXED_SLUG}` |
   | Recently-viewed — **cabinet** | `/{locale}/cabinet` | `.recently-viewed` | sq · en · uk · it | 375 · 768 · 1440 · 1536 · 1920 | **fixed test-user session** (NOT a guest cookie — `/cabinet` redirects guests to login) + deterministic `recently_viewed` rows seeded for that user |

   All test data (frozen DB rows, `rv_listings` cookie, test-user session + its `recently_viewed` rows) must be
   **local/test-only** and **torn down after capture**. Record in the session log, explicitly: the exact `{FIXED_SLUG}`,
   the test-user identity/session, the seeded `rv_listings` id list, and how the DB state was frozen/seeded/cleaned up —
   "same DB session" is **not** sufficient evidence of determinism.
8. `check:file-integrity`/`check:mojibake` on touched files.

If a required gate cannot run (sandbox/native), record it with the exact native command and return `PARTIALLY
IMPLEMENTED`/`BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

Session log (`docs/sessions/2026-07-23-task665-*.md`) + `docs/backlog.md`: changed-files table = real diff; R1–R12 each
with evidence; the `rg` importer transcripts (StoryListingCard→0, MantineCardGrid→session-logs-only); every command with
actual result/exit code (tsc, story-coverage, stories, build, full screenshots:assert); the **pre-code-change baseline
vs after** route-parity table for all §13.7 cells (incl. both Recently-viewed modes) plus the recorded determinism
inputs (`{FIXED_SLUG}`, test-user session, seeded `rv_listings` ids, DB freeze/seed/teardown); assumptions/deviations/
limitations; AC1–AC8 self-audit. Status `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`/`PARTIALLY IMPLEMENTED`/`BLOCKED`. No self-approval. No mutating git.

## 15. Task quality gate (orchestrator self-check — all pass)

- Fresh Sonnet can execute without chat context — yes (each container, its hooks, the View props, the story template,
  the fixture source, and the deletion `rg` gates are inlined).
- Every primary requirement has ≥1 binary AC + verification — yes (R1–R12 → AC1–AC8 + §13).
- Scope protects existing behavior / names what must not change — yes (§8: no restyle/de-Tailwind, KEEP card stories,
  no mocks/aliases/AuthProvider, no session-log edits, no manifest additions).
- No-mock / no-alias constraint is explicit and central — yes (§1, §10, AC2), per `component-rules.md` split rule.
- Deletions are ordered and gated by `rg`-zero-importers — yes (§10.4, R8/R9).
- Canonical-Story honesty: stories statically import the real production View (clause 16c spirit) — yes; titles/manifest
  decision explicit (R10, §3.5).
- Negative flows by applicability — yes (§11).
- No uninspected claim — the four containers, the fake card, the dead grid, and the story template were inspected
  2026-07-23; the only delegated verification (exact `CardListingData` field adaptation) is bounded to a data fixture.
- Assumptions/open questions visible — yes (§5).

---

**Task path:** `tasks/kickoff_prompt_Task_665_Storybook_Listing_Story_Cleanup_View_Splits.md`
**QA profile:** Q3 Full Visual Matrix.
**Ambiguous/conflicting requirements:** none blocking. A1 (useTranslations-in-View) is a labeled reversible assumption.
**Owner decision still needed:** none — the no-mock View-split approach, the four Views, the deletions, and the
`System/*` title / no-manifest decision are all owner-directed inputs recorded here.

---

## 16. Post-review revision (orchestrator reviews 2026-07-24, owner-directed) — R13, R14, and corrections

This section **supersedes** the §13.7 Featured/Latest selector rows, the R12/AC8 wording, and adds R13–R14. Static
View-split (R1–R11) is verified healthy. The first pass returned `NEEDS REVISION` (broken governance gate). The second
pass found that R13-as-first-written only removes a symptom and that R12/AC8/§13.7 assert unverifiable/false conditions.
All of the following must land before Task 665 can be approved.

### 16.1 §13.7 selector correction (route-parity locators must exist in the LOADED state)

`.featured-listings` and `.latest-listings` exist **only in the loading branch** (`FeaturedListingsView.tsx:57`,
`LatestListingsView.tsx:43`); the **loaded** grids that route-parity actually captures carry no such class
(`FeaturedListingsView.tsx:76`, `LatestListingsView.tsx:56`). The §13.7 Featured/Latest rows therefore target
selectors that are absent in the captured state. Fix, **without adding any `data-*` attribute to production DOM** (these classes are byte-stable before/after the split).

**Do NOT use a raw CSS selector for the grids.** The Tailwind classes include digit-leading tokens (`2xl:grid-cols-4`),
so `document.querySelector('div.grid.…\.2xl\:grid-cols-4…')` throws `SyntaxError: Invalid selector` (a CSS identifier
cannot begin with a digit). Use a single JS `classList.contains` locator predicate, identical for baseline and after:

```js
// Featured (/{locale}) — inside the Featured MantineHomeSection (page.tsx:42)
const featured = Array.from(document.querySelectorAll('div.grid')).find(
  (el) =>
    ['grid-cols-1', 'sm:grid-cols-2', 'xl:grid-cols-3', '2xl:grid-cols-4', 'gap-4']
      .every((className) => el.classList.contains(className)) &&
    el.querySelector('.listing-card'),
)

// Latest (/{locale}) — inside the Latest MantineHomeSection (page.tsx:47)
const latest = Array.from(document.querySelectorAll('div.grid')).find(
  (el) =>
    ['grid-cols-1', 'md:grid-cols-2', '2xl:grid-cols-3', 'gap-3']
      .every((className) => el.classList.contains(className)) &&
    el.querySelector('.listing-card'),
)
```

`.similar-listings` and `.recently-viewed` remain valid raw selectors (the container wrapper / View render both preserve
them pre/post). `.listing-card` (`ListingCard.tsx:201/297`) is production-stable and untouched by this task.

### 16.2 R13 (P0) — re-point ListingGrid screenshot-governance coverage, do NOT just delete it

`npm run governance:screenshots` (`responsive-screenshots.mjs --check`) currently **exits 1**
(`❌ story files missing`, `responsive-screenshots.mjs:159` still requires the deleted `ListingGrid.stories.tsx`).

| Sub | Observable requirement | Verification |
|---|---|---|
| R13.1 | Re-point the 4-column responsive-grid proof at the surviving `System/FeaturedListings/Default` — preserve equivalent viewport/locale coverage incl. the `uk` stress cell and `huge-2560`; do not drop coverage. | Target-list diff |
| R13.2 | `responsive-screenshots.mjs`: replace the 4 `system-listinggrid--*` capture entries (~99–102) **and** the `ListingGrid.stories.tsx` existence guard (~159, → `FeaturedListings.stories.tsx`). **All four replacement entries use the identical story ID `system-featuredlistings--default`** — only their `label`, `viewports`, and `locales` differ (this story has a single `Default` export; no other IDs exist — do not invent `system-featuredlistings--desktop/--mobile/…`). | Source diff + `storybook-static/index.json` |
| R13.3 | `governance/component-catalog.mjs`: in `SCREENSHOT_TARGETS` (~132) use the token the generator derives from the **story filename** — `FeaturedListings` (NOT `FeaturedListingsView`) — and update the generated matrix/prose rows (~442/460/463/465). | Source diff |
| R13.4 | `governance/tailwind-entropy.allowlist.json:198`: remove or re-point the entry citing the deleted `ListingGrid.stories.tsx`. | Source diff |
| R13.5 | Regenerate the catalog: `npm run catalog:components` (`--write`), then confirm the **expected, reviewed** diff in `docs/component-coverage-matrix.md` (ListingGrid rows replaced by FeaturedListings). `governance:components --check` alone is insufficient — it verifies infra presence, not matrix sync. | Regen diff + `git diff docs/component-coverage-matrix.md` |
| R13.6 | Update every **current** governance/matrix/inventory doc still naming ListingGrid a live screenshot target: `docs/responsive-screenshot-matrix.md`, `docs/responsive-storybook-inventory.md`, `docs/storybook-governance.md`, `docs/component-coverage-matrix.md`, `docs/governance-enforcement.md`, `docs/responsive-screenshot-governance.md`, `docs/maintenance-playbook.md`. **Never edit** `docs/sessions/*`, `docs/governance-reports/*`, `docs/chat-gpt-reports/*` (immutable history). | `grep -rl "ListingGrid" docs/` → only history + this kickoff |
| R13.7 | Prove the re-point actually captures, not just that a file exists: fresh `npm run build-storybook`; assert `system-featuredlistings--default` is present in `storybook-static/index.json`; run the real capture and confirm the critical `uk` and `huge-2560` output files are produced. | `index.json` grep + capture output listing |
| R13.8 | `npm run governance:screenshots` exits **0**; `npm run governance:components` exits **0**. | Transcripts with exit codes |

### 16.3 R14 (P0) — the three rebuilt stories are not actually rendered-proven

R12/AC8 claim `screenshots:assert` covers all four rebuilt stories. It does not: `check-stories-rendered.mjs`
`ASSERT_STORIES` registers only `system-recentlyviewedsection--populated` (~line 166); **Featured, Latest, and
Similar are absent**, so those three currently have **no** rendered-proof.

| Sub | Observable requirement | Verification |
|---|---|---|
| R14.1 | Add real `ASSERT_STORIES` entries for `system-featuredlistings--default`, `system-latestlistings--default`, `system-similarlistings--default`, each anchored on a selector present in the story's loaded render — `{ type: 'selector', value: '.listing-card' }` (confirm the exact generated IDs from `storybook-static/index.json`). | Source diff + `index.json` |
| R14.2 | Re-run full `npm run screenshots:assert`; the three newly-registered cells resolve (found + anchor matched), 0 FAIL among them. | Assert manifest |

### 16.4 AC8 correction (baseline is 219, not 0)

AC8 simultaneously asserting an "0 FAIL" run and a "219 pre-existing baseline" is contradictory and unsatisfiable.
Restate: the owner-approved regression baseline is **219 historical FAIL** (per Task 663/664). AC8 passes when the
full `screenshots:assert` run shows **0 NEW FAIL vs the 219 baseline** AND **0 FAIL among the newly-registered
Featured/Latest/Similar cells (R14) and the RVS cell**. No claim of an absolute zero-FAIL run.

### 16.5 Sequencing and scope

R13 + R14 + §16.1/§16.4 are in-repo executor work (Sonnet) and land first. The AC1/AC8 route-parity baseline
(session log §10, using the §16.1-corrected locators) remains an owner-native step run after R13/R14 are approved.
Task 665 is not `APPROVED` until all clear. Still out of scope: any restyle/de-Tailwind, editing historical logs,
adding Views to the migration manifest.
