# Task 1004 — The listing and favorites loading shells leave Tailwind, with one listing-card placeholder

Sprint 71. Priority P3. Owner decision: owner list item 4 (2026-11-19, translated), Task 792 review note N1: "loading.tsx
migrated only the Skeleton primitive; the route's layout classes stayed Tailwind. I confirm the implementer's reading:
R3 was worded more narrowly than R1/R2/R4, and the file is not in scripts/mantine-migration-scope.json. The full
de-Tailwind of this shell is a separate task, not a revision of 792." Plan files:
`tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md`, `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

After the task: the listing page's loading shell and the favorites page with its loading shell are built from the same
canonical frame and patterns as the pages they stand for, with no Tailwind class; every listing-card placeholder on the
site is one canonical skeleton, so loading and loaded states share one geometry.

## Cause

Read at `dc5e3af66`
- `src/app/[locale]/listings/[slug]/loading.tsx:26-52` lays out a Tailwind breadcrumb bar, container and grid (`bg-muted/40 border-b`, `container-wide`, `grid-cols-[1fr_320px]`), while the page itself renders `ListingsPageFrame` (`src/modules/listings/components/ListingDetailView.tsx:420-430`) and the pattern's spans (`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:152-155`); `:21-23` records that only the Skeleton moved (Task 792 R3).
- `src/app/[locale]/favorites/loading.tsx:1-31` uses the legacy `@/components/ui/skeleton` with Tailwind boxes; the page around it keeps a Tailwind breadcrumb (`src/app/[locale]/favorites/page.tsx:65-79`), found by the 1002 design.
- The card placeholder exists three times with its own geometry: `src/modules/listings/components/FeaturedListingsView.tsx:19` (`CardSkeleton`, `theme.other.listingSkeleton.featured`), `src/modules/listings/components/LatestListingsView.tsx:15` (`RowSkeleton`, `.latest`), `src/modules/listings/components/ListingDetailView.tsx:55-75` (`SimilarListingsSkeleton`), plus favorites' fixed `h-64` boxes, while all of them stand for the one canonical `MantineListingCardPattern`.

Fix: one card skeleton at the card's owner; the frame gains a loading crumb; the two shells and the favorites chrome are composed from the frame, the detail pattern's spans and the card track.

## Scope

- `src/design-system/mantine/patterns/MantineListingCardSkeleton.tsx` (CREATE beside the card pattern; geometry from one `theme.other.listingSkeleton` entry that replaces `featured` and `latest`) with its Story `src/stories/patterns/mantine/ListingCardSkeleton.stories.tsx`; `FeaturedListingsView`, `LatestListingsView` and `SimilarListingsSkeleton` render it; their local skeletons and CSS rules are deleted.
- `ListingsPageFrame.tsx`: EXTEND with `loading?: boolean`, which renders a Skeleton in place of the current crumb (labels stay translated text); its Story shows it.
- `MantineListingDetailPattern.tsx` exports its column spans (`listingDetailSpans(sidebarFrom)`), read by the page and the loading shell, so they cannot drift.
- `[slug]/loading.tsx`: `ListingsPageFrame loading` → back-button skeleton → a Mantine `Grid` with the exported spans → gallery placeholder (Mantine `SimpleGrid` with the gallery token heights `--listing-gallery-h-*`) and contact-card placeholder; no `className`.
- `favorites/page.tsx` chrome → `ListingsPageFrame`; `favorites/loading.tsx` → `ListingsPageFrame loading` and `MantineListingCardTrack` with `MantineListingCardSkeleton`; no `className`, no `@/components/ui`.
- `scripts/mantine-migration-scope.json` gains the three route files, so `check-enrolled-tailwind.mjs` keeps them off Tailwind.

## Attack surface

Attack surface: unchanged. Presentation of loading states and of the favorites page chrome only.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Cross_Site_Scripting_Prevention: not applicable — placeholders render no data; the frame's labels stay React text.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Database_Security: not applicable — "migration" here is the Tailwind to Mantine move; no database change.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Injection_Prevention: not applicable — the scope list is data read by check scripts; no interpreter input.
- JavaScript_and_TypeScript_Security: not applicable — layout components only; no merge, path setter or regular expression.
- Mass_Assignment: not applicable — no data is written by any surface of this task.
- Multi_Tenant_Security: not applicable — the favorites page keeps its signed-in data read unchanged.
- OS_Command_Injection_Defense: not applicable — no operating system process is started.
- Query_Parameterization: not applicable — no query is added or changed by this task.
- SQL_Injection_Prevention: not applicable — no SQL is added or changed by this task.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results — AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC2.

## UI

GR-0 queries: "listing card skeleton", "page frame loading", "detail loading". Inspected: `MantineListingCardPattern`,
`MantineListingCardTrack`, `ListingsPageFrame`, `MantineListingDetailPattern`, `MantineEmptyLoadingErrorState`, the three
local skeletons and their Stories. Decision: CREATE `MantineListingCardSkeleton`; EXTEND `ListingsPageFrame` and the
detail pattern (exported spans); REUSE the track and Mantine `Skeleton`, `Grid`, `SimpleGrid`. Reference research (GR-7):
inherited canonical design — owner decision 2026-10-20 (`ListingCardPattern`, `ListingsPageFrame`, `ListingDetailPattern`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/app/[locale]/listings/[slug]/loading.tsx — the listing loading shell; src/app/[locale]/favorites/page.tsx and loading.tsx — the favorites chrome and loading shell; src/design-system/mantine/patterns/MantineListingCardSkeleton.tsx — the card placeholder
- Component families: record-list-and-data, media-gallery-and-listing-contact
- Pattern IDs: linear-flow, record-card, grid-media-reflow
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-layout, android-adapt-layouts, android-layout-basics, w3c-focus-order, apple-hig-lists-tables, android-common-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineListingDetailPattern.tsx, src/design-system/mantine/patterns/MantineListingCardTrack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): one column, the gallery's main cell only, cards in the track's phone layout; 640px transition and the detail pattern's column switch as the loaded page
- Mobile order: breadcrumb → back → gallery → title lines → contact placeholder; favorites — breadcrumb → title → cards
- Required-content treatment: placeholders only, no text to wrap; each placeholder keeps the loaded element's box so nothing is clipped or shifted
- Story and verification: ListingCardSkeleton and ListingsPageFrame Stories at 320px, 639px, 640px and 1440px × sq, en, uk, it; loaded-vs-loading box comparison below

## Acceptance criteria

- AC1 One placeholder for the card — test: `src/design-system/mantine/patterns/__tests__/MantineListingCardSkeleton.test.tsx` (new): media at the token ratio and the line set; and `src/components/__tests__/cardSkeletonOwners.test.ts` (new): no `CardSkeleton`, `RowSkeleton` or local card placeholder remains; the three views render `MantineListingCardSkeleton`.
- AC2 The shells are canonical — test: `npm run check:enrolled-tailwind` passes with the three route files enrolled in `scripts/mantine-migration-scope.json` (it fails today on `[slug]/loading.tsx` once enrolled); `src/app/__tests__/loadingShells.test.tsx` (new): both shells render `ListingsPageFrame` with `loading`, no `className`; the detail shell uses `listingDetailSpans`.
- AC3 Loading matches loaded — test: `node scripts/check-homepage-grid.mjs` (extended with the ListingCardSkeleton Story): at 320, 640 and 1440 the skeleton card's outer box equals the loaded card's in the same track (±1px).
- AC4 Stories and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `npm run check:card-track-monotonicity` and the census of `.claude/rules/shared/rendered-state-census.md` for the new and changed Stories.
- AC5 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Branch from `main`. Read the two loading files, `favorites/page.tsx`, `ListingsPageFrame`, the detail pattern, the three views with their skeletons, `theme.other.listingSkeleton`, the scope gate and its JSON, the Stories.
2. Tests first (AC1-AC3); save each failing output.
3. The skeleton and its Story, the frame, the spans export, the two shells, the favorites chrome, the scope entries. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`.
5. Report: each command, exit code, relevant output. After the merge Opus throttles the network and watches `/uk/listings/<slug>` and `/uk/favorites` load at 390 and 1440.

## Review
