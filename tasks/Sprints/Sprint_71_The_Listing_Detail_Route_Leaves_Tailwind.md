# Sprint 71 — the listing-detail route leaves Tailwind, and the canonical patterns finally get a consumer

**Opened:** 2026-09-05 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Active tasks:** 1

> **Opened by owner instruction, 2026-09-05.** The owner audited the production graphs (not only Stories) and
> reported: Homepage and `/[locale]/listings` are Mantine; `/[locale]/listings/[slug]` and the
> `create` / `[slug]/edit` form family are not. He then chose the next slice — *"Detail content → канонічний
> pattern"* — and asked for **one** kickoff plus reserved numbers for the rest.
>
> The 2026-08-01 owner rule forbids a kickoff without a sprint. This file, the Task 791 kickoff,
> `docs/backlog.md`'s Sprints section + registry rows, and `docs/backlog-reserved.md`'s 792-796 rows were
> written in the **same edit**, per the 2026-08-10 fourth-occurrence corollary.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 791? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface, and **D28** binds it to mechanism-only changes at zero visual delta. 791 changes rendered chrome on a whole route by design. Down to three retained follow-ups (743/744/745). |
| **55** | ARIA semantics no gate sees | **No.** Semantics, not primitive ownership. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization/detector subject. |
| **57** | Delete what no longer earns its place | **No.** Pure removal, each item proven inert first. 791 must preserve every control it touches. (57 does gain a candidate from this sprint's census — see "Findings filed by this sprint's evidence pass" below.) |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection, not UI. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token-emission mechanism on the Homepage set. |
| **68** | `/listings` leaves Tailwind, one surface at a time | **No.** Route-scoped to the `/listings` **index**. Zero open tasks; awaiting closure on D68-2's final home. |
| **69** | `/listings` finishes the Mantine migration | **No.** Same route scope — its goal sentence is `/[locale]/listings` stops rendering any shadcn/Tailwind surface, and its Task 784 execution note fences off everything outside that route. `[slug]` is a different route with a different data path, a different LCP mechanism and a different critical-flow footprint. |
| **70** | The site chrome leaves Tailwind, and the mobile bar goes away | **No.** Chrome rendered on *every* route (header/footer/nav). 791 is page content on one route. 70 is still open for **789**. |

No open sprint fits. Opened 71.

## Goal

`src/modules/listings/components/ListingDetailView.tsx` — the view **both** `/[locale]/listings/[slug]` and
`/admin/listings/[id]/preview` render — stops being a Tailwind surface and composes the canonical Mantine
patterns that already exist for it, without moving the server/client boundary, without losing the LCP gallery
mechanism, and without touching the contact card, the gallery, the lightbox or the three legacy dialogs.

The narrower point this sprint exists to prove: **a canonical pattern with no production consumer is not a
migration — it is an unverified claim.** `MantineListingDetailPattern`, `MantineListingContactPattern`,
`MantineListingGalleryPattern`, `MantineFormSectionStack`, `MantineTwoColumnForm`, `MantinePageHeaderWithActions`
and `MantineEmptyLoadingErrorState` were all built, storied, reviewed and approved — and a consumer trace on
2026-09-05 found **zero production importers** for every one of them (only their own stories, the
`patterns/index.ts` barrel and `theme.ts`). Task 788 has just shown what that state costs: an entire primitive
barrel was built, reviewed, catalogued and then deleted unconsumed. The first consumer is where the pattern's real
gaps surface — 791's evidence pass already found five (§3.7 of its kickoff) before a line was written.

## Tasks

> **This table is the single state source for the sprint.** The execution-order section below is order and
> gating only; it carries no state.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **791** | `ListingDetailView` leaves Tailwind and composes the canonical Mantine detail pattern + `ListingsPageFrame`, with the LCP gallery and the contact card preserved as slots | **P1** | **Q3** | 🟡 **KICKOFF FILED** 2026-09-05 → [`Sprint_71_kickoff_prompt_Task_791_…`](Sprint_71_kickoff_prompt_Task_791_ListingDetailView_Canonical_Mantine_Composition.md) |
| **792** | Detail-route chrome: `ListingBackButton`, `ListingStatusBanner`, `[slug]/loading.tsx`, `SimilarListingsView` / `RecentlyViewedGridView` section wrappers | P2 | Q2 | ⬜ reserved — full text in `docs/backlog-reserved.md` |
| **793** | `ListingContact` → `MantineListingContactPattern`, **plus the stale 56px clearance** left by Task 787 | **P1** | Q3 | ⬜ reserved — full text in `docs/backlog-reserved.md` |
| **794** | Gallery + lightbox: `GalleryStaticFrame` / `ListingGallery` / `LightboxView` inner composition, LCP mechanism preserved | P2 | Q3 | ⬜ reserved — full text in `docs/backlog-reserved.md` |
| **795** | The three legacy dialogs: `ListingInquiryDialog`, `ListingReportDialog`, `SaveToCollectionButton` | P2 | Q4 | ⬜ reserved — full text in `docs/backlog-reserved.md` |
| **796** | `create` / `[slug]/edit`: `ListingFormShellView`, 5 steps, 10 field components, `ImageUpload`, cancel dialog | P2 | Q3 | ⬜ reserved — full text in `docs/backlog-reserved.md` |

## Execution order

**791 → 792 → 793 → 794 → 795 → 796**, and the order is by *what the next slice needs to already be true*, not by
size:

1. **791 first** because it establishes the route's grid, gutters and breadcrumb frame. Every later slice renders
   inside that frame; migrating a child before its container is how a component ends up tuned against a layout
   that is about to change.
2. **793 after 791** because the contact card's five divergences (791 §3.5) are only decidable once the sidebar
   column it sits in is Mantine-owned — and because deleting its fixed mobile bar changes the page's bottom
   clearance, which 791 preserves verbatim precisely so that 793 owns the decision.
3. **794 after 791** for the same reason, plus one of its own: the lightbox's stacking contract
   (`docs/critical-flow-registry.md`, Task 612) is asserted *against the sticky contact card*, so it must be
   re-proved after 793 moves that card, not before.
4. **795 and 796 are independent of each other** and of 792/794; both are gated only on 791 for the frame.

## Preconditions

- A production build that can be started (`npm run build` then `npm run start`) and served locally. **D70-1
  applies to this sprint verbatim** — see the binding decision below.
- A seeded listing reachable at `/{locale}/listings/{slug}` in all four locales, and a staff session that can
  open `/admin/listings/{id}/preview`. **Confirm both before dispatch, not at runtime.** Absent → the affected
  ACs finish `BLOCKED`, and the Storybook-provable ACs are still measured.
- Storybook builds (`npm run build-storybook`).

## Binding decisions

**D71-1 — D70-1 is inherited, not re-litigated.** `/[locale]/listings/[slug]` is a `ƒ` dynamic route, so
`next build` never server-renders it; Task 784's `FooterView.tsx` outage proved a green build is truthful and
irrelevant for this class. Every task in this sprint that edits a Server Component or a file it renders carries a
real `next start` request to the detail route as an acceptance criterion, until Task **786**'s detector lands.
`ListingDetailView.tsx` **is** a Server Component (verified 2026-09-05: no `'use client'`; its `ListingDetailView`
export is `async` and awaits `getTranslations`).

**D71-2 — the owner's visual matrix is the visual criterion.** `screenshots:assert` stays retired (owner decision
2026-09-03). For every changed visible artifact in this sprint the visual criterion is `NOT VERIFIABLE` until the
owner records accepted/returned per story × state × locale × viewport tuple.

