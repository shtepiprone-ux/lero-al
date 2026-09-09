# Task 792 — Detail-route chrome and the dead "similar listings" link

**Task path:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_792_Detail_Route_Chrome_And_The_Dead_Similar_Listings_Link.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC1 [R1] | `ListingBackButton` on Mantine `Button`, no `@/components/ui/*`, no Tailwind class string, `handleBack`/`returnUrl`/label/icon preserved | `src/modules/listings/components/ListingBackButton.tsx` — `import { Button } from '@mantine/core'`; `handleBack`, `sessionStorage.getItem(RESTORE_KEY)`, `router.push` unchanged; `leftSection={<ArrowLeft size={theme.other!.iconSize!.badge} />}` | ✅ |
| AC2 [R2] | `ListingStatusBanner` on Mantine `Alert`, no Tailwind class string, six statuses keep semantic colour provenance | See §5 six-status before/after table below | ✅ |
| AC3 [R3] | `loading.tsx`: no `@/components/ui/skeleton`, every placeholder Mantine `Skeleton`, gallery block keeps `--listing-gallery-h-*` in `grid-cols-4 grid-rows-2` | `src/app/[locale]/listings/[slug]/loading.tsx` — `import { Skeleton } from '@mantine/core'`; gallery `<div className="grid grid-cols-4 grid-rows-2 gap-2 h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] …">` byte-unchanged | ✅ |
| AC4 [R4] | Both section views: `grep -c 'className='` returns only module-CSS/marker refs; `.similar-listings`/`.recently-viewed`/`data-testid` preserved; scroll↔grid switch renders | See §6 | ✅ |
| AC5 [R5] | Banner control navigates to `/{locale}/listings?type=…&property_type=…&location_id=…`; omitted values absent; `#similar-listings` gone | `ListingDetailView.tsx` `buildSimilarListingsHref()`; `grep -c '#similar-listings' ListingStatusBanner.tsx` = 0 (verified below) | ✅ |
| AC6 [R6] | 4 new canonical stories, banner all 6 statuses, `RecentlyViewedGridView` both branches, registered + `check:story-coverage` passing | 4 new files under `src/stories/mantine/primitives/`; manifest 28→32; `check:story-coverage` PASSED, 32/32 covered | ✅ |
| AC7 [R7] | No hook added to `ListingStatusBanner.tsx`/`loading.tsx`/any file lacking `'use client'` | See §7 | ✅ |
| AC8 [R8] | `next start`, `/sq/listings/<slug>` and `/uk/listings/<slug>` return 200 with detail body | `r2-body-sq.txt`/`r2-body-uk.txt` for slug `shitet-gazonjere-ne-pogradec-mtu8u1lg` — see §4 correction | ✅ |
| AC9 [R9] | No new theme value/token/marker; `--strict --scope=mantine` 0; global finding set unchanged (diff named) | `i6-design-tokens-scope-mantine.txt` 0 violations; diff vs `task791/design-tokens-full.log` below | ✅ |

`grep -c '#similar-listings' src/modules/listings/components/ListingStatusBanner.tsx`:

```
0
```

## 2. Current versus required behavior

**Before:** back button = shadcn `Button` + 2 Tailwind classes. Status banner = `div` + 6-entry Tailwind `STYLES` record + `<a href="#similar-listings">` (in-page anchor — the target exists at `ListingDetailView.tsx:347`, unconditionally rendered, so the defect was semantic: a reader on a sold/archived/expired/etc. listing was scrolled further down the same dead page). `loading.tsx` = 30-class Tailwind shell over legacy `Skeleton`. `SimilarListingsView`/`RecentlyViewedGridView` = raw grid/heading utilities. None of the four had Storybook coverage or a `mantine-migration-scope.json` entry.

**After:** all five render on canonical Mantine primitives (`Button`, `Alert`, `Skeleton`, `Title`, `SimpleGrid`) with semantic markers/test-ids/responsive behaviour preserved. The banner's control is a real `next/link` `Anchor` into `/{locale}/listings` pre-filtered by the current listing's `listing_type`/`property_type`/`location_id`. Each of the four components has a standalone canonical story, registered and `check:story-coverage`-proven.

