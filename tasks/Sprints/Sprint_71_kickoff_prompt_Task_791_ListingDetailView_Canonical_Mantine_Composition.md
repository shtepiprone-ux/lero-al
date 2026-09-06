# Task 791 — `ListingDetailView` leaves Tailwind and composes the canonical Mantine detail pattern

**Sprint:** 71 (new) · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-05 · **State:** `KICKOFF FILED`

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger** (D69-3 / owner frontend exception in `docs/orchestrator-role.md`).

**Every measured fact below was read at source on 2026-09-05 against a clean worktree at `10271f95a`.
Re-measure at execution; do not cite this document as the authority for a number.**

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **UI migration — route-level composition of an existing canonical
Mantine pattern**, plus a small `extend` of two canonical sources. **Mixed migration**: the migrated file is on the
current Mantine path; four of its children stay legacy shadcn/Tailwind by design and are named with the reserved
number that owns each (D71-3).

## 2. Objective

`src/modules/listings/components/ListingDetailView.tsx` stops being a Tailwind surface. Its content grid is
rendered by the already-canonical `MantineListingDetailPattern`; its breadcrumb band and page container are
rendered by the already-canonical `ListingsPageFrame`. Four things must survive untouched:

1. **the LCP gallery mechanism** — the server-rendered static frame plus the lazy client island, and the swap
   between them;
2. **the server/client boundary** — `ListingDetailView` stays a Server Component;
3. **the contact card** — `ListingContact` renders exactly as it does today, in the sidebar column;
4. **both consuming routes** — the public detail page and the admin staff preview.

This is also the first production consumer any of the Task 616 detail patterns has ever had.

## 3. Verified context — read at source before this kickoff, do not re-derive

### 3.1 The canonical patterns exist and have **zero** production consumers

`grep -rn <PatternName> src scripts -l`, 2026-09-05, every hit classified:

| Canonical pattern | Lines | Production importers | Non-production hits |
|---|---|---|---|
| `MantineListingDetailPattern.tsx` | 252 | **0** | own story, `MantineListingContactPattern.tsx` (comment), `patterns/index.ts`, `theme.ts`, `theme.d69-18.test.tsx` |
| `MantineListingContactPattern.tsx` | 261 | **0** | own story, `MantineListingDetailPattern.tsx` (composition), `patterns/index.ts`, `theme.ts`, `ListingsActionRow.tsx` **(a code comment at `:16`, not an import — inspected)** |
| `MantineListingGalleryPattern.tsx` | 117 | **0** | own story, `MantineListingDetailPattern.tsx` (composition), `patterns/index.ts`, `scripts/__tests__/overlay-dual-declaration.test.ts` |

`FACT`: this task is **not** "create canonical". It is "consume canonical, and extend it where the first real
consumer proves it incomplete" (§3.7).

`ListingsPageFrame.tsx` (86 lines, Task 775) is the opposite case: **one** production consumer,
`src/app/[locale]/listings/page.tsx:81`, and a canonical story `Patterns/Mantine/ListingsPageFrame` with a single
`Default` state.

### 3.2 The detail chain as it stands

| File | Lines | Component kind | `className=` | `@/components/ui/*` | Disposition in this task |
|---|---|---|---|---|---|
| `ListingDetailView.tsx` | 424 | **server** | **65** | `badge` | **migrated — the whole file** |
| `GalleryStaticFrame.tsx` | 58 | **server** | 5 | — | preserved verbatim, passed as `gallerySlot` → **794** |
| `GalleryIsland.tsx` | 33 | client | 0 | — | preserved verbatim, passed as `gallerySlot` → **794** |
| `ListingGallery.tsx` | 165 | client | 15 | `AppImage`, `button` | untouched → **794** |
| `LightboxView.tsx` | 174 | client | 12 | `AppImage` | untouched → **794** |
| `ListingContact.tsx` | 423 | client | **75** | `avatar`, `button` | preserved verbatim, passed as `contactSlot` → **793** |
| `ListingBackButton.tsx` | 44 | client | 2 | `button` | untouched → **792** |
| `ListingStatusBanner.tsx` | 37 | **server** | 5 | — | untouched → **792** |
| `ListingReportDialog.tsx` | 171 | client | 15 | `dialog`, `button`, `label`, `textarea` | untouched, passed through `contentFooter` → **795** |
| `[slug]/loading.tsx` | 73 | server | — | `skeleton` | untouched → **792** |

`ListingDetailView.tsx` is rendered by **two** routes: `src/app/[locale]/listings/[slug]/page.tsx` and
`src/app/admin/listings/[id]/preview/page.tsx`. Both must be verified.

### 3.3 The server/client boundary — what this composition may and may not do

`FACT`: `ListingDetailView.tsx` has no `'use client'`; its `ListingDetailView` export is `async` and awaits
`getTranslations`. `MantineListingDetailPattern` and `ListingsPageFrame` differ here — the first is
`'use client'`, the second is a Server Component with no function props (its own doc comment says so, citing the
`src/app/[locale]/page.tsx` + `MantineHomeSection.tsx` precedent).

Therefore:

- **Permitted:** a Server Component may render a client component and pass it serializable props **and
  server-rendered JSX as slot props**. `features[].icon`, `gallerySlot`, `contactSlot`, `contentFooter` and
  `favorite` are all slot nodes — that is exactly the Task 605 hook-free split idiom this pattern already uses
  for `inquiryTrigger` / `reportTrigger`.
- **Forbidden:** passing a **function** prop from `ListingDetailView` into the client pattern.
  `MantineListingDetailPattern` itself takes none; `MantineListingContactPattern` takes `onCall` / `onWhatsApp` /
  `onShare` / `onLogin`, which is a second, independent reason the contact card is slotted rather than migrated
  here.
- **Forbidden:** adding `'use client'` to `ListingDetailView.tsx`, or calling any React hook in it. This is the
  D71-1/D70-1 failure class that took `lero.al` down on 2026-09-04. For theme values in a Server Component use
  `import { theme } from '@/design-system/mantine/theme'` and `theme.other!.…`, the pattern
  `PopularLocationsView.tsx` documents.

`FACT`: `MantineRootProvider` is mounted in the **root** `src/app/layout.tsx:50`, not in `[locale]/layout.tsx`, so
both the public route and the admin preview route are already inside a `MantineProvider`. This is verified, not
assumed — it was the most plausible blocker for this task and it does not hold.

### 3.4 ⚠️ The gallery is an LCP mechanism, not a layout — do not let the pattern render it

