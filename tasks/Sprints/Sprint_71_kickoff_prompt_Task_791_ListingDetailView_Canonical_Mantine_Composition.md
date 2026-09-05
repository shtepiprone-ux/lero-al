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