**D71-3 — a slot is a preservation device, not a migration.** Where a task passes an unmigrated child through a
new pattern prop (791's `gallerySlot` / `contactSlot` / `contentFooter`), that child stays legacy **by design**
and is named with the reserved number that owns it. A review must not read a slotted legacy child as an
incomplete migration, and a task must not opportunistically migrate one.

## Findings filed by this sprint's evidence pass (2026-09-05) — not 791's scope

1. **Task 787 left two 56px clearances behind.** `ListingContact.tsx:309` and `ListingMobileCTA.tsx:70` still
   carry `bottom-14` (Tailwind 3.5rem = 56px), reserving space for the mobile bottom bar that 787 deleted on
   2026-09-05. 787's census could not see them: it grepped `--homepage-runtime-space-14`, and these two are raw
   Tailwind utilities. `globals.css:141` and `:380` already carry 787's "no longer bottom-nav height" comments,
   so the tokens are correct and only these two consumers are stale. **Folded into 793** (P1).
2. **`ListingMobileCTA.tsx` has zero consumers.** `grep -rn "ListingMobileCTA" src/ --include=*.tsx` returns only
   its own definition (measured 2026-09-05, clean worktree at `10271f95a`). It is a 9-`className` component with
   a `design-tokens-allow` marker, and it is one of the two stale-clearance sites above. **Candidate for
   Sprint 57**, not for this sprint — re-run the census at execution, per 788's precedent, before deleting
   anything.

## Exit criteria

1. `src/modules/listings/components/ListingDetailView.tsx` carries no Tailwind class and no `@/components/ui/*`
   import, and is registered in `scripts/mantine-migration-scope.json` with a passing `check:story-coverage`.
2. Every canonical pattern this sprint consumes has at least one **production** importer, and the consumer trace
   that proves it is recorded in the task, not inferred from the barrel.
3. No slice moves the server/client boundary of the detail route without saying so and measuring the route's
   First Load JS before and after.
4. The two critical flows this route sits on — `check:hydration` on listing-detail, and the Task 612 lightbox
   stacking contract — are re-proved by the slice that changes their DOM, not assumed by the slice that does not.
5. The stale 56px clearance is gone and no mobile detail page carries an unexplained tail (owned by 793).
6. No new theme value, breakpoint or token is introduced without an owner decision; a `design-tokens-allow`
   marker is permitted only with the `ListingsPageFrame.module.css` justification shape (a measured length with
   no matching Mantine token), never to silence a utility that a token already covers.