`GalleryStaticFrame.tsx` is a Server Component that emits a plain `<img>` with `fetchPriority="high"` into the SSR
HTML, so Chrome can paint the LCP candidate on the compositor thread while the main thread hydrates. Its own doc
comment records the measured gain it exists for ("eliminating the 4.3 s paint-opportunity gap on throttled mobile
CPUs") and the three-step lifecycle: SSR frame → `GalleryIsland` mounts (`next/dynamic`, `ssr: false`) →
`ListingGallery`'s `useEffect` removes the frame and reveals `#gallery-interactive-shell`. The swap is keyed on
the DOM ids `gallery-static-frame`, `gallery-interactive-shell` and `gallery-btn-placeholder`, and on both nodes
sharing the `--listing-gallery-h-*` heights so the swap is zero-CLS.

`MantineListingGalleryPattern` reproduces **none** of that: it is `'use client'`, renders a Mantine `Image` (not
`AppImage`, so no Cloudinary transform), owns its own lightbox state, and lays the photos out differently (a
full-width main photo with a 4-up thumbnail row beneath, versus the production frame's 4-column × 2-row grid).
Letting the pattern render the gallery would delete the LCP mechanism, change the photo layout and move the
lightbox's owner — three separate regressions in one line of code.

**Therefore E1 (§3.7) exists**: the production gallery subtree is passed into the pattern as a slot, byte-identical.

### 3.5 ⚠️ The contact card is not a drop-in — five measured divergences

`MantineListingContactPattern` mirrors `ListingContact.tsx`'s **desktop sticky sidebar** and its five states
(`normal` / `guestCta` / `ownerDeleted` / `ownerUnavailable` / `closedListing`). It does **not** cover:

1. **the mobile fixed bottom bar.** `ListingContact.tsx:307-309` renders a second, `lg:hidden fixed` bar with its
   own price row, phone/WhatsApp arrangement at the 640px boundary and inquiry trigger. The pattern has no
   equivalent — it is one responsive `Paper` (`pos={{ base:'static', lg:'sticky' }}`). Migrating would **delete a
   live mobile control**, which is an owner decision, not a refactor.
2. **`SaveToCollectionButton`** — rendered in the production sidebar's secondary-action row; the pattern has no
   slot for it.
3. **the contact-loading state** — production disables the call/WhatsApp buttons and swaps in a `Loader2` spinner
   while `getListingOwnerContact` resolves; the pattern's buttons have no loading state.
4. **the "link copied" share label** — production toggles `t('link_copied')` for 2s after a clipboard fallback;
   the pattern's `labels.share` is static.
5. **the WhatsApp brand colour** — production uses `bg-whatsapp`; the pattern uses `color="green"`.

All five belong to **793**. In this task the contact card is passed through unchanged.

### 3.6 ⚠️ The sidebar breakpoint does not match, and a naive composition renders an empty column

`MantineListingDetailPattern` splits its `Grid` at **`md`** (`span={{ base:12, md:8 }}` / `{ base:12, md:4 }`,
with `pr` and `mb` keyed to the same `md`). Production splits at **`lg`**
(`grid-cols-1 lg:grid-cols-[1fr_320px]`), and `ListingContact`'s desktop sidebar is `hidden lg:block`.

`INFERENCE` (from those two facts): composing the pattern unchanged with `contactSlot` would, between 768px and
1023px, render a 4/12 sidebar column whose only child renders nothing, while the mobile fixed bar is still the
active contact surface — an empty gutter one third of the page wide, at the two most common tablet widths.

**Therefore E5 (§3.7) exists.** Behavior preservation wins: production keeps its `lg` split. The pattern's own
canonical story keeps `md` as the default, so `/listings`-side expectations are unchanged.

### 3.7 What the first real consumer proves the pattern is missing — the five extends

| ID | Extend to `MantineListingDetailPattern` | Why the consumer needs it | Why not a local workaround |
|---|---|---|---|
| **E1** | `gallerySlot?: ReactNode` — when provided, rendered in place of `MantineListingGalleryPattern` | §3.4: the LCP frame + island must survive | Rendering the gallery outside the pattern would put it outside the content `Stack`'s `gap="lg"` rhythm and above the badges row, changing the page order |
| **E2** | `contactSlot?: ReactNode` — when provided, rendered in the sidebar `Grid.Col` in place of `MantineListingContactPattern`; `contact` becomes optional | §3.5 (five divergences) and §3.3 (the contact pattern's function props cannot cross the RSC boundary) | Composing the `Grid` by hand in `ListingDetailView.tsx` is exactly the "copied local styles when reuse was available" defect the review protocol rejects |
| **E3** | `contentFooter?: ReactNode` — appended to the end of the left column's `Stack` | Production's left column continues past amenities with the map card, the report row, recently-viewed and similar-listings | Rendering them below the whole `Grid` would make them full-width at `lg`+ instead of column-width — a layout change disguised as a port |
| **E4** | render the existing-but-unread `originalPriceLabel` together with a new `data.originalPrice`, as `Text size="xs" c="dimmed"` under the price group | Production renders `{t('original_price')}: {originalPriceStr}` (`ListingDetailView.tsx`, price block). **Absence trace:** `grep -n "originalPrice" MantineListingDetailPattern.tsx` returns exactly one hit — the `originalPriceLabel?: string` declaration at `:32`. It is declared and never read; the field is dead today | Dropping the line silently loses the converted-currency disclosure on every non-EUR listing |
| **E5** | `sidebarFrom?: 'md' \| 'lg'` (default `'md'`), driving `span`, `pr` and `mb` together | §3.6 | Overriding the `Grid` from the consumer means re-declaring the pattern's own responsive contract in the consumer |

| ID | Extend to `ListingsPageFrame` | Why |
|---|---|---|
| **E6** | `intermediate?: { label: string; href: string }[]`, rendered between the home anchor and the current `Text`, defaulting to `[]` | The detail route's breadcrumb is four levels (home / all listings / location / title); the frame today renders exactly two. With `[]` the rendered output must be **identical** to today's, which is what keeps `/listings` unchanged |

`E1`-`E5` are `extend` on a pattern whose in-scope production consumer is this very task, so the permanent-story
gate is satisfied without separate owner authorization — each extend gets a story state on the canonical
`Patterns/Mantine/ListingDetailPattern` story before the consumer composes it (§10, phase order). `E6` is the
same on `Patterns/Mantine/ListingsPageFrame`.

### 3.8 ⚠️ The manifest and the story are one decision, and it has a detector consequence

`scripts/check-story-coverage.mjs` (read at source): a component in `scripts/mantine-migration-scope.json` passes
**only** when a story whose `meta.title` satisfies `isCanonicalMantineTitle` **statically imports** it. That
predicate (`scripts/lib/mantine-story-scope.mjs`) is `title.startsWith('Mantine/Primitives/' | 'Patterns/Mantine/')`
plus one exact-title enrolment for `Admin/AdminUsersTable`.

The existing story for this component is `src/modules/listings/components/ListingDetailView.stories.tsx`, titled
**`Listings/ListingDetailView`** — not canonical. It renders the real `ListingDetailViewBody` and already carries
the three states this task must keep proving: `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`.

`FACT`, from `scripts/check-design-tokens.mjs:1054-1056`: the `--scope=mantine` scan is the union of the manifest,
`src/design-system/mantine/**`, **and every canonical Mantine story**. So retitling that story and adding the
component to the manifest pulls **both files** into the scoped raw-dimension detector. That is the reason this
task de-Tailwinds the *whole* file rather than only the content grid: a manifest entry plus surviving
`pb-44 md:pb-20`, `py-2.5`, `max-w-xs`, `px-5 py-4`, `h-5 w-5`, `h-7 w-48` utilities is a requirement that
contradicts its own gate. Detector-aware requirements, `docs/orchestrator-procedures.md`.

Retitling also enrols the story in `check:locale-leak --mantine-only` and the `--mantine-only` rendered matrix.
Its fixture is Albanian production-shaped copy (`Shitet apartament 2+1 në Tiranë…`, `Elira Hoxha`, `Tiranë`).
**Expect new locale-leak findings and report them; do not translate the fixture and do not update a baseline to
absorb them** — Task 736's row is the standing precedent for why an sq string identical to en is usually correct.

### 3.9 Critical flows this route sits on

From `docs/critical-flow-registry.md`:

- **Hydration / console errors — live public routes** names listing-detail explicitly, run as
  `HYDRATION_LISTING_PATH=/en/listings/<slug> BASE_URL=… npm run check:hydration`.
- **Listing-detail gallery lightbox stacking (Task 612)** asserts the lightbox paints above the site header **and
  the sticky agent contact card** at every breakpoint × locale. This task does not change either node, but it does
  change their **shared parent** from a Tailwind `grid` to a Mantine `Grid`/`Grid.Col`, which is a new containing
  block. That is enough to require the stacking proof again.

Neither flow's owner component, action or write path changes, and no registry row is edited — which is why the
profile is **Q3 and not Q4**. Both proofs are still required evidence (§13).

### 3.10 Not this task's scope, and not a defect to fix in passing

`ListingContact.tsx:309` and `ListingMobileCTA.tsx:70` carry `bottom-14` — 56px reserved for the mobile bottom bar
Task 787 deleted on 2026-09-05. It is real and it is filed as **793** (P1) in the sprint file. `ListingDetailView`'s
own `pb-44 md:pb-20 lg:pb-8` wrapper clearance is the *matching* reservation for `ListingContact`'s fixed mobile
bar, which still exists — so this task **preserves that clearance's rendered value exactly** and 793 changes both
ends together. Do not "helpfully" drop it here.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner, 2026-09-05 | `ListingDetailView.tsx` contains **zero** `className` occurrences and **zero** `@/components/ui/*` imports. Layout, spacing, type and colour come from Mantine primitives, the canonical patterns and existing theme/`globals.css` tokens. | P0 | AC1 | Confirmed |
| **R2** | §3.1, §3.7 | The content grid is rendered by `MantineListingDetailPattern`, extended by **E1-E5**. No `Grid`, `Grid.Col`, card, badge, price, meta or feature markup is re-declared in the consumer. | P0 | AC2 | Confirmed |
| **R3** | §3.1, §3.7 | The breadcrumb band and the page container are rendered by `ListingsPageFrame`, extended by **E6**. `/[locale]/listings`'s own rendered output is unchanged. | P0 | AC3 | Confirmed |
| **R4** | §3.4 | The gallery subtree — the preload `<link>`, `GalleryStaticFrame`, the `gallery-btn-placeholder` spacer, `#gallery-interactive-shell` and `GalleryIsland` — is preserved with its DOM ids, order and `hidden` state intact, passed through `gallerySlot`. | P0 | AC4 | Confirmed |
| **R5** | §3.3, D71-1 | `ListingDetailView.tsx` gains no `'use client'` and calls no React hook. The route's server/client boundary is unchanged apart from the pattern itself becoming a client island. | P0 | AC5, AC11 | Confirmed |
| **R6** | §3.5, §3.6, D71-3 | `ListingContact` is rendered unchanged through `contactSlot`, and the sidebar column splits at `lg` (E5), so no empty sidebar column exists at any width. `ListingContact.tsx` is not edited. | P0 | AC6 | Confirmed |
| **R7** | §3.2 | Every control and every piece of information present today is still present: breadcrumbs (4 levels), back button, status banner, staff preview banner (both variants), 5 badges, title, price + struck-through old price + per-m² + original-price line, location/views/date/ID meta, key-features grid, description, additional details, map, report row, recently-viewed, similar-listings. Staff-preview inertness (`effectiveCanReport` / `effectiveIsFavorited` / `effectiveListingId` / `effectiveCanSendInquiry`) is preserved exactly. | P0 | AC7 | Confirmed |
| **R8** | §3.8 | The story moves to `src/stories/patterns/mantine/ListingDetailView.stories.tsx`, retitled `Patterns/Mantine/ListingDetailView`, keeping all three states and its fixture; `src/modules/listings/components/ListingDetailView.tsx` is added to `scripts/mantine-migration-scope.json`; `check:story-coverage` passes. | P0 | AC8 | Confirmed |
| **R9** | §3.8 | `check:design-tokens --scope=mantine` exits 0 with the two newly-scoped files included. Any surviving raw dimension is removed, **not** allowlisted; a `design-tokens-allow` marker is permitted only for a measured length with no matching Mantine token, carrying the `ListingsPageFrame.module.css` justification shape. | P0 | AC9 | Confirmed |
| **R10** | §3.10 | The page's bottom clearance (`pb-44 md:pb-20 lg:pb-8` today) is preserved at its **rendered** values, expressed in Mantine. It is not reduced, removed or "cleaned up" — 793 owns it together with the bar it reserves for. | P1 | AC10 | Confirmed |
| **R11** | §3.9 | The two critical-flow proofs are re-run for this diff: `check:hydration` on the listing-detail path, and the Task 612 lightbox stacking contract against the sticky contact card. | P1 | AC11, AC12 | Confirmed |
| **R12** | §3.8 | New `check:locale-leak --mantine-only` findings caused by enrolling the story are **reported and classified**, not translated away and not baselined. | P2 | AC13 | Confirmed |

## 5. Assumptions and open questions

| ID | Statement | Disposition |
|---|---|---|
| **A1** | Preserving today's `lg` sidebar split (E5) is preferred over adopting the pattern's `md` default. | **Reversible assumption, labelled.** Behavior preservation wins by default; the pattern's own story keeps `md`. If the owner wants the sidebar from `md`, it is a one-word change at the call site plus a visual re-review. |
| **A2** | The `h1` changes from `text-2xl sm:text-3xl font-bold` to Mantine `<Title order={1} size="h2">`, and the page gutters change from `container-wide` to `ListingsPageFrame`'s `px={{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }}` + `maw var(--width-page-max)`. | **Accepted visual delta**, resolved by the owner visual matrix (§13, D71-2), not blocked at design. Both are the canonical sources' own contracts; re-declaring the old values locally would be the defect. |
| **OQ1** | Do recently-viewed and similar-listings stay inside the content column (via `contentFooter`, preserving today's width), or become full-width below the grid? | **Answered by preservation:** they stay in the column. Raised here only so a reviewer sees it was decided, not overlooked. |
| **UNKNOWN 1** | The exact `check:design-tokens --scope=mantine` finding count that the two newly-scoped files introduce. | Not measurable from this environment — the Windows-native rule forbids treating a Linux-VM `node` result as repository evidence. **I0 re-measure**: run the scoped detector natively *before* the fix and record the finding list; R9 is satisfiable either way because the answer is always "remove the utility". |
| **UNKNOWN 2** | Whether enrolling `Patterns/Mantine/ListingDetailView` produces new `--mantine-only` rendered-matrix failures. | Same: measure natively, report, do not baseline. R12. |
| **NOTE** | `npm run test` (the full suite) is **red at `HEAD`** — 5 failures across 4 files, all pre-dating this task, filed as **790**. Take the baseline from `HEAD` before changing anything and attribute nothing to this diff without an A/B. | Standing hazard, not scope. |

## 6. Pre-read rule bundle

Read these and only these before implementing (`docs/rule-index.md` → **UI / Layout / Component → mixed migration**,
plus the always-required set):

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `docs/critical-flow-registry.md` — the two rows named in §3.9 only
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md`
- `docs/component-rules.md`
- `docs/ui-rules.md` — routing and legacy-boundary notes only
- `docs/qa-rules.md`
- `docs/storybook-governance.md` — §14.9 (per-story viewports) and §15 (the manifest gate) only
- `docs/binding-decisions.md` — D28, D34, D36, D37; plus D69-25 / D69-27 in `MantineListingDetailPattern.tsx`'s own comments
- `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` — D71-1, D71-2, D71-3

At source, before writing: `MantineListingDetailPattern.tsx`, `MantineListingContactPattern.tsx`,
`MantineListingGalleryPattern.tsx`, `ListingsPageFrame.tsx` (+ its `.module.css`), `ListingDetailView.tsx`,
`ListingDetailView.stories.tsx`, `ListingDetailPattern.stories.tsx`, `ListingsPageFrame.stories.tsx`,
`GalleryStaticFrame.tsx`, `GalleryIsland.tsx`, `presentationEngine.ts` (`DetailFeature` / `DetailAttribute`),
`ListingFeatureIcon.tsx`, `src/app/[locale]/listings/[slug]/page.tsx`,
`src/app/admin/listings/[id]/preview/page.tsx`, `src/app/[locale]/listings/page.tsx`.

## 7. Scope

- `src/modules/listings/components/ListingDetailView.tsx` — the whole file, including `SimilarListingsSkeleton`,
  the breadcrumb block, the staff preview banner and the page wrapper.
- `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` — extends **E1-E5** only.
- `src/modules/listings/components/ListingsPageFrame.tsx` — extend **E6** only.
- `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` — one story state per extend.
- `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx` — one story state for E6.
- `src/modules/listings/components/ListingDetailView.stories.tsx` → moved and retitled to
  `src/stories/patterns/mantine/ListingDetailView.stories.tsx`.
- `scripts/mantine-migration-scope.json` — one added entry.
- `docs/component-catalog.md` / `docs/component-coverage-matrix.md` — only the rows these changes make stale
  (Task 782's F4 is the precedent: a green `governance:components` does not prove a catalog row is current).
- `docs/backlog.md` (state), `docs/sessions/2026-XX-XX-task791-*.md` (session log).

## 8. Out of scope

`ListingContact.tsx` · `ListingGallery.tsx` · `LightboxView.tsx` · `GalleryStaticFrame.tsx` · `GalleryIsland.tsx` ·
`ListingBackButton.tsx` · `ListingStatusBanner.tsx` · `ListingReportDialog.tsx` · `ListingInquiryDialog.tsx` ·
`SaveToCollectionButton.tsx` · `FavoriteButton.tsx` · `MapWrapper` · `SimilarListingsView.tsx` /
`RecentlyViewedGridView.tsx` · `[slug]/loading.tsx` · `ListingMobileCTA.tsx` · every form and step file ·
`theme.ts` · `globals.css` · `docs/design-system.md` §22 · any route, query, server action or i18n message ·
the stale 56px clearance (§3.10) · the residual Tailwind utilities **inside** `MantineListingGalleryPattern.tsx`
and `MantineListingDetailPattern.tsx`'s own icon wrappers (`shrink-0 text-muted-foreground`) — pre-existing, not
introduced here, and not this task's to sweep.

**Do not** add a theme value, breakpoint, token or allowlist entry. **Do not** edit `ListingContact.tsx` for any
reason, including to make a slot fit — if it does not fit, that is a finding, not a licence.

## 9. Current and required behavior — visual source map and canonical UI decision record

These are the two artifacts `docs/orchestrator-ui-task-design.md` requires; read them as a continuation of §3.

### 9.1 Visual source map

| Visible artifact/state | Component/markup today | Class/selector | Token path | Disposition |
|---|---|---|---|---|
| Breadcrumb band | inline `<div>`/`<nav>` in `ListingDetailView.tsx` | `bg-muted/40 border-b`, `container-wide py-2.5`, `text-xs text-muted-foreground` | `--muted`, `--border` | **changed** → `ListingsPageFrame` (which resolves the identical `color-mix(in oklab, var(--muted) 40%, transparent)` + `1px solid var(--border)`) |
| Page container | `container-wide pt-4 pb-6` | Tailwind container utility | `--width-page-max` | **changed** → `ListingsPageFrame`'s `maw`/`px`/`py` |
| Bottom clearance | wrapper `pb-44 md:pb-20 lg:pb-8` | Tailwind spacing | none (raw) | **preserved at rendered value**, re-expressed in Mantine (R10) |
| Staff preview banner | inline `<div>` + `cn()` | `rounded-2xl border px-5 py-4 mb-6`, `bg-status-warning/10`…`bg-status-info/10` | `--status-warning`, `--status-info` | **changed** → Mantine `Alert`/`Paper` consuming the same two status custom properties; no re-picked colour |
| Content grid | `grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8` | Tailwind grid | none | **changed** → pattern `Grid` + E5 |
| Badges ×5 | `@/components/ui/badge` | `bg-badge-new/premium/reduced`, `variant="outline"` | `--badge-*` | **changed** → pattern's `BADGE_TONE_COLOR` (`green`/`yellow`/`sale`, `outline`+`gray` for type) — the owner decision of 2026-07-17 recorded in the pattern |
| Title / price / meta / features / description / amenities | inline markup | ~30 utilities | `--primary`, `--muted-foreground` | **changed** → pattern |
| Original-price line | `text-xs text-muted-foreground` | — | `--muted-foreground` | **changed** → pattern via **E4** |
| Gallery | `GalleryStaticFrame` + `GalleryIsland` + ids | `listing-gallery grid …`, `h-[var(--listing-gallery-h-*)]` | `--listing-gallery-h-mobile/tablet/desktop` (**defined** at `globals.css:313-315` — grepped, not read off a table) | **preserved verbatim** via **E1** |
| Contact sidebar + mobile bar | `ListingContact` | 75 utilities | — | **preserved verbatim** via **E2** |
| Map / report row / recently-viewed / similar | `MapWrapper`, `ListingReportDialog`, two Suspense slots | `rounded-2xl border bg-card shadow-sm p-5`, `flex justify-end` | `--card`, `--border` | **map card changed** → pattern-shaped `Paper withBorder radius="lg" p="lg"` inside **E3**; the three children themselves preserved |
| `SimilarListingsSkeleton` | inline | `h-7 w-48 … animate-pulse`, `grid … gap-4` | `--muted` | **changed** → Mantine `Skeleton` + `SimpleGrid` |

### 9.2 Canonical UI decision record

| Visible artifact | Searches and inspected paths | Canonical Mantine story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Detail content grid, badges, price, meta, features, description, amenities | `find src/design-system -type f`; consumer trace for `MantineListingDetailPattern` (§3.1); read `MantineListingDetailPattern.tsx` in full | `Patterns/Mantine/ListingDetailPattern` (`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`, `component: MantineListingDetailPattern`) | **extend** (E1-E5) | Extends land in the pattern with a story state each, **before** the consumer composes it; no registration change (the pattern is already in `src/design-system/mantine/**`) |
| Breadcrumb band + page container | `grep -rn "Breadcrumbs" src/ --include=*.tsx` → `ListingsPageFrame.tsx:50` is the only Mantine breadcrumb in the repo; read it and its module CSS in full | `Patterns/Mantine/ListingsPageFrame` | **reuse + extend** (E6) | Additive optional prop, default `[]` renders byte-identical output; one story state; `/listings` re-verified unchanged |
| Staff preview banner (2 variants) | `ls src/stories/mantine/primitives/` → `Alert.stories.tsx` exists | `Mantine/Primitives/Alert` | **reuse** | Consume the primitive with the existing `--status-warning` / `--status-info` custom properties; no local chrome |
| Similar-listings skeleton | `ls src/stories/mantine/primitives/` → `Skeleton.stories.tsx` exists; `src/design-system/mantine/skeleton-chrome.css` | `Mantine/Primitives/Skeleton` | **reuse** | Mantine `Skeleton` + `SimpleGrid`; no `animate-pulse` |
| Gallery, contact card, lightbox, dialogs, back button, status banner | consumer traces in §3.1-§3.5 | — | **out of scope, preserved** | Passed through slots (D71-3); owned by 792/793/794/795 |

**No artifact in this task requires a visual value with no canonical provenance.** There is no
`CANONICAL STYLE DECISION REQUIRED` here.

## 10. Implementation requirements — four gated phases, in this order

**Phase 1 — extend the canonical pattern (E1-E5) and prove each state standalone.**
`gallerySlot`, `contactSlot`, `contentFooter`, the `originalPrice` line and `sidebarFrom` land in
`MantineListingDetailPattern.tsx`. `contact` becomes optional and the component must throw no error and render no
empty sidebar when `contactSlot` is supplied instead. Add one story state per extend to
`ListingDetailPattern.stories.tsx`. **Defaults must leave the existing `Default` story rendering byte-identically** —
prove it, do not assert it.

**Phase 2 — extend `ListingsPageFrame` (E6) and prove `/listings` is unchanged.**
`intermediate` defaults to `[]`. Add a story state with two intermediate crumbs. Then re-render
`Patterns/Mantine/ListingsPageFrame` `Default` and the `/listings` route and show the breadcrumb DOM is unchanged.

**Phase 3 — compose in `ListingDetailView.tsx`.**
Replace the breadcrumb block + `container-wide` wrapper with `ListingsPageFrame`; replace the content grid with
`MantineListingDetailPattern`; map `DetailFeature` → `{ icon: <ListingFeatureIcon name={f.icon} />, label: t(f.labelKey), value: f.value }`
and `DetailAttribute` → `{ label: t(a.labelKey), value: t(a.valueKey) }`; pass `gallerySlot`, `contactSlot`,
`contentFooter` (map card → report row → recently-viewed → similar-listings, in that order), `favorite` and
`sidebarFrom="lg"`. Convert the preview banner and `SimilarListingsSkeleton`. Remove the now-unused imports —
`Badge` from `@/components/ui/badge` first. Keep `cn` only if something still uses it; if nothing does, remove it.

**Phase 4 — story move, manifest, gates.**
`git mv` the story to `src/stories/patterns/mantine/ListingDetailView.stories.tsx`, retitle to
`Patterns/Mantine/ListingDetailView`, keep the three states and the fixture. Add the component path to
`scripts/mantine-migration-scope.json`. Run the full gate set (§13) and reconcile every new finding.

**A phase does not start until the previous one's evidence exists.** If Phase 1 shows an extend cannot be made
without changing the pattern's existing rendered output, stop and report it as a design blocker — do not absorb
the difference in the consumer.

## 11. Positive and negative flows

**Positive flow.** A guest opens `/sq/listings/<slug>` on a 390px phone: breadcrumbs render four levels and wrap
rather than clip; the LCP cover paints from the SSR HTML before hydration; the interactive gallery replaces the
static frame with no layout shift; badges, title, price (with struck-through old price, per-m² and the
original-price line), meta row, key-features card, description, additional details and map render in one column;
the report row, recently-viewed and similar-listings follow inside that same column; the fixed mobile contact bar
sits at the bottom with the page's clearance reserved for it. The same page at 1280px shows the content column
beside a sticky contact sidebar. The same slug at `/admin/listings/<id>/preview` shows the staff banner above the
grid and every action inert.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | This task changes no form, action or schema | N/A | — |
| Authorization / RLS | **No** | No query, action or visibility predicate is touched; `isListingVisible` and the `effective*` staff-preview guards are moved verbatim | Staff-preview inertness unchanged | AC7 asserts the four `effective*` values still gate the same nodes |
| Offline / network | **No** | No new fetch; the existing `getListingOwnerContact` call lives in the untouched `ListingContact` | Existing global behavior | — |
| Concurrent writer | **No** | No write path | N/A | — |
| **Empty / zero states** | **Yes** | `features.length === 0`, `detailAttrs.length === 0`, `!listing.description`, `!listing.lat/lng`, `images.length <= 1`, `!listing.location` | Each card/row is omitted exactly as today; no empty `Paper`, no orphan divider, no stray gap | AC7 — rendered, one story state or one route render per branch |
| **Long-locale overflow** | **Yes** | `uk` and `it` labels at 320px — the repo's standing hardest cell | Breadcrumb and badge rows wrap; no horizontal scroll | AC1/AC14 + the owner matrix |
| **Hydration** | **Yes** | §3.9 | Zero hydration/console errors on the detail route | AC11 |
| **Stacking** | **Yes** | §3.9, Task 612 | Lightbox still paints above header and sticky contact card | AC12 |

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final diff, *when* `Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern 'className='` and `-Pattern '@/components/ui/'` are run, *then* both return **zero** matches. Quote both transcripts.
- **AC2 [R2]** — *Given* the migrated file, *when* its JSX is read, *then* the content grid is a single `<MantineListingDetailPattern …>` element and the file declares no `Grid`, `Grid.Col`, `Paper`, `Badge`, `SimpleGrid` or `Divider` of its own for that region.
- **AC3 [R3]** — *Given* `intermediate` defaults to `[]`, *when* `Patterns/Mantine/ListingsPageFrame` `Default` and the `/sq/listings` route are rendered before and after, *then* the breadcrumb subtree's serialized DOM is **identical**. Retain both serializations, not a claim of sameness.
- **AC4 [R4]** — *Given* the rendered detail route, *when* the SSR HTML is fetched with JS disabled, *then* it contains the preload `<link>`, `id="gallery-static-frame"` with its `<img fetchpriority="high">`, `id="gallery-btn-placeholder"` and `id="gallery-interactive-shell"` carrying its hidden state; *and when* JS runs, the static frame is removed and the interactive shell revealed. Both halves proven from the same seeded slug.
- **AC5 [R5]** — *Given* the final `ListingDetailView.tsx`, *when* grepped, *then* it contains no `'use client'` and no `use[A-Z]` React hook call.
- **AC6 [R6]** — *Given* `sidebarFrom="lg"`, *when* the route is rendered at **768**, **1023** and **1024**, *then* below 1024 the layout is a single column with no empty sidebar track, and at 1024 the sidebar carries the rendered contact card. Measure the sidebar column's rendered width at each width; do not eyeball it.
- **AC7 [R7]** — *Given* the seven empty/zero branches in §11, *when* each is rendered, *then* the corresponding card or row is absent with no residual gap, and every control listed in R7 is present in the non-empty case. *And* on `/admin/listings/<id>/preview`: the report trigger, favorite and inquiry trigger are absent/inert exactly as today, and both banner variants render above the grid.
- **AC8 [R8]** — *Given* the moved story, *when* `npm run check:story-coverage` runs, *then* it exits 0 **and** its output lists `src/modules/listings/components/ListingDetailView.tsx` as covered. `Listings/ListingDetailView` no longer exists as a title; the three state names are unchanged.
- **AC9 [R9]** — *Given* the manifest entry, *when* `node scripts/check-design-tokens.mjs --strict --scope=mantine` runs, *then* it exits **0**. Record the pre-fix finding list for the two newly-scoped files as well as the post-fix result; a zero that was zero before the file entered scope proves nothing.
- **AC10 [R10]** — *Given* the route at 390px, *when* the document's bottom clearance is measured before and after, *then* the rendered value is **unchanged** at base, `md` and `lg`. Report the three measured pairs.
- **AC11 [R5, R11]** — *Given* `npm run build` then `npm run start`, *when* `/sq/listings/<slug>` and `/en/listings/<slug>` are requested, *then* both return **200** with the listing title present in the returned HTML; *and* `HYDRATION_LISTING_PATH=/en/listings/<slug> BASE_URL=http://localhost:3000 npm run check:hydration` exits 0. A green `npm run build` alone does **not** satisfy this (D71-1).
- **AC12 [R11]** — *Given* the migrated grid, *when* the lightbox is opened at 390 and 1280 in `sq` and `uk`, *then* it paints above the site header and above the sticky contact card. Assert the computed stacking outcome, not the source `z-index`.
- **AC13 [R12]** — *Given* the retitled story, *when* `npm run check:locale-leak:mantine-only` runs, *then* every finding new to this diff is listed and classified as fixture proper-noun / genuine leak / loanword, with the `messages/*.json` evidence for each. No fixture string is translated and no baseline is updated.
- **AC14 [R1]** — *Given* the route and the story, *when* rendered at **320** in `uk`, *then* there is no horizontal scroll and no clipped breadcrumb or badge.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It is a migrated page shell plus a major responsive layout change on a route
rendered by two entry points. It is **not `Q4`**: no critical-flow registry row, owner component, action or write
path changes (§3.9) — but both named flows are re-proved as required evidence anyway (AC11, AC12).

**Windows-native PowerShell only.** Record `node.exe -p process.platform` (must be `win32`), the Node version, the
working directory, the exact command and the real exit code for every line. A result from any other platform is an
environment screen, not evidence.

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npm.cmd run check:locale-leak:mantine-only
npm.cmd run check:i18n
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run governance:components
npx.cmd vitest run src/modules/listings
npm.cmd run test:listings
npm.cmd run build-storybook
node scripts/task791-detail-evidence.mjs
npm.cmd run build
npm.cmd run start   # then AC11's four requests + check:hydration
```

Build `scripts/task791-detail-evidence.mjs` on the shape of `scripts/task785-inert-media-evidence.mjs`: a static
server over `storybook-static`, named per-check records, expectations read from `theme.ts` at runtime, and a
`results.json` plus screenshots retained under `docs/sessions/evidence/task791/`. It owns AC3's two DOM
serializations, AC6's sidebar widths, AC10's clearance pairs and AC12's stacking assertions. Read `EXIT_CODE` from
inside each log, never from a wrapper's.

**Baselines before you change anything:** `git show HEAD:docs/backlog.md | Measure-Object -Line` for the backlog
count, and one `npm.cmd run test` run recorded as the pre-existing red baseline (Task **790**: 5 failures / 4
files). Attribute nothing to this diff without an A/B.

**`OWNER VISUAL QA REQUIRED`** — D71-2. Automated capture cannot close any of these:

| Story / surface | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingDetailView` | `PublicListing` | sq, en, uk, it | 320, 390, 768, 1024, 1440 |
| `Patterns/Mantine/ListingDetailView` | `StaffPreviewUnpublished`, `StaffPreviewPublished` | en, uk | 390, 1024 |
| `Patterns/Mantine/ListingDetailPattern` | `Default` + one state per extend (E1-E5) | en, uk | 390, 768, 1280 |
| `Patterns/Mantine/ListingsPageFrame` | `Default` + the E6 state | uk | 320, 1024 |
| Live route `/{locale}/listings/{slug}` | guest | sq, uk | 390, 1280 |
| Live route `/admin/listings/{id}/preview` | staff | en | 1280 |

## 14. Completion report contract

Report, and nothing weaker:

1. **Files changed and files moved**, as a table matching the real `git status --short`.
2. **Requirement IDs completed** (R1-R12) and, for each, the acceptance criterion that closed it.
3. **Commands run with their actual exit codes**, platform, Node version and working directory.
4. **The E1-E6 record**: for each extend, the pattern diff, its story state, and the proof that the pre-existing
   default output is byte-identical.
5. **AC3's two DOM serializations**, **AC6's measured sidebar widths**, **AC10's three clearance pairs**,
   **AC4's SSR-HTML excerpt and post-hydration state**, **AC11's request transcripts and hydration exit code**,
   **AC12's stacking results**.
6. **AC9's pre-fix and post-fix scoped-detector output**, with every removed utility named.
7. **AC13's locale-leak classification table** with `messages/*.json` evidence per row.
8. `results.json` and screenshot paths under `docs/sessions/evidence/task791/`.
9. **Assumptions, deviations, known limitations, unresolved issues** — including anything A1/A2/OQ1 turned out to
   under-specify.
10. Status: `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. **Never** an
    approval. Update `docs/backlog.md`'s state concisely and write the detailed session log; Opus consolidates.

## 15. Task quality gate

Checked before publication; every answer is yes.

- **Executable cold?** Yes — every file path, prop name, token, command, story title and DOM id above was read at
  source on 2026-09-05; no hidden chat context is required.
- **Every requirement binary and verifiable?** Yes — R1-R12 each map to at least one `Given/when/then` criterion
  with a named artifact.
- **Scope protects existing behavior?** Yes — §8 names what must not change, and R4/R6/R7/R10 are preservation
  requirements with rendered proofs, not assertions.
- **Canonical-first?** Yes — §9.2 records `reuse` for the breadcrumb frame, the Alert and the Skeleton, `extend`
  for the two canonical sources this consumer proves incomplete, and **no** `create canonical`. No local style is
  authorized anywhere.
- **Permanent-story gate?** Yes — every story addition is a state on an **existing** canonical story, justified by
  an in-scope visible production consumer (this route). The moved story is a retitle of the component's own
  existing story, not a new artifact. No probe markup is proposed, so no restoration evidence is required.
- **Story source-of-truth?** Yes — the corresponding story is neither declared out of scope nor replaced by a
  route-only proof; it moves with the migration and keeps all three states (R8/AC8).
- **Detector-aware?** Yes — §3.8 reads `check-story-coverage.mjs`, `mantine-story-scope.mjs` and
  `check-design-tokens.mjs` at source and states the consequence *before* the requirement, which is why the whole
  file is in scope rather than only its grid. `--scope=mantine`'s finding count is labelled `UNKNOWN 1` with an
  I0 re-measure, not asserted.
- **Absence claims traced?** Yes — the three "zero production consumers" claims (§3.1) enumerate and classify every
  hit including the `ListingsActionRow.tsx` comment; `originalPriceLabel`'s dead-field claim (E4) quotes its single
  grep hit and its declaration line.
- **Negative flows chosen by applicability?** Yes — four marked `No` with their reason, four marked `Yes` with
  evidence.
- **Nothing claimed uninspected?** Yes — `--listing-gallery-h-*` was grepped in `globals.css` (`:313-315`), not
  read off a documentation table; `MantineRootProvider`'s root-layout mount was grepped (`src/app/layout.tsx:50`)
  rather than assumed from the homepage.
- **Gates prove the changed behavior?** Yes — AC3, AC4, AC6, AC10 and AC12 are measurements of the exact things
  this diff can break; AC9 explicitly rejects a zero taken before the file entered scope.
- **Owner-only exceptions?** None claimed. A1/A2 are labelled reversible assumptions; OQ1 is answered by
  preservation; the visual deltas go to the owner's matrix under D71-2.
- **Worktree?** Clean at `10271f95a` when this was written; the executor re-snapshots `git --no-optional-locks
  status --porcelain` before its first write and reconciles against it.
- **Post-revision consistency?** Every §-reference, phase number and AC id was re-read after the final edit.

---

`FACTS` — the canonical detail/contact/gallery patterns exist and have zero production importers · the file is a
Server Component rendered by two routes · `MantineRootProvider` is in the root layout · the pattern splits at `md`
while production splits at `lg` and `ListingContact`'s sidebar is `hidden lg:block` · `originalPriceLabel` is
declared and never read · the manifest gate requires a canonical-titled static import · `--scope=mantine` is the
union of manifest ∪ `design-system/mantine/**` ∪ canonical stories · `--listing-gallery-h-*` are defined at
`globals.css:313-315` · `ListingsPageFrame` renders the only Mantine breadcrumb in the repo · `bottom-14` survives
in two files after Task 787 · `ListingMobileCTA` has zero consumers.

`INFERENCES` — composing the pattern unchanged would render an empty sidebar column between 768px and 1023px
(from the two breakpoint facts) · adding the file to the manifest makes its surviving Tailwind utilities detector
findings (from the scope union) · therefore the whole file, not only its grid, is in scope.

`UNKNOWNS` — the scoped detector's finding count for the two newly-scoped files (I0 re-measure) · whether the
retitled story adds `--mantine-only` rendered-matrix failures.

`CONFLICTS` — None.

**Task path:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_791_ListingDetailView_Canonical_Mantine_Composition.md`
**QA profile:** `Q3` · **Ambiguous/conflicting requirements:** none · **Owner decision still needed:** none to
start; A1 (sidebar breakpoint) and A2 (title size, page gutters) are reversible assumptions the owner confirms or
returns through the §13 visual matrix at review.

---

## 16. Revision 1 — orchestrator review verdict (2026-09-05)

**Decision: `NEEDS REVISION`.** The implementation was inspected at source, not from the report. E1-E6, the
composition, the Server-Component boundary and the LCP subtree are correct. The task is returned on **evidence**,
on **three stale gate transcripts**, and on **one raw-dimension expression the scoped detector structurally cannot
see** — not on the design.

### 16.1 Closed by the review — do NOT redo any of this

| Item | Reviewer's evidence |
|---|---|
| E1-E5 on `MantineListingDetailPattern` | Diff read in full. Defaults preserved: `sidebarFrom='md'` reproduces the exact prior literals; `gallerySlot ?? <MantineListingGalleryPattern>`; `contactSlot ?? (contact && …)`; `{contentFooter}` renders no node when undefined; E4 gated on both fields. |
| E6 on `ListingsPageFrame` | `intermediate = []` default; `.map` over `[]` emits nothing between the home `Anchor` and the current `Text`. |
| R2 | `VERIFIED` — the content region is one `<MantineListingDetailPattern>`; no local `Grid`/`Paper`/`Badge`/`SimpleGrid`/`Divider`. |
| R5 | `VERIFIED` — no `'use client'`, no hook; `build.log` exit 0 with `/[locale]/listings/[slug]` compiled as `ƒ`. |
| R8 implementation | `VERIFIED` — new story is `Patterns/Mantine/ListingDetailView` with all three states; colocated file gone; manifest entry present. The 7 surviving `Listings/ListingDetailView` hits are **all historical** (a Task 741 before-snapshot Storybook build, three old locale-leak logs, two old session logs) — classified, none live. |
| R11 | `VERIFIED` and **fresh** — `build.log` (11:40:53) and `hydration.log` (11:42:38) both post-date the final source edit (11:32:32); hydration PASS 5 / FAIL 0 / SKIP 2 with `Listing detail (/en/listings/11-mr7ucly4) … PASS`. |
| **The R1/R4 contradiction — ACCEPTED** | Verified at source, not from the report: `ListingGallery.tsx:49-51` does `document.getElementById('gallery-interactive-shell')` then `shell.classList.remove('hidden')`. A literal class-name lookup; no other mechanism is findable by that call. **The exception stands as written.** The kickoff's R1 is the defect, not the implementation — see §16.4. |
| **`ListingFeatureIcon.tsx`'s `size?: number` — ACCEPTED** | Additive, optional, `className` path untouched, and **required** by R1 once the icon lost its only sizing mechanism. Authorized retroactively into §7 Scope. |
| **`messages/{en,sq,uk,it}.json` — ACCEPTED** | Inspected: 11 additive keys per locale, **all** under `storybook.mantine`, zero removals, four-locale parity, `check:i18n` exit 0. Story sections cannot carry captions any other way in this repo. §8's blanket "any i18n message" was the defect — see §16.4. |
| **`Alert color="yellow"/"blueLight"` — ACCEPTED, and §9.1 was wrong** | `theme.ts:1152` records the project's own §6l Alert mapping verbatim: *"warning→yellow, error→red, info→blueLight"*. This is the canonical semantic path, **not** a re-picked colour. The kickoff's §9.1 instruction to consume `--status-warning`/`--status-info` directly is superseded by that mapping. |
| Value preservation | `iconSize.compact`=14 ≡ `h-3.5`; `iconSize.roomy`=20 ≡ `h-5`; `spacing.sm`=12px ≡ `mt-3`; skeleton `p="sm"`/`gap="xs"` ≡ `p-3 space-y-2`. Read from `theme.ts:348-360,429-441`. |

### 16.2 Blocking findings

**F1 · P2 · [R9, AC9] · `src/modules/listings/components/ListingDetailView.tsx` (page wrapper `Box`)**
*Observed:* `pb={{ base: 176, md: 80, lg: 32 }}` — three raw pixel literals in a manifest-registered
`--scope=mantine` file, while `design-tokens-scoped2.log` reports `0 violations, exit 0`.
*Expected:* R9 — "any surviving raw dimension is removed, not allowlisted".
*Evidence:* read at source. `check-design-tokens.mjs:271` (`raw-dimension-prop`) requires `prop=\{-?digits\}` —
a bare literal in **single** braces; `pb={{` fails it. `:287` (`raw-inline-dimension`) keys on **CSS** property
names; `base`/`md`/`lg` are not among them. Neither arm can match this expression. The gate's zero is truthful and
proves nothing here.
*Impact:* Task 784's landed standard ("zero raw design dimensions in the current Mantine scope") is false for this
file and no control can say so. This is not an executor defect — R10 required the exact rendered values and the
kickoff named no mechanism.
*Resolution:* **superseded by owner decision D71-4 (2026-09-05) — see §16.8.** No marker, no CSS-module length: every
one of the three values becomes a token, and the two that have none are **created** in `theme.ts`.
*Verification:* §16.8's three checks — a grepped definition line, a source grep proving no numeric literal survives in
the `pb` expression, and unchanged rendered `padding-bottom` at 390/768/1280 from the §16.3 evidence script.
*Detector gap filed as **797**.*

**F2 · P2 · [R3, R6, R7, R10, AC3·AC6·AC10·AC12·AC14] · missing rendered evidence**
*Observed:* `scripts/task791-detail-evidence.mjs` was not written. AC3's two DOM serializations, AC6's sidebar
widths at 768/1023/1024, AC10's three computed-style pairs, AC12's stacking result and AC14's 320/uk overflow have
no measurement. What exists is `curl`/RSC-payload corroboration of the **values passed**, which is a different
evidence layer from the geometry those criteria name.
*Expected:* §13's evidence script, built on `scripts/task785-inert-media-evidence.mjs`'s shape.
*Impact:* AC6 is the criterion that exists because §3.6 predicted an empty sidebar column; it is currently unmeasured.
AC12 guards a `docs/critical-flow-registry.md` row. Neither can close on inference.
*Resolution:* build the script; it owns AC3, AC6, AC10, AC12, AC14 and F1's verification. Retain `results.json` +
screenshots under `docs/sessions/evidence/task791/`.
*Verification:* the five criteria return measured values with their raw before/after retained, per-cell.

**F3 · P2 · [R8, R1] · three stale gate transcripts**
*Observed:* the final source edits are `ListingDetailView.tsx` **11:32:22** and
`src/stories/patterns/mantine/ListingDetailView.stories.tsx` **11:32:32**. But `lint.log` is **11:29:39**,
`check-stories.log` **11:29:47** and `check-story-coverage.log` **11:29:55** — all three predate those edits.
*Expected:* review clause 6 / the evidence-freshness rule: a transcript certifies the diff it was run against.
*Evidence:* filesystem mtimes, read directly.
*Impact:* AC8 (P0, R8) currently rests on a transcript taken before the story file's last write. The result will
very likely be identical — but "very likely" is not evidence, and this is the exact substitution the protocol
forbids.
*Resolution:* re-run all three natively against the final diff and replace the logs.
*Verification:* each new log's mtime post-dates every changed source file, and each ends `EXIT_CODE=0`.

**F4 · P2 · [R12, AC13] · `check:locale-leak:mantine-only` never completed**
*Observed:* `locale-leak.log` ends at the run header (`Mantine selected: 100 … Output: .screenshots/locale-leak/2026-09-05T11-33/`)
with no summary and **no `EXIT_CODE` line**. The executor reported this honestly.
*Impact:* enrolling `Patterns/Mantine/ListingDetailView` puts an Albanian production-shaped fixture into the
locale-leak scope for the first time; AC13 exists to classify what that surfaces.
*Resolution:* re-run to completion; classify every finding new to this diff as fixture proper-noun / genuine leak /
loanword with its `messages/*.json` evidence. **Do not translate a fixture string and do not update a baseline**
(Task 736's standing precedent).
*Verification:* a complete log with an exit code, plus the classification table in the session log.

**F5 · P2 · state drift — `tasks/Sprints/Sprint_71_…md` Tasks table**
*Observed:* the sprint's Tasks table still read `KICKOFF FILED` while `docs/backlog.md` read
`PARTIALLY IMPLEMENTED`. The sprint file's own header declares that table the **single state source**.
*Impact:* this is the fourth-occurrence failure mode recorded in `docs/orchestrator-procedures.md` — it has already
offered approved-and-committed work to an executor twice.
*Resolution:* **already corrected by this review** in the same edit as the verdict. For the revision: when you
change state, change the backlog registry line, the backlog Last Session line **and** the sprint Tasks row together.
*Verification:* all three read the same state string.

### 16.3 Non-blocking findings

- **F6 · P3 · [AC4]** — the preload `<link>` moved inside `gallerySlot`, i.e. inside the client pattern's subtree.
  The session log asserts it is in the SSR HTML but the quoted `grep -c` shows **no output**, and nothing establishes
  it is hoisted to `<head>` rather than emitted in the body. React 19 does hoist it; that is an inference, not the
  measurement AC4 names. *Resolution:* have the evidence script assert the `<link rel="preload">` is a child of
  `<head>` in the served HTML. *Verification:* the assertion, retained.
- **F7 · P3 · [AC4]** — "hydration PASS ⇒ the `useEffect` ran ⇒ the swap completed" is an inference: the gate proves
  the absence of console errors, not that `#gallery-static-frame` was removed and the shell revealed. *Resolution:*
  assert both DOM states before/after hydration in the same script.
- **F8 · P3 · [§1]** — the session log's `Files Changed` table omits `docs/backlog.md`, which §11 says was edited and
  `git status` confirms. Same class as Task 788's returned two-row gap. *Resolution:* add the row.
- **NOTE** — `h={theme.other!.iconSize!.roomy}` sizes a **spacer** from the **icon** scale because both are 20px.
  Correct value, wrong semantic owner; the comment says so honestly. Not worth a token today. If Task 794 rebuilds
  this subtree, give the placeholder a real spacing token then.

### 16.4 Task-design defects in this kickoff — mine, recorded as such

1. **§8 fenced off "any i18n message" absolutely.** The story states R-required by E1-E6 cannot exist without
   `storybook.mantine.*` caption keys. §8 is amended: **storybook-namespace caption keys in all four locales are in
   scope**; production message namespaces remain out.
2. **§7 Scope omitted `ListingFeatureIcon.tsx`.** R1 removes the icon's only sizing path, so the additive prop was
   forced. Amended into scope.
3. **R1 vs R4 were unsatisfiable together.** R1 is amended to: *zero `className` **except** the single literal
   `hidden` on `#gallery-interactive-shell`, which `ListingGallery.tsx:51` removes by name.* Replacing that
   mechanism with a `data-` attribute + `querySelector` is **Task 794's** scope — it owns that file — and is not to
   be attempted here.
4. **R9 and R10 together permitted a detector-invisible literal, and §8's "do not add a theme value" made the only
   correct fix unavailable.** Both are amended by **D71-4** (§16.8): a raw px is never acceptable, a marker is not a
   substitute for a token, and creating a missing token is now required rather than forbidden.

### 16.5 Revision 1 verification plan — Windows-native PowerShell only

```powershell
node.exe -p process.platform
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:locale-leak:mantine-only
node scripts/task791-detail-evidence.mjs
npm.cmd run build
npm.cmd run start   # re-request /sq and /en detail routes; re-run check:hydration
```

Every log must post-date every changed source file. The owner visual matrix (§13) is untouched and still
`NOT VERIFIABLE` until the owner records accepted/returned per tuple.

### 16.6 Explicitly out of scope for Revision 1

`ListingContact.tsx` · `ListingGallery.tsx`'s swap mechanism (→ **794**) · the detector arm for responsive object
props (→ **797**) · the admin staff-preview render (AC7's second half stays `BLOCKED` until a verified staff session
exists — owner item, see the review's handoff) · anything in 792/793/794/795/796.

### 16.7 F3 and F4 closed by the owner's native run (2026-09-05, `win32`)

**F3 — CLOSED.** All three transcripts re-run against the final diff (source unchanged since 11:32:32):

| Command | Result | Bearing |
|---|---|---|
| `npm.cmd run lint` | 0 errors, 72 warnings — **none in any file this task changed**; every warning is in `.artifacts/`, `.screenshots/`, `docs/reviews/artifacts/`, `docs/sessions/evidence/`, `AdminUsersTable`, `MantinePagination.tsx`, `MantineListingCardPattern.smoke.test.tsx` or `visibility.test.ts` | R1 |
| `npm.cmd run check:stories` | 135 files, **0 violations**; Check 6 reports `storybook.*` 666 keys in each of sq/uk/it matching en | confirms the 11 added caption keys are parity-clean |
| `npm.cmd run check:story-coverage` | **27/27 covered, 0 enrolled-but-unproven** | **AC8 now has a fresh transcript — R8 `VERIFIED`** |

**F4 — CLOSED. AC13 classification (the run completed: `Mantine selected: 103`, 107 leaks).**

The +3 stories versus the aborted run (100 → 103) are exactly the three newly-enrolled
`Patterns/Mantine/ListingDetailView/*` states. **24 of the 107 cells are attributable to this diff; 83 are not** —
they sit in `Admin/AdminUsersTable`, `Mantine/Primitives/CountButton`, `Mantine/Primitives/FilterControls`,
`Patterns/Mantine/AuthSheet` ×2, `Patterns/Mantine/ListingsPageFrame` and `Patterns/Mantine/SaveSearchButton`, all
enrolled long before Task 791. The gate was already red; this diff did not turn a green gate red.

| Strings | Cells | Class | Evidence | Disposition |
|---|---|---|---|---|
| `Marker` · `Close popup` · `Zoom in` · `Zoom out` · `A JavaScript library for interactive maps` · `Leaflet` · `OpenStreetMap` | 7 × sq/uk/it = **21** | **Genuine leak, third-party origin** | None of the seven exists in `messages/*.json` (grepped). `src/components/shared/Map.tsx` sets only `attribution: '© <a …>OpenStreetMap</a>'` at `:31` and configures no `zoomInTitle`/`zoomOutTitle`/`closePopup`/aria strings — these are Leaflet's built-in English defaults, rendered on the live detail route in every locale | **Filed as Task 798.** `MapWrapper`/`Map.tsx` are out of scope here (§8) and must not be touched in Revision 1 |
| `Elira Hoxha` | 1 × 3 = **3** | Fixture proper noun | The story's own owner fixture | Allowlist via `PER_STORY_TOKENS`, Task 624's discipline. **Do not translate.** |
| `[it] "Home"` on `Patterns/Mantine/ListingsPageFrame/Default` | 1 | **Not introduced by E6** | The E6 section reuses the pre-existing key `storybook.mantine.listings_page_frame_home` (story `:48`, identical to section 1 at `:27`); `it.json`'s value is literally `"Home"` — an Italian loanword, inside Task **736**'s measured identical-to-en population. The two *new* E6 keys (`intermediate_1`/`intermediate_2`) are properly translated in all four locales and leaked **zero** cells | Leave. Belongs to 736, not here |

**Revision 1 therefore does not re-run locale-leak and does not touch any fixture string.** It records the
`PER_STORY_TOKENS` entry for `Elira Hoxha` and nothing else on this axis.

**Revision 1's remaining scope is now F1 + F2 only** (plus the P3 notes F6/F7/F8). §16.5's command list reduces to:

```powershell
node.exe -p process.platform
node scripts/check-design-tokens.mjs --strict --scope=mantine
node scripts/task791-detail-evidence.mjs
npm.cmd run build
npm.cmd run start   # re-request /sq and /en detail routes; re-run check:hydration
```

### 16.8 F1 — resolution replaced by owner decision **D71-4** (2026-09-05)

**Owner decision, verbatim:** *"Щоб не було сирих px, треба завжди використовувати токени (якщо нема токена —
створити)."*

This supersedes §16.2's F1 resolution and overrides the kickoff's §8 prohibition on new theme values **for this
task**. The rule is now: a raw pixel value is never acceptable in Mantine scope; if no token expresses it, the token
is **created**. A `design-tokens-allow` marker is not a substitute for a token — and in this specific case it was
never even a working one, because the detector cannot see the expression at all (F1).

#### The three values are two different contracts — do not tokenize them as one

| Breakpoint | Value | What it actually is | Token |
|---|---|---|---|
| `base` | 176px (`pb-44`) | Clearance reserved for `ListingContact`'s **fixed mobile bar** in its tall form — below `sm` the WhatsApp button occupies its own row beneath the price row (`ListingContact.tsx`, the `sm:hidden` WA block) | **create** |
| `md` | 80px (`md:pb-20`) | The same clearance for the bar's **short** form — from `sm` up, WA and Phone sit inline in the price row | **create** |
| `lg` | 32px (`lg:pb-8`) | **Not clearance at all.** The bar is `lg:hidden`, so nothing is reserved; this is ordinary page bottom padding | **exists** — `theme.spacing['2xl']` = `2rem` = 32px (`theme.ts:358`, grepped) |

Tokenizing all three as one "clearance" triple would encode a false contract and would make Task 793 — which
deletes the bar — delete a value that is still needed at `lg`.

#### Where the two new tokens go, and why there

`theme.other.layout` (`theme.ts:136-141` type, `:482-487` values) is the established home for exactly this: one-off
named layout geometries, each carrying its own cited source, added by Task 784 D69-18. Its four existing members
(`authFormMaxWidth`, `emptyStateMinBlockSize`, `listingContactStickyOffset`, `footerGridGap`) each document the file
and line the number came from. Follow that convention literally, including the citation comment.

Nesting is already precedent in `theme.other` (`overlay.dragHandle.{width,height}`), so:

```ts
// type augmentation, beside the existing layout members
layout: {
  authFormMaxWidth: number
  emptyStateMinBlockSize: number
  listingContactStickyOffset: number
  footerGridGap: number
  /** Task 791 (owner decision D71-4) — bottom clearance reserved for ListingContact's
   *  `lg:hidden fixed` mobile contact bar. base = the pre-migration `pb-44` (11rem = 176px),
   *  the bar's tall form (WhatsApp on its own row below the price row, `sm:hidden`);
   *  md = the pre-migration `md:pb-20` (5rem = 80px), the short form (WA + Phone inline).
   *  Owned together with the bar: Task 793 deletes both or neither. */
  listingContactBarClearance: { base: number; md: number }
}
```

```ts
// values
listingContactBarClearance: { base: 176, md: 80 },
```

Consumed as:

```tsx
pb={{
  base: theme.other!.layout!.listingContactBarClearance.base,
  md:   theme.other!.layout!.listingContactBarClearance.md,
  lg:   '2xl',
}}
```

`theme` is already imported in `ListingDetailView.tsx` as the direct `theme.ts` import — the Server-Component-safe
path (R5). **Do not** introduce `useMantineTheme()` here.

If mixing a numeric breakpoint value with a spacing-token string in one responsive object does not resolve
correctly, the fallback for `lg` is `'var(--mantine-spacing-2xl)'` — still a token reference, never `32`. Prove
which form you used with the rendered check below; do not switch silently.

#### Do not "fix" the neighbours while you are in there

- `theme.other.layout.listingContactStickyOffset` is **80** as well. It is the sidebar's sticky **top** offset at
  `lg`, a different contract that merely shares a number. **Do not reuse it** and do not merge the two.
- `h={theme.other!.layout!.iconSize!.roomy}` on the gallery spacer (§16.3 NOTE) sizes a spacer from the **icon**
  scale. Under D71-4 that is now the same class of defect — but the placeholder is Task **794**'s subtree and
  changing it here would touch out-of-scope markup. **Leave it, and say so in the completion report.** If 794 does
  not rebuild it, it needs its own token then.
- `ListingMobileCTA.tsx`'s `bottom-14` and `ListingContact.tsx:309`'s `bottom-14` are **793**'s (and a Sprint 57
  candidate). Out of scope.

#### Verification — three checks, and the gate is not one of them

F1 exists precisely because `check:design-tokens --scope=mantine` reported `0 violations` over a file containing
three raw pixels. A green scoped run is therefore **not** evidence for this requirement. Required instead:

1. **The definition is implemented, not documented.** Quote the matched line:
   ```powershell
   Select-String -Path src\design-system\mantine\theme.ts -Pattern 'listingContactBarClearance'
   ```
   Both the type augmentation and the value hit must appear. Zero matches on either = the token does not exist.
2. **No literal survives at the consumer.** Quote the matched line:
   ```powershell
   Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern 'pb=\{\{'
   ```
   The matched expression must contain no bare number, and `176`/`80`/`32` must not appear anywhere in the file:
   ```powershell
   Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern '\b(176|80|32)\b'
   ```
3. **The rendered value did not move.** `getComputedStyle(...).paddingBottom` on the page wrapper at **390 / 768 /
   1280**, before and after, must be `176px / 80px / 32px` in both. This is AC10's own measurement — the §16.3
   evidence script (F2) owns it, so F1 and F2 close together.

Additionally: extend `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` with a runtime assertion that
`theme.other.layout.listingContactBarClearance` equals `{ base: 176, md: 80 }`. **That file is currently red** — its
`:257-259` `footerGridGap` substring assertion is Task **790**'s, broken by the Task 784 hotfix's non-null
assertions. **Do not fix 790's failure here.** Add your assertion, report the file's pre-existing failure separately,
and do not let a red file become a reason to skip the new coverage.

#### Scope amendments this decision forces

- **§7 Scope** gains `src/design-system/mantine/theme.ts` (two additions to `other.layout`) and
  `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` (one added assertion).
- **§8 Out of scope**'s "**Do not** add a theme value, breakpoint, token or allowlist entry" is amended to: *do not
  add a **breakpoint** or an **allowlist entry**; adding a **token** is required wherever a raw value would
  otherwise survive (D71-4).*
- **R9** is restated: *no raw pixel value remains in the file; every dimension is a theme token, a Mantine spacing
  token, or a created token — proven by source grep, not by the detector's exit code.*

---

## 17. Revision 1 — orchestrator review verdict (2026-09-05)

**Decision: `PARTIALLY VERIFIED`.** Every code-level requirement is now closed against inspected evidence. The one
thing missing is the owner's D71-2 visual matrix, which no automated result may replace. **No code change is
requested.**

### 17.1 F1 — CLOSED

| Check (§16.8) | Result |
|---|---|
| Definition implemented, not documented | `theme.ts:146` (type) and `:493` (value) — `listingContactBarClearance: { base: 176, md: 80 }`, with the required citation comment. Read at source. |
| No literal survives at the consumer | `grep -nE '\b(176\|80\|32)\b' ListingDetailView.tsx` → **no match anywhere in the file.** Verified by the reviewer, independently of the executor's own grep. |
| Rendered value unchanged | `results.json`: `paddingBottom` = **176px @390 · 80px @768 · 32px @1280**, exactly the pre-migration `pb-44`/`md:pb-20`/`lg:pb-8`. |
| Two contracts, not one | `lg` consumes the pre-existing `2xl` spacing token; `listingContactStickyOffset: 80` was **not** reused. Confirmed in the diff. |

The `!` deviation the executor flagged (`theme.other!.layout!.listingContactBarClearance!.base`) is a non-null
assertion, not a cast, and matches this file's established idiom. Accepted.

**Beyond what was asked:** a `CONTRACT_CONSUMERS` row was added to `theme.d69-18.test.tsx`, wiring the new token
into the repo's existing mechanical consumer check. Right instinct — see the P3 below on its punctuation.

### 17.2 F2 — CLOSED

`scripts/task791-detail-evidence.mjs` exists and its `results.json` carries **12/12 real measurements**, not
assertions:

- **AC10** — the three clearance values above.
- **AC6** — at 768 and 1023 the columns stack and the sidebar column's height is **0** (no dead gutter — the exact
  failure §3.6 predicted); at 1024 they sit side by side with the contact card visible and the sidebar measuring
  **319.98px**, i.e. the pre-migration fixed `320px`. This is the strongest single result in the task.
- **AC12** — `elementFromPoint` at the header's and the sticky card's coordinates returns nodes **inside** the
  lightbox dialog at 390/1280 × sq/uk. A computed occlusion outcome, not a source `z-index` read, which is what the
  criterion asked for.
- **AC14** — no overflow at 320/uk.
- **AC3** — live `/listings` breadcrumb vs the story's Default: structurally identical skeletons (936 vs 931 chars,
  same tag/attribute shape).

### 17.3 The defect Revision 1 found — and the review that missed it

`FACT`: `docs/sessions/evidence/task791/start.log` — a **Revision 0** artifact — contains three occurrences of
`⨯ Error: Functions cannot be passed directly to Client Components`. `start-rev1.log` contains **zero**. That is a
complete controlled A/B, and it establishes that during Revision 0 the detail route was erroring on every request:
`galleryLabels.counter` is an arrow function, and the object was passed from a Server Component into the
`'use client'` pattern.

**This is a reviewer failure, recorded as one.** The Revision 0 review marked **R11 `VERIFIED`** on an HTTP 200,
the listing title present in the response, and `check:hydration` PASS. All three were true and none of them proved
the route rendered — and the disproof was sitting in the same evidence directory, in a log whose body the review
never opened. The executor's framing ("invisible to `check:hydration`'s short wait window") is right about the
*gates* and too generous about the *evidence*: the artifact existed and was not read. The durable lesson is filed
in `docs/orchestrator-procedures.md`.

The fix itself is correct and minimal: `galleryLabels` is no longer constructed or passed (it was already dead in
this consumer — `gallerySlot` is always supplied), and the prop became optional on the pattern with the internal
branch keeping `galleryLabels!` for the story path that still supplies it.

### 17.4 Findings

**Blocking: none.**

- **P3 · new** — `theme.d69-18.test.tsx`'s new `CONTRACT_CONSUMERS` row asserts the literal strings
  `theme.other!.layout!.listingContactBarClearance!.base/.md`, **including the `!` punctuation**. That is precisely
  the brittleness Task **790** exists for: the same file's `footerGridGap` row is red today only because the Task
  784 hotfix added `!`s the assertion did not expect — and that failure reproduced in this very run
  (`vitest-theme-d69-18-rev1.log`: 57 passed, 1 failed, and the failure is `footerGridGap`, not the new assertion).
  *Resolution:* assert `listingContactBarClearance` without the surrounding punctuation, so the row survives a
  formatting change. *Verification:* remove one `!` locally, confirm the row still passes, restore.
- **P3 · F6 / F7 carried forward** — the preload `<link>`'s presence in `<head>` and the static-frame-removal /
  shell-reveal DOM pair are still not asserted; §13.4 says so honestly. Both are cheap additions to the now-existing
  evidence script whenever it is next touched — **794** owns that subtree.
- **F8 — CLOSED.** `docs/backlog.md` now appears in the session log's Files Changed table.
- **Retracted by the reviewer:** a preliminary finding that the full `lint` transcript was stale (12:15 vs the
  13:34 edits) was **withdrawn on the adversarial pass** — session log §13.2 records
  `npx.cmd eslint theme.ts MantineListingDetailPattern.tsx ListingDetailView.tsx theme.d69-18.test.tsx → 0 errors`,
  run after the fix, which covers every changed source file. Untouched files cannot have changed. `check:stories`
  and `check:story-coverage` are likewise stale-but-immaterial: Revision 1 changed no story file, and both gates
  read only stories and their imports.

### 17.5 Requirement coverage after Revision 1

`VERIFIED`: R2 · R3 · R4 · R5 · R6 · R8 · R9 · R10 · R11 · R12 · E1-E6 · AC3 · AC6 · AC8 · AC9 · AC10 · AC12 · AC13 · AC14.
`VERIFIED with the accepted exception`: R1 (one `className="hidden"`, §16.1).
`PARTIALLY VERIFIED`: R7 — the public route is measured; the `/admin/listings/[id]/preview` half stays **BLOCKED**
on a verified staff session (owner item, unchanged).
`NOT VERIFIABLE`: the D71-2 owner visual matrix — **the only thing gating approval.**

### 17.6 What unlocks `APPROVED`

1. The owner walks §13's matrix in `storybook-static` and on the live route, recording **accepted** or **returned**
   per tuple. Sprint 70's Task 787 is the precedent: owner records the matrix, then the task is approved.
2. Nothing else. No command, no code change. If the owner returns a tuple, that becomes Revision 2's scope.

A commit/push handoff is **not** emitted here — the decision is not an approval, and the rule holds even when the
remaining gap is an owner action rather than a defect.

---

## 18. Owner visual review (2026-09-05) — D71-2 partially recorded, and Revision 2

The orchestrator ran the live-route sweep (uk + sq at 320/390/768/1024/1280/1440, computed-style measurements,
`localhost:3000` on the Revision-1 build) and the Storybook sweep (`localhost:6006`, owner-started). That sweep is
**triage, not the D71-2 record** — it surfaced four items; the owner decided all four. Decisions below are the
record.

### 18.1 Measured and confirmed correct — no action

| Property | Measured | Verdict |
|---|---|---|
| Page clearance | **176 / 80 / 32 px** at 390 / 768 / 1280 | matches the token exactly |
| Sidebar gate | side-by-side from **exactly 1024**; right column height **0** below it | no dead gutter — the §3.6 hazard did not materialise |
| Horizontal overflow | none at 320 × uk (`scrollWidth` 320) | AC14 independently reconfirmed |
| Breadcrumbs | 4 levels, wrap to 2 lines at 320, no clipping | correct |
| LCP swap | interactive gallery grid present after hydration | correct |
| `ListingsPageFrame` story | sections 1-2 keep the **1-anchor** shape; section 3 (E6) has **3 anchors** | E6 additive, default unchanged |
| `ListingDetailPattern` story | **6** grids; exactly **one** (E1) lacks the internal Mantine gallery | slots behave as specified |

A suspected regression — the back button looking centred at 320 — was **measured and withdrawn**: the button is
288px wide because `max-sm:w-full` is baked into every shadcn button size variant (`ui/button.tsx:24-28`), the
project's own <640 full-width gate. Its containment is identical before and after the migration.

### 18.2 Owner decisions

| # | Item | Decision |
|---|---|---|
| 1 | Card radius **24px → 8px** (`--radius: 0.75rem` ⇒ `rounded-2xl` = 24px; measured 8px now). Originates in `MantineListingDetailPattern`'s `radius="lg"` (Task 616), **not** in Task 791 — first visible now that the pattern has a consumer. Note `theme.ts:380` annotates `'2xl'` as the Card/Paper radius. | **ACCEPTED as-is (8px).** No change. The theme annotation/pattern mismatch is left standing by owner decision; do not "correct" it in a later slice without a new owner decision. |
| 2 | Sidebar width: fixed `320px` → proportional (`318px` @1024, **`437px`** @1440) | **ACCEPTED as-is (proportional).** |
| 3 | `h1`: was 24px <640 / 30px ≥640, now **36px at every width** | **RETURNED — must be 32px at ≤640px.** → Revision 2, §18.3. |
| 4 | Mobile contact bar sat at `bottom: 56px` (Task 787 residue) | **RETURNED, and the one-line half is already fixed** — §18.4. |

Items 1 and 2 are hereby `accepted` for every tuple that depends on them. The remaining D71-2 tuples —
staff-preview states, `en`/`it`, and the live admin preview — are **still unrecorded**.

### 18.3 Revision 2 — the only code requirement

**R13 (P2, owner instruction 2026-09-05).** The listing-detail `h1` renders at **32px below the `sm` gate** and
keeps the current **36px** at and above it.

- The heading lives in `MantineListingDetailPattern` (`<Title order={1} size="h2">`), so the change lands in the
  **canonical pattern** and reaches every consumer.
- **32px does not exist in any scale** — grepped: `fontSizes` stops at `xl` = 20px; `headings.sizes` runs
  48 / 36 / 30 / 24 / 20 / 18. Under **D71-4** the token is therefore **created**, not written as a literal.
  Preferred home: `theme.other.layout.listingDetailTitleMobileFz: '2rem'`, following the Task 784 D69-18
  convention (one-off named geometry, citation comment naming this owner decision). If a responsive `fz` cannot
  take that value cleanly, the fallback is a named `fontSizes` step added through the existing
  `MantineThemeSizesOverride` augmentation — the `micro: '0.625rem'` precedent. **Never a raw `32` or `'2rem'` at
  the call site.**
- Shape: `fz={{ base: <created token>, sm: <the h2 value> }}`. `theme.breakpoints.sm` is `'40em'` = **640px**,
  annotated in `theme.ts:329` as the *"P0 mobile gate (< sm = full-width required)"*.
- ⚠️ **Reversible assumption, flagged for the owner:** Mantine's `sm` is a `min-width: 40em` query, so it applies
  **from** 640px — the split is 32px at **<640** and 36px at **≥640**. The owner said "≤640". Honouring "≤640"
  literally would need a new breakpoint at 641px, which §8 still forbids and which contradicts the project's own
  `<640` mobile gate. Implemented as `<640`; say so in the report, and the owner can return it.
- **Proof required:** rendered `fontSize` on the real `h1` at **639px → 32px** and **640px → 36px**, both retained;
  plus the same two cells added to the canonical `Patterns/Mantine/ListingDetailPattern` story evidence. Extend
  `scripts/task791-detail-evidence.mjs` — it already exists and already measures computed styles.
- Out of scope for Revision 2: everything in §16.6, plus items 1 and 2 above (accepted).

### 18.4 The bar fix already applied by the orchestrator — and the half that is not

Under the owner's explicit authorisation ("можеш сам виправити, якщо це однорядкова правка"), `ListingContact.tsx`
line 309 changed `fixed bottom-14 md:bottom-0` → `fixed bottom-0`. That is the whole one-line half.

**It is not the whole fix, and the measurement says so.** At 390px the bar is **134px tall** and sat **56px** up, so
it occupied **190px** from the viewport bottom while the page reserves **176px** — the content was *already* 14px
short today. With the bar at `bottom: 0` it occupies 134px against a 176px reservation, leaving **~42px of dead
tail** — the exact defect Task 787's exit criterion 3 names.

The paired clearance value was **not** changed, deliberately: `listingContactBarClearance` must be re-derived from
the bar's real height across its states (guest CTA vs. phone + WhatsApp + message; `sq` vs `uk` label lengths),
not by subtracting 56 from 176 on the strength of one guest-state listing. **That re-derivation is Task 793's**, and
793's row now carries these numbers.

`ListingMobileCTA.tsx:70` still carries `bottom-14` and was deliberately left alone: the component has **zero
consumers** (re-measured 2026-09-05), so editing it would add diff noise to a file that is a deletion candidate.

**Verification owed for the applied edit (owner-native, Windows PowerShell):**

```powershell
npm.cmd run build
npm.cmd run start   # then /uk/listings/<slug> at 390 — the bar's bottom edge must sit on the viewport bottom
```

---

## 19. Revision 2 — executor completion report (2026-09-06)

Executor: fresh Sonnet session. Platform `win32`, Node `v22.22.3`, working directory
`C:\Claude_Code_Projects\lero-al`. Scope: §18.3's R13 only — "the only code requirement" the owner
visual review left open. Items 1/2 (§18.2) stayed accepted-as-is; §18.4's bar fix was already applied
externally before this session started and was not touched.

### 19.1 What changed

- **`src/design-system/mantine/theme.ts`** — added `listingDetailTitleMobileFz: string` to the
  `MantineThemeOther.layout` type augmentation (citation comment naming R13/D71-4/the h1 contract)
  and `listingDetailTitleMobileFz: '2rem'` to the `other.layout` value object, beside the existing
  five `layout` members.
- **`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx`** — the `h1`
  (`<Title order={1} size="h2">`) gained `fz={{ base: theme.other!.layout!.listingDetailTitleMobileFz,
  sm: 'var(--mantine-h2-font-size)' }}`. `size="h2"` is kept (owns `--title-fw`/`--title-lh`, which
  `fz` does not touch — confirmed from `@mantine/core`'s own `Title` source, `getTitleSize`
  computing `--title-fw`/`--title-lh`/`--title-fz`, with the `fz` style prop's `--fz` output taking
  precedence for `font-size` only). `theme` was already in scope (`const theme = useMantineTheme()`,
  pre-existing in this `'use client'` pattern) — no new import, no new hook.
- **`scripts/task791-detail-evidence.mjs`** — extended with four new checks: the `h1`'s rendered
  `fontSize` at `SM_GATE_PX - 1` (639) and `SM_GATE_PX` (640), read from `theme.ts`'s own
  `breakpoints.sm` comment (`'40em', // 640px`), on both the live route (`r13-h1-live-*`) and the
  canonical `Patterns/Mantine/ListingDetailPattern` `Default` story (`r13-h1-story-*`). Expected
  values (32px / 36px) are read from `theme.ts` at run time (`listingDetailTitleMobileFz` and
  `headings.sizes.h2.fontSize`), never duplicated as bare literals. One bug found and fixed in the
  same session, not a product defect: the initial story-side selector (`document.querySelector('h1')`)
  matched Storybook's own hidden `sb-nopreview_heading` `<h1>` (14px) instead of the pattern's
  `Title` — narrowed to `h1.mantine-Title-root` on both the live and story checks.

### 19.2 Requirement / AC coverage

| ID | Status | Evidence |
|---|---|---|
| **R13** | `VERIFIED` | `theme.ts` grep (below) + `scripts/task791-detail-evidence.mjs` `r13-h1-live-639/640` and `r13-h1-story-639/640`, all `pass:true` |

### 19.3 Verification — commands, exit codes, `win32`, Node `v22.22.3`

```
node.exe -p process.platform                                          → win32
npm.cmd run typecheck                                                  → exit 0
npx.cmd eslint theme.ts MantineListingDetailPattern.tsx               → exit 0 (0 errors)
npm.cmd run build                                                      → exit 0
npm.cmd run build-storybook                                            → exit 0
npm.cmd run start  (background, fresh build)                          → Ready
node scripts/task791-detail-evidence.mjs                              → exit 0, 16/16 checks pass
node scripts/check-design-tokens.mjs --strict --scope=mantine         → exit 0 (0 violations)
npm.cmd run check:story-coverage                                       → exit 0 (27/27 covered)
HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4 BASE_URL=http://localhost:3000 npm.cmd run check:hydration
                                                                        → PASS 5 / FAIL 0 / SKIP 2, exit 0
npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx
                                                                        → 57/58 (1 pre-existing Task 790
                                                                          `footerGridGap` failure, file
                                                                          untouched, unchanged from Rev. 1)
npx.cmd vitest run src/modules/listings                                → 559/561 (2 pre-existing
                                                                          `ListingCard.smoke.test.tsx`
                                                                          failures, Task 790, file
                                                                          untouched, unchanged from Rev. 1)
```

Direct measurement (before formalizing into the evidence script), live route, `/en/listings/11-mr7ucly4`:

```
$ node -e "…" (Playwright)
639 → 32px
640 → 36px
```

`scripts/task791-detail-evidence.mjs` final run — the four new checks:

```
✅ r13-h1-live-639:  {"pass":true,"width":639,"expectedPx":32,"measured":{"fontSize":"32px"},"measuredPx":32}
✅ r13-h1-live-640:  {"pass":true,"width":640,"expectedPx":36,"measured":{"fontSize":"36px"},"measuredPx":36}
✅ r13-h1-story-639: {"pass":true,"width":639,"expectedPx":32,"measured":{"fontSize":"32px"},"measuredPx":32}
✅ r13-h1-story-640: {"pass":true,"width":640,"expectedPx":36,"measured":{"fontSize":"36px"},"measuredPx":36}
```

All 12 Revision 1 checks (AC3/AC6/AC10/AC12/AC14) re-verified green in the same run — Revision 2 did
not regress them.

Definition-implemented check (same pattern §16.8/§17.1 already established for `listingContactBarClearance`):

```powershell
Select-String -Path src\design-system\mantine\theme.ts -Pattern 'listingDetailTitleMobileFz'
theme.ts:155:      listingDetailTitleMobileFz: string
theme.ts:503:      listingDetailTitleMobileFz: '2rem', // 32px — Task 791 R13
```

### 19.4 Assumptions, deviations, limitations

- **The `<640` vs "≤640" gap named in §18.3 is unresolved by design**, exactly as the kickoff
  flagged it: Mantine's `sm` breakpoint is a `min-width: 40em` media query, so `fz`'s `sm` arm
  necessarily applies *from* 640px, making the split `<640` / `≥640`, not `≤640` / `>640`. Adding a
  new breakpoint for the literal one-pixel difference would need §8's forbidden new breakpoint. Left
  as `<640`, reported here for the owner to confirm or return, per the kickoff's own instruction not
  to resolve it unilaterally.
- No change to items 1 (radius) or 2 (sidebar width) — both accepted as-is, out of scope for
  Revision 2 by §18.3's own line.
- No change to `ListingContact.tsx`, `ListingMobileCTA.tsx`, or any file in 793's scope — the
  `bottom-14`→`bottom-0` one-line fix visible in `git status` was applied externally before this
  session and is untouched by it.
- `theme.d69-18.test.tsx`'s pre-existing P3 finding (§17.4 — the `CONTRACT_CONSUMERS` row for
  `listingContactBarClearance` asserting literal `!` punctuation) was **not** addressed — §18.3
  names R13 as "the only code requirement" for Revision 2, and that P3 belongs to a different token.

### 19.5 Files changed this revision

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R13 — new `other.layout.listingDetailTitleMobileFz` token |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | R13 — `h1` gains responsive `fz` |
| `scripts/task791-detail-evidence.mjs` | R13 — four new checks (live + story, 639/640) |
| `docs/backlog.md` | state update (Last Session line, Sprint 71 registry line) |
| `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` | Tasks table row updated to match |
| `tasks/Sprints/Sprint_71_kickoff_prompt_Task_791_…md` | this §19 |
| `docs/sessions/2026-09-05-task791-listingdetailview-canonical-mantine-composition.md` | §14 addendum |
| `docs/sessions/evidence/task791/*` | fresh Revision 2 logs + updated `results.json` + new screenshots |

### 19.6 Status

**`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.** No self-approval. Opus should independently
inspect: whether `fz` overriding only font-size while `size="h2"` still supplies weight/line-height is
the correct mechanism (versus, say, a full responsive `size` override, which Mantine's `Title` does
not support responsively); the `<640`-vs-"≤640" flag in §19.4; and whether the remaining D71-2 owner
visual-matrix tuples (staff-preview states, `en`/`it`, live admin preview — §18.2's closing line) are
this task's to keep open or should move into 792-796.

---

## 19. Revision 2 — orchestrator review verdict (2026-09-06)

**Decision: `PARTIALLY VERIFIED`.** R13 is **`VERIFIED`** — implemented correctly and independently re-measured by
the reviewer. Nothing further is asked of the executor. The task stays below approval on two gaps that are not code:
three unrecorded D71-2 tuples and the still-blocked admin-preview render.

### 19.1 R13 — VERIFIED, and re-measured rather than accepted

| Check | Reviewer's own result |
|---|---|
| Token implemented, not just documented | `theme.ts:155` (type) and `:503` (`'2rem'` — 32px) — grepped, both hits quoted |
| No raw value at the call site | `grep -nE "\b32\b\|'2rem'" MantineListingDetailPattern.tsx` → **no match** |
| Consumer shape | `:189` — `fz={{ base: theme.other!.layout!.listingDetailTitleMobileFz, sm: 'var(--mantine-h2-font-size)' }}` |
| **Rendered at 639px** | **32px**, `font-weight: 700`, `line-height: 40px` — measured by the reviewer on the running server |
| **Rendered at 640px** | **36px**, `font-weight: 700`, `line-height: 45px` — same |
| ⚠️ **Does the CSS variable actually resolve?** | `--mantine-h2-font-size` computes to **`2.25rem`** on `:root`. It is a real declaration, not a silent fallback — the check exists because `docs/orchestrator-procedures.md` records `--z-sticky` riding through two approvals as a value that was tabled and never defined |
| `size="h2"` still supplies weight and rhythm | Yes — the inline style keeps `--title-fw`/`--title-lh` bound to the h2 vars, and the line-height scales with the overridden size (1.25 × 32 = 40, 1.25 × 36 = 45) |
| Evidence script | 4 new R13 checks; `results.json` now **16/16**, and its measured values (32/32/36/36) match the reviewer's independent capture exactly |
| Script bug found and fixed by the executor | Storybook's own `sb-nopreview_heading` `<h1>` is present-but-hidden and was being matched; the selector is now `h1.mantine-Title-root`, with the reason recorded in the script. **Correctly reported rather than quietly patched** |

**Freshness — the failure mode this task was returned for twice does not recur.** Every source last changed at
07:51-07:56; every retained log is 07:57-08:02. All post-date the diff.

Gates: `typecheck` · `lint` · `check:design-tokens --scope=mantine` · `check:story-coverage` · `build` ·
`check:hydration` · the evidence script — **all `EXIT_CODE=0`**. `vitest theme.d69-18` exits 1 on **1 failed / 57
passed**, identical counts to Revision 1, and the single failure is Task **790**'s `footerGridGap` substring
assertion — inspected by name, not inferred from the count.

The `<640` / `≤640` deviation was flagged by the executor exactly as §18.3 instructed. **Confirmed as correct:**
honouring "≤640" literally needs a breakpoint at 641px, which §8 forbids and which contradicts `theme.ts:329`'s own
`"< sm = full-width required"` mobile gate. The owner may still return it; it is a one-value change.

### 19.2 Findings

**Blocking: none.**

- **P3 (new)** — the created token has **zero** assertions in `theme.d69-18.test.tsx` (grep count 0), while the
  clearance token created hours earlier has both a value assertion and a `CONTRACT_CONSUMERS` row. §18.3 did not
  require it, so this is not a contract breach — but Task **793** deletes the clearance token, which would leave
  that file with no coverage of any Task 791 token at all. *Resolution:* add the same two arms for
  `listingDetailTitleMobileFz`, asserting the substring **without** the `!` punctuation (see the standing P3 from
  §17.4 — 790 exists because of that brittleness). *Verification:* the two new arms pass; the suite's failure count
  stays at Task 790's one.
- **NOTE** — `sm: 'var(--mantine-h2-font-size)'` restores exactly what `size="h2"` would have produced, so the two
  must agree if `size` is ever changed. It is the tightest coupling Mantine's responsive `fz` allows (a
  base-only `fz` applies at every width, so the `sm` arm is mandatory). Acceptable; worth one line of comment.
- **NOTE** — the story-side R13 check reads the **first** `h1.mantine-Title-root`, i.e. section 1 of six. All six
  render the same pattern so the value is representative, and the live-route arm covers production regardless.
- **F6 / F7 carried unchanged** (preload in `<head>`; the swap's DOM pair) — P3, owned by **794**.

### 19.3 What still stands between this task and `APPROVED`

Neither item is executor work.

1. **Three D71-2 tuples the owner has not recorded.** The 2026-09-05 review covered the public listing surface and
   produced four decisions. **Not yet looked at:** `Patterns/Mantine/ListingDetailView` → `StaffPreviewUnpublished`
   and `StaffPreviewPublished` (en, uk), and the `en`/`it` locales of `PublicListing`. The staff banner is a
   **changed** artifact — a bespoke `div` became a Mantine `Alert` with the `yellow`/`blueLight` semantic mapping —
   and no one has seen it rendered. These are four cells in the Storybook already running.
2. **R7's admin-preview half stays `BLOCKED`** — `/admin/listings/[id]/preview` renders this same view, and there
   is still no verified staff session. Unchanged since Revision 0; an owner/environment item, not a defect.

When both close, the task is `APPROVED` and the commit/push handoff is emitted then — not before.

---

## 20. R13 WITHDRAWN, D71-2 largely closed, and what the owner's review exposed (2026-09-06)

### 20.1 R13 withdrawn by the owner — reverted by the orchestrator

Owner: *"краще залишити h2=36px, щоб не ускладнювати життя."* R13 is withdrawn. Reverted in place:

- `MantineListingDetailPattern.tsx` — the `fz={{ base: …, sm: 'var(--mantine-h2-font-size)' }}` override and its
  comment are gone; the title is `<Title order={1} size="h2" style={{ wordBreak: 'break-word' }}>` again.
- `theme.ts` — `listingDetailTitleMobileFz` (type + value + doc comment) deleted.
- `scripts/task791-detail-evidence.mjs` — the four R13 checks and the constants they read are removed.

⚠️ **The revert reproduced the deletion hazard within minutes of the review naming it.** The evidence script does
`if (!titleFzMatch) throw new Error(...)`, so removing the token from `theme.ts` alone left the script **throwing at
startup** — a green-looking task with a harness that cannot run. Caught and cleaned in the same edit; `node --check`
parses. **This is the third instance in this task of "a deletion leaves live references no gate sees"** (782-F4,
788, now here) and the reason Task 793's R9 exists.

The standing P3 about the token's missing test assertion is **moot**: the token no longer exists.

**Verification owed, Windows-native — the parse check was run in the Linux bridge VM and is not repository evidence:**

```powershell
npm.cmd run typecheck
npm.cmd run lint
node scripts/check-design-tokens.mjs --strict --scope=mantine
node scripts/task791-detail-evidence.mjs      # must be 12/12 again, not 16/16
npm.cmd run build
```

### 20.2 D71-2 — what the owner's screenshots actually close

The owner reviewed and supplied rendered evidence at 1280px:

| Tuple | Evidence | Result |
|---|---|---|
| `ListingDetailView/PublicListing` × **sq** × 1280 | Storybook screenshot | **accepted** |
| `ListingDetailView/StaffPreviewPublished` × **en** × 1280 | Storybook screenshot — the migrated **Mantine `Alert`** renders with the `blueLight` info mapping, the "Published — the public page is live" copy and the "Open public page" link | **accepted** |
| **Live `/admin/listings/<id>/preview`** × en × 1280 | real browser, real staff session, real listing | **R7's admin half is no longer `BLOCKED`** — the route renders the migrated view, and the staff-preview inertness holds visibly: no report link, no "Send message", no favorite (`effectiveListingId` is `undefined` by design, Note 14) |

Still unrecorded: `StaffPreviewUnpublished`, and the `en`/`it` locales of `PublicListing`. **But see §20.4 — the
viewport half of every D71-2 tuple has never been reviewable at all.**

### 20.3 "The favorite is missing" — measured, and it is not a divergence

The owner reported the favorite absent in both the story and the admin preview while present in production.
Inspected at source:

- `FavoriteButton` is gated on `listingId`. `ListingDetailView.stories.tsx` sets `isGuest: true` and
  **`listingId: undefined` in all three states** (`:164-167`, `:187-188`, `:199-200`), so no story has ever rendered
  a favorite.
- The admin preview sets `effectiveListingId = undefined` **deliberately** — Note 14's staff-preview inertness.
- Production shows the favorite only for an authenticated viewer. As a guest, production shows none either.

`FACT`: the story imports the **real** production component —
`import { ListingDetailViewBody } from '@/modules/listings/components/ListingDetailView'` (`:5`). That import is
what `check:story-coverage` verifies. **The component is shared; the props are not.** Nothing has diverged.

**The real defect is coverage, and it is genuine:** the only authenticated state of this view — the one that has a
favorite — has never had a story. Filed as **800**.

### 20.4 ⚠️ The Storybook viewport switcher does not resize the preview — P1, filed as 799

Reproduced by the reviewer, independently of the owner's report: loading
`/?path=/story/patterns-mantine-listingdetailview--public-listing&globals=viewport.value:mobile390` leaves
`#storybook-preview-iframe` at **`width: 1280px`** (inner document 1274px), wrapper `transform: none`. The owner
reports the toolbar control behaves the same way. `.storybook/preview.tsx`'s `VIEWPORTS` map is correctly shaped
(every entry has `styles: { width, height }`), so the fault is in the addon wiring, not the values.

**Why this matters far beyond one story:** D71-2 asks the owner to accept or return each
story × state × locale × **viewport** tuple, and `docs/qa-profiles.md` makes rendered widths the core of `Q2`-`Q4`.
**Every viewport dimension of every owner visual review to date was unreviewable through this UI.** Owner reviews
were, in practice, single-width. Automated evidence is unaffected — `scripts/task791-detail-evidence.mjs` drives
Playwright contexts with real viewport sizes and never uses the addon — which is why its numbers stood up to
independent re-measurement, and why nothing already approved is invalidated. But the owner-facing half of the QA
profile has been running blind on width since it was written.

---

## 21. FINAL VERDICT — `APPROVED WITH NOTES` (2026-09-06)

The owner ran the full verification block natively (`win32`). Every result matched what the review predicted:

| Check | Result |
|---|---|
| `typecheck` | clean |
| `lint` | **0 errors**, 72 pre-existing warnings, none in a file this task touched |
| `check:design-tokens --strict --scope=mantine` | **0 violations**, 73 files in scope |
| `check:file-integrity` | 90 files clean |
| `check:mojibake` | 0 artifacts / 3930 files |
| `build` | exit 0; `/[locale]/listings/[slug]` and `/admin/listings/[id]/preview` both compile as `ƒ`, 661 kB each |
| `task791-detail-evidence.mjs` | **12/12** — exactly 12, which is itself the proof that the R13 revert was complete; a leftover would have shown 16 |
| `curl` `/uk` + `/sq` detail routes | **200 / 200** |
| Mobile bar at 390 | owner-confirmed flush to the viewport bottom, no gap |

**Decision: `APPROVED WITH NOTES`.** Every requirement R1-R12 is verified; R13 was withdrawn by the owner and
reverted; R7's admin half was closed by the owner's live staff-session render, which also showed the Note 14
inertness holding. No P0/P1/P2 finding remains open.

**Why this is not held for the last D71-2 cells.** Unreviewed: `StaffPreviewUnpublished`, and the `en`/`it` cells of
`PublicListing`. Two reasons they do not block:

1. The **viewport** dimension of every tuple is structurally unreviewable until Task **799** is fixed — the
   Storybook switcher does not resize the preview. Holding a finished migration on evidence the tooling cannot
   produce is a stall, not a gate.
2. What those cells would show has been reviewed in its production form: the staff-preview *route* was rendered live
   with a real staff session and accepted, and the locale dimension was accepted on the live route in `sq` and `uk`
   plus Storybook in `sq` and `en`.

Carried as a **P3 note**, not a condition: when 799 lands, glance at `StaffPreviewUnpublished` — it is the same
`Alert` with `color="yellow"` instead of `blueLight`. If it is wrong it is a one-token fix, filed on its own.

### 21.1 Notes carried out of this task

- **P3** — `theme.d69-18.test.tsx`'s `CONTRACT_CONSUMERS` row for `listingContactBarClearance` asserts the `!`
  punctuation (§17.4). Task **793** deletes that token and the row with it; nothing to do here.
- **P3** — F6 / F7 (preload `<link>` in `<head>`; the gallery swap's before/after DOM pair) remain unasserted →
  **794**.
- **P3** — `StaffPreviewUnpublished` / `en` / `it` visual cells, above → after **799**.
- **Filed by this task's review, all live:** **797** (the detector cannot see responsive object props),
  **798** (Leaflet's English chrome), **799** (Storybook viewport switcher), **800** (stories share the component
  but not the state).

### 21.2 The owner's new requests are NOT 791 regressions

Raised on the final screenshots, and each routed to where it belongs:

1. **The favorite button is still in the contact card** — correct for the current state of the code. Moving it
   beside the badges is **793's R2** (OD-2, already resolved in that kickoff in favour of D69-25). 791 never
   promised the move.
2. **"Share" must sit to the right of the favorite, beside the badges, at every breakpoint** — new instruction,
   same surface, added to **793's R2** in this same edit.
3. **The dom.ria-style page-feedback blocks and their admin moderation** — a feature, not a migration. Reserved as
   **801** (public blocks + data model) and **802** (admin moderation surface). They do **not** belong in Sprint 71,
   whose goal sentence is a de-Tailwind migration; mixing a feature in would break the same goal-fit discipline
   every sprint file in this repo opens with.