**Negative flows (applicability table from the kickoff, all Yes):**

| Branch | Result |
|---|---|
| Missing `location_id` | `buildSimilarListingsHref` omits `location_id` from the query string entirely (guarded by `if (params.locationId)`) — proven by `ListingDetailView.buildSimilarListingsHref.test.ts` (Revision 1, F2), both `null` and `undefined` cases |
| Locale expansion (`uk@320`) | Banner/back-button/section-view text wraps via Mantine's own theme defaults (Button label `whiteSpace:'normal'`, Alert message `lineHeight`); no fixed-width container introduced |
| Small viewport | `RecentlyViewedGridView.module.css`'s `<40em` flex-scroll / `≥40em` grid switch reproduces the pre-migration behaviour |
| Server-Component hook | `ListingStatusBanner.tsx`/`loading.tsx` carry no `'use client'` and call no hook (§7) |
| Authorization/RLS, Concurrent writer | N/A — no route/action/data-model touched (kickoff §11) |

Built href, listing with all three fields (`type=sale`, `property_type=apartment`, `location_id=1`):

```
/en/listings?type=sale&property_type=apartment&location_id=1
```

Built href, listing with a null `location_id`:

```
/en/listings?type=sale&property_type=apartment
```

(Both traced by hand from `buildSimilarListingsHref`'s `URLSearchParams` guard logic — `listingType`/`propertyType` are non-nullable `Listing` columns so they are always set; `locationId` is the only field that can be omitted, matching `listing.location?.id ?? null` at the call site.)

## 3. Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingBackButton.tsx` | R1 — Mantine `Button`, no shadcn import |
| `src/modules/listings/components/ListingStatusBanner.tsx` | R2/R5 — Mantine `Alert`, real `href` prop replacing the in-page anchor |
| `src/app/[locale]/listings/[slug]/loading.tsx` | R3 — Mantine `Skeleton`, no shadcn import, geometry preserved |
| `src/modules/listings/components/SimilarListingsView.tsx` | R4 — Mantine `Title`/`SimpleGrid` |
| `src/modules/listings/components/RecentlyViewedGridView.tsx` | R4 — Mantine `Title`/`Text`/`Group`, scroll/grid switch moved to CSS module |
| `src/modules/listings/components/RecentlyViewedGridView.module.css` | new — the horizontal-scroll/grid breakpoint switch (no single Mantine primitive expresses it) |
| `src/modules/listings/components/ListingDetailView.tsx` | R5 — `buildSimilarListingsHref()` helper + wired at the banner call site (href computed at the caller, not threaded as a new route prop). Revision 1 (F2): exported. |
| `src/modules/listings/components/__tests__/ListingDetailView.buildSimilarListingsHref.test.ts` | Revision 1 (F2) — new: vitest coverage for both `buildSimilarListingsHref` branches (`location_id` present / null / undefined) |
| `scripts/mantine-migration-scope.json` | R6 — 4 new manifest entries |
| `src/stories/mantine/primitives/ListingBackButton.stories.tsx` | R6 — new canonical story |
| `src/stories/mantine/primitives/ListingStatusBanner.stories.tsx` | R6 — new canonical story, all 6 statuses |
| `src/stories/mantine/primitives/SimilarListingsView.stories.tsx` | R6 — new canonical story |
| `src/stories/mantine/primitives/RecentlyViewedGridView.stories.tsx` | R6 — new canonical story, `Populated`/`Empty` |
| `docs/component-catalog.md` | catalog rows for the four components (Story ✅) + summary counter |
| `docs/backlog.md` | concise current-state update |

## 4. Validation evidence

All commands captured unpiped via `cmd.exe /c "<cmd> 2>&1"`, written UTF-8 no-BOM, `EXIT_CODE=` appended inside each file, retained under `docs/sessions/evidence/task792/`.

| # | Command | File | Exit |
|---|---|---|---|
| i1 | `node.exe -p process.platform` | `i1-node-platform.txt` | 0 (`win32`) |
| i2 | `npm.cmd run typecheck` | `i2-typecheck.txt` | 0 |
| i3 | `npm.cmd run lint` | `i3-lint.txt` | 0 (72 pre-existing warnings, 0 errors, none in changed files) |
| i4 | `npm.cmd run check:stories` | `i4-check-stories.txt` | 0 (139 files, 0 violations) |
| i5 | `npm.cmd run check:story-coverage` | `i5-check-story-coverage.txt` | 0 (32/32 covered, up from 28 pre-change) |
| i6 | `node.exe scripts\check-design-tokens.mjs --strict --scope=mantine` | `i6-design-tokens-scope-mantine.txt` | 0 |
| i7 | `npm.cmd run check:design-tokens` (unscoped, strict) | `i7-check-design-tokens-unscoped.txt` | 1 — pre-existing baseline only (see §9 diff) |
| i8 | `npx.cmd vitest run src/modules/listings` | `i8-vitest-listings.txt` | 1 — 2 pre-existing `ListingCard.smoke.test.tsx` failures (`.grayscale.opacity-60` archived-badge assertion), named in `docs/backlog.md` Task **790**; unrelated to any file this task touched (`ListingCard.tsx` not in scope, not edited) |
| i9 | `npm.cmd run build-storybook` | `i9-build-storybook.txt` | 0 |
| i10 | `npm.cmd run build` | `i10-build.txt` | 0 |
| i11/i12 | `npm.cmd run start` + two `Invoke-WebRequest`s (slug `11-mr7ucly4`) | `i11-start-stdout.txt`, `i12-route-requests.txt` | both `StatusCode 200` — **superseded, see correction below** |

`check:story-coverage` before/after: **28 → 32** manifest entries covered (all 32 covered, 0 missing).

### AC8 correction (Revision 1, review finding F3)

`i12-route-requests.txt`'s `StatusCode 200` for slug `11-mr7ucly4` is **not valid AC8 evidence**. Re-inspecting the
retained response bodies for that slug (`r1-body-sq.txt`, `r1-body-uk.txt`, `r1-body-banner.txt`) shows each embeds
`NEXT_HTTP_ERROR_FALLBACK;404` and the generic homepage `<title>Lero.al — Real estate marketplace in Albania</title>`
— Next.js streamed a nested Suspense boundary's `notFound()` fallback while the top-level response still carried
`StatusCode 200`. `11-mr7ucly4` does not resolve to a real listing in this environment's seeded data; the earlier
session-log claim that this slug's body contained "real price/back-button-label content" conflated price text from
an unrelated always-rendered section (similar/recently-viewed listings) with the target listing's own detail body,
which never rendered.

The corrected, valid AC8 evidence uses the seeded slug **`shitet-gazonjere-ne-pogradec-mtu8u1lg`**, retained at
`r2-body-sq.txt` / `r2-body-uk.txt`:

- `r2-body-sq.txt` — `<title>Shitet gazonjere në Pogradec | Lero.al</title>` (listing-specific, not the generic
  fallback title), `gallery-wrapper-static` id present, back-button label `Kthehu` present, no
  `NEXT_HTTP_ERROR_FALLBACK` digest.
- `r2-body-uk.txt` — same listing-specific title, `gallery-wrapper-static` id present, back-button label `Назад`
  present, no `NEXT_HTTP_ERROR_FALLBACK` digest.

This slug's real content (listing-specific `<title>`, the gallery mount point, and the locale-correct back-button
label) is what actually satisfies AC8's "detail body present" — a bare `StatusCode 200`, as `11-mr7ucly4` proved, is
not sufficient on its own. `r1-start.txt`/`r2-start.txt` record the `next start` server that served both captures.

## 5. Six-status before/after colour table (AC2)

| Status | Before (Tailwind `STYLES`) | After (Mantine `Alert color=`) | Provenance |
|---|---|---|---|
| `sold` | `bg-status-info/10 border-status-info/30 text-status-info` | `blueLight` | Reuses `ListingCard.tsx`'s Task 617 `status_sold`→`blueLight` mapping for `--status-info` — same file family, same token, not re-decided |
| `rented` | `bg-status-rented/10 border-status-rented/30 text-status-rented` | `purple` | Reuses `ListingCard.tsx`'s Task 617 `status_rented`→`purple` mapping for `--status-rented` |
| `archived` | `bg-muted border-border text-muted-foreground` | `gray` | Reuses `ListingCard.tsx`'s Task 617 `status_archived`→`gray` mapping (neutral/muted family) |
| `expired` | `bg-status-warning/10 border-status-warning/30 text-status-warning` | `yellow` | Reuses `ListingCard.tsx`'s Task 617 `status_expired`→`yellow` mapping for `--status-warning` |
| `pending` | `bg-status-warning/10 border-status-warning/30 text-status-warning` (file's own comment: deliberate `--status-warning` reuse) | `yellow` | Same `--status-warning` reuse the pre-migration file already documented — not re-decided |
| `inactive` | `bg-status-warning/10 border-status-warning/30 text-status-warning` | `yellow` | Same as `pending` |

No new Mantine colour was added to `theme.ts`; all six map onto colours the theme already carries (`blueLight`/`purple`/`gray`/`yellow` are pre-existing).

## 6. Section-view verification (AC4)

`grep -c 'className=' src/modules/listings/components/SimilarListingsView.tsx` → **0**.

`grep -n 'className=' src/modules/listings/components/RecentlyViewedGridView.tsx`:
```
40:      <div data-testid="recently-viewed-section" className="recently-viewed">
48:      <div data-testid="recently-viewed-section" className="recently-viewed">
64:      <div className={styles.grid}>
66:          <div key={listing.id} className={styles.card}>
```
All 4 are either the semantic marker (`"recently-viewed"`, preserved verbatim, unchanged from pre-migration) or a CSS-module reference (`styles.grid`/`styles.card`) — no Tailwind utility string remains. `data-testid="recently-viewed-section"` is unchanged (both branches). The `<40em` flex-scroll / `≥40em` grid switch is reproduced in `RecentlyViewedGridView.module.css`'s `@media (min-width: 40em)` block (`display:flex`→`display:grid`, `overflow-x:auto`→`visible`), matching the pre-migration `sm:grid` Tailwind breakpoint exactly (`sm` = `40em`/640px in `theme.ts`).

## 7. Hook/Server-Component check (AC7)

```
grep -n "'use client'" src/modules/listings/components/ListingBackButton.tsx
1:'use client'

grep -n "'use client'" src/modules/listings/components/ListingStatusBanner.tsx
(no output)

grep -n "'use client'" src/app/[locale]/listings/[slug]/loading.tsx
(no output)

grep -n "'use client'" src/modules/listings/components/SimilarListingsView.tsx
(no output)

grep -n "'use client'" src/modules/listings/components/RecentlyViewedGridView.tsx
1:'use client'
```

`use[A-Z]` scan: `ListingBackButton.tsx` uses `useEffect`/`useState`/`useRouter` — carries `'use client'`. `RecentlyViewedGridView.tsx` uses `useTranslations` — carries `'use client'`. `ListingStatusBanner.tsx` and `loading.tsx` call zero hooks (both use `theme` via direct `import { theme } from '@/design-system/mantine/theme'`, the `PopularLocationsView.tsx` Server-Component pattern named in the kickoff §3.1 — not a hook). `SimilarListingsView.tsx` calls zero hooks and stays a Server Component (no directive needed, matches pre-migration).

## 8. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility → token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Back button | `ListingBackButton.tsx` | `.text-xs.text-muted-foreground` (before) | Mantine `Button variant="transparent"` (no `color`) → `theme.ts:541-543` sets `--button-color: var(--mantine-color-gray-7)` when `variant==='transparent'` and `color` unset | change | `theme.ts:500-553` (Button `vars` callback), reused verbatim |
| Status banner border/bg | `ListingStatusBanner.tsx` | `bg-*/10 border-*/30` (before) | Mantine `Alert` → `theme.ts:1157-1184` styles callback: `border-color: var(--mantine-color-${color}-5)`, `background-color: var(--mantine-color-${color}-0)` | change | `theme.ts:1148-1184` (Alert styles), reused verbatim — same mechanism the existing staff-preview `Alert` at `ListingDetailView.tsx:389-404` already consumes |
| Status banner icon size | `Info` icon, `h-5 w-5` (20px) | — | `theme.other!.iconSize!.roomy` = 20px | preserve (same value, named token) | `theme.ts:429-436` |
| Loading skeleton radii | shadcn `Skeleton` `rounded*` classes | `rounded`/`rounded-xl`/`rounded-2xl`/`rounded-full`/`rounded-lg`/`rounded-none` | Mantine `radius` scale (`theme.ts:368-376`): `sm`=4px, `xl`=12px (Skeleton's own default), `2xl`=16px, `pill`=9999px, `lg`=8px, `{0}` | change (mapped to nearest exact/named token) | `theme.ts:368-376`; `Skeleton`'s own `defaultProps.radius:'xl'` at `theme.ts:922-927` |
| `SimilarListingsView`/`RecentlyViewedGridView` heading | `text-xl font-bold` | — | `Title order={2} size="h4"` | change (reuses the exact sizing `ListingDetailView.tsx`'s `SimilarListingsSkeleton` already established for this identical heading — Assumption in kickoff §5, resolved without inventing a value) | `ListingDetailView.tsx:48-71` (pre-existing `SimilarListingsSkeleton`) |
| `SimilarListingsView` grid | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4` | — | `SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md"` | change (exact same breakpoint step `FeaturedListingsView.tsx:72,91` already uses, Task 668 owner decision) | `FeaturedListingsView.tsx:72,91` |
| `RecentlyViewedGridView` scroll/grid switch | `flex …overflow-x-auto… sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | `.grid`/`.card` (new CSS module) | `@media (min-width: 40em/48em/64em)` literals matching `theme.ts` `sm`/`md`/`lg` (same literal-em convention as `FeaturedListingsView.module.css`/`HeroSearchView.module.css`) | change (behaviour preserved) | `RecentlyViewedGridView.module.css` |
| `RecentlyViewedGridView` card width (mobile) | `w-48` (192px) | `.card` | `calc(var(--mantine-spacing-xl) * 8)` — var()-anchored, no bare literal | preserve (same 192px, token-composed) | `RecentlyViewedGridView.module.css`; cf. `HeroSearchView.module.css:87`'s `design-tokens-allow: width: 12rem` precedent for the same raw value — **not reused here**, since R9 forbids a new marker; the `calc()` composition avoids needing one |

## 9. Design-tokens diff against named baseline (AC9)

Baseline: `docs/sessions/evidence/task791/design-tokens-full.log` (most recent retained unscoped run; no `task793` evidence directory was retained).

Baseline total: 64 (`raw-dimension-prop` 41, `raw-inline-dimension` 23). Current (`i7-check-design-tokens-unscoped.txt`): 63 (`raw-dimension-prop` 41, `raw-inline-dimension` 22).

Per-file diff (`comm` on the two logs' `path (N)` header lines):

```
15d14
<   src/modules/listings/components/ListingContact.tsx  (1)
```

The only delta is `ListingContact.tsx` dropping its 1 finding — that file was migrated by the already-landed Task **793** (closed `APPROVED WITH NOTES` 2026-09-06), not by this task; `ListingContact.tsx` is not in Task 792's scope and was not touched in this session. **Zero findings appear in, or were removed from, any of Task 792's five changed files** in either log — a stronger result than AC9's "differing only by findings inside the five changed files" (there is no difference attributable to this task at all).

`--strict --scope=mantine`: 0 violations (`i6-design-tokens-scope-mantine.txt`).

## 10. Implementation validation notes

- **`loading.tsx` scope decision:** R3's wording (no `@/components/ui/skeleton` import, every placeholder a Mantine `Skeleton`, gallery geometry preserved) is narrower than R1/R2/R4's explicit "no Tailwind class string." I migrated the `Skeleton` primitive only and left the route's own layout/container Tailwind classes (`container-wide`, `grid`, `flex`, etc.) unchanged — `loading.tsx` is not in `scripts/mantine-migration-scope.json` and is not one of R6's four components. This is a scope reading, not an oversight; flagging for Opus to confirm.
- **Skeleton sizing mechanism:** every fixed-size placeholder wraps an invisible `<div>` carrying its original Tailwind `h-*`/`w-*` class (Mantine's own "size from children" behaviour — same technique `ListingDetailView.tsx`'s pre-existing `SimilarListingsSkeleton` uses) rather than a raw numeric `height`/`width` prop on `Skeleton` itself, which `check-design-tokens.mjs`'s `raw-dimension-prop` pattern would catch in a production file. The gallery-grid cells use Mantine's own `h="100%"` style prop instead (a percentage, not a `px`/`rem`/`em` literal, and reliably applies as it participates in Mantine's own var-merge stage rather than fighting Mantine's unlayered CSS the way a plain Tailwind className would).
- **`RecentlyViewedGridView`'s asymmetric `gap-x-3 gap-y-1`** (12px/4px) collapses to a single Mantine `Group gap="sm"` (12px both axes) — Mantine's `Group` does not expose independent row/column gaps without an inline style override, which R9 forbids. Minor visual delta only when the title+clear-button row wraps at very narrow widths; flagging for Opus/owner visual review.
- **No `SimilarListingsView`/`RecentlyViewedGridView` "no invented value" stop was needed** — both headings reuse the exact `Title order={2} size="h4"` contract `ListingDetailView.tsx`'s own pre-existing `SimilarListingsSkeleton` already established for this identical `text-xl font-bold` heading (kickoff §5 Assumption, resolved).
- **Revision 1 correction (F3):** the slug `11-mr7ucly4` used in the original i11/i12 verification does not resolve to a real listing — its `StatusCode 200` response body is a `NEXT_HTTP_ERROR_FALLBACK;404` fallback (§4 correction), not an `active`-status listing as originally (incorrectly) inferred. AC8's corrected evidence uses `shitet-gazonjere-ne-pogradec-mtu8u1lg` (`r2-body-sq.txt`/`r2-body-uk.txt`), which returns real detail-page content. Whether that listing's status is non-`active` (and would therefore render the banner) was not re-checked in this revision — the 6-status coverage remains proven by the new `Mantine/Primitives/ListingStatusBanner` story; a confirmed non-`active` seeded slug is still needed for the owner's live-route visual matrix (§13 of the kickoff / §12 below).

## 11. Assumptions, deviations, and limitations

- Assumption (kickoff §5, resolved without invention): `SimilarListingsView`/`RecentlyViewedGridView` headings use `Title order={2} size="h4"`, reusing the existing `SimilarListingsSkeleton` sizing contract.
- Deviation: `RecentlyViewedGridView`'s header row loses its `gap-x`/`gap-y` asymmetry (§10).
- Limitation: the corrected AC8 slug's status was not re-checked (§10), so the 6-status banner was not observed live in this session; Storybook is the standalone-state proof, per the story-first gate.
- The `<Box id="similar-listings">` wrapper at `ListingDetailView.tsx:347` is unchanged — kickoff §5 records this as `OWNER DECISION — non-blocking`, not this task's call.

## 12. Opus handoff

- Confirm the `loading.tsx` scope reading in §10 (Skeleton-only migration, layout Tailwind classes retained) matches R3's intent, or reopen for a fuller de-Tailwind pass.
- Confirm the `Group gap="sm"` asymmetric-gap collapse in `RecentlyViewedGridView.tsx` (§10) is acceptable.
- **`OWNER VISUAL QA REQUIRED`** (live route, not Storybook toolbar — §3.5/D71-2, Task 799): the six banner statuses × uk/sq × 320/390/1024; the banner link click-through at uk@390; back button + section views at uk/sq/en/it@320 and all four @1440; `loading.tsx`'s Suspense shell at en@390/1024. A seeded non-`active` listing is needed for the banner-status cells — `11-mr7ucly4` (used in the original session) does not resolve at all (§4/§10 correction); `shitet-gazonjere-ne-pogradec-mtu8u1lg` (the corrected AC8 slug) renders but its status was not re-checked in this revision.
- Design-tokens diff (§9) and story-coverage delta (§4) are the two AC9/AC6 numeric claims to spot-check independently.

## 13. Backlog update

`docs/backlog.md` "Last Session" rewritten (2026-09-09, Revision 1) naming Task 792's `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` status, the five migrated files, the manifest delta, the exported/vitest-covered `buildSimilarListingsHref` (F2), and the corrected AC8 slug/evidence (F3 — `11-mr7ucly4` was a 404 fallback under `StatusCode 200`; the real evidence is `shitet-gazonjere-ne-pogradec-mtu8u1lg` via `r2-body-sq.txt`/`r2-body-uk.txt`); Sprint 71's own line unchanged (still names the corrected status). File is **75 physical lines** (unchanged — well under the 80-line limit). No `BACKLOG LIMIT BREACH`.

---

## 14. Revision 1 — remediation (review findings F2/F3)

Prior artifacts `i1`–`i14` and `r1`/`r2` are unchanged/not overwritten. `r3-start.txt`/`r3-body-banner-uk.txt` (an earlier banner-focused capture, also against a slug that returned the `NEXT_HTTP_ERROR_FALLBACK;404` fallback) are retained but superseded by the same §4/§10 correction and not separately cited as evidence.

**F2 — `buildSimilarListingsHref` exported + vitest-covered.**
`src/modules/listings/components/ListingDetailView.tsx` — `function buildSimilarListingsHref` → `export function buildSimilarListingsHref`. New test file
`src/modules/listings/components/__tests__/ListingDetailView.buildSimilarListingsHref.test.ts` — 3 cases: all three params present; `locationId: null` omits `location_id`; `locationId: undefined` omits `location_id`. Run in isolation first (`npx vitest run` on just this file): **3/3 passed**, confirming the full `ListingDetailView.tsx` module graph imports cleanly under vitest (this repo's `vitest.config.ts` already stubs `server-only`/`next/cache` for exactly this).

**F3 — session log §1/§4/§10/§11/§12 and `docs/backlog.md`:10 corrected** to name the real live slug, cite `r2-body-*.txt`, and record the `11-mr7ucly4` 404-under-200 defect; the unsupported "price/back-button label confirmed" claim (tied to `i12-route-requests.txt`'s bare `StatusCode 200`) is removed everywhere it appeared and replaced with the r2-sourced, body-content-based claim (§4 correction).

### Commands run this revision (in the requested order)

All captured unpiped via `cmd.exe /c "<cmd> 2>&1"`, UTF-8 no-BOM, `EXIT_CODE=` appended inside each file, retained under `docs/sessions/evidence/task792/`.

| # | Command | File | Exit | Result |
|---|---|---|---|---|
| v2a | `npm.cmd run typecheck` | `v2-typecheck.txt` | 0 | clean |
| v2b | `npx.cmd vitest run src/modules/listings` | `v2-vitest-listings.txt` | 1 | **25 test files (24→25, +1), 564 tests (561→564, +3)** — 2 failing, both the same pre-existing `ListingCard.smoke.test.tsx` `.grayscale.opacity-60` assertions (Task 790), unchanged in count/identity from the original session; the 3 new `buildSimilarListingsHref` tests are among the 564 passing |
| v2c | `npm.cmd run build` | `v2-build.txt` | 0 | clean, `/[locale]/listings/[slug]` unchanged in the route table |
| v2d | `npm.cmd run check:file-integrity` | `v2-file-integrity-final.txt` | 0 | run last, after every Revision-1 artifact (incl. this section) existed and the path set was final — **43 files checked, 0 findings** (28 in the original session → 43 now: +1 test file, +14 new/updated evidence `.txt` files under `docs/sessions/evidence/task792/`) |
| v2e | `npm.cmd run check:mojibake` | `v2-mojibake-final.txt` | 0 | run last, same final path set — **3969 files scanned, 0 artifacts** (3954 in the original session → 3969, the same +15 new/changed files) |

`git status --porcelain` at the final path set: unchanged from the original session — 9 modified + 7 untracked top-level paths (16 total; the untracked `docs/sessions/evidence/task792/` directory and the new test file are among them). No path was added or removed by this revision, only file contents inside already-untracked/-modified paths.

Self-validation (Revision 1): tsc=0 errors · build=passes · vitest(listings)=564 passing/2 pre-existing-unrelated-failing (same identity as the original session, +3 new passing) · AC table=all green with the AC8 row now citing `r2-body-*.txt` · scope=clean (adds 1 test file + `export` keyword; §1/§4/§10/§11/§12/backlog text corrected; no other production file touched) · integrity=PASS (43 files, 0 findings) · mojibake=PASS (3969 files, 0 artifacts)
