# Epic MM — Mantine UI Migration (execute Task 482 roadmap Phases 2–6)

> **Owner decision 2026-06-24:** migrate the ENTIRE project from the legacy Tailwind/Base-UI UI layer to
> Mantine, **phased, surface-by-surface** (owner chose phased over big-bang). Remove legacy Tailwind stories
> **as each surface is migrated** — not before. Foundation = Task 482 (✅ committed). This Epic executes
> Phases 2–6 of the roadmap in `docs/mantine-responsive-design-system.md` §14.
>
> **Orchestrator:** Opus (plan + review-on-diff). **Executor:** Sonnet 4.6. One slice = one numbered Task with
> its own kickoff file under `tasks/Epics/`.

## Why a story can't just be deleted

Stories mirror real components. Legacy stories exist because the **product still runs on legacy components**.
Deleting a legacy story without migrating its underlying surface (a) leaves the product on Tailwind and
(b) breaks `check:story-coverage`. So every slice does, in order: migrate the product surface to Mantine →
replace its legacy story with a `Patterns/Mantine`-consuming Mantine story → only then retire the legacy story.
Phase 6 deletes whatever legacy stories/components/docs remain after every surface is migrated.

## Source of truth

The per-file migration class + phase + Mantine target for EVERY UI source already exists in
`docs/mantine-responsive-design-system.md` §9 (inventory), §11 (legacy→Mantine map), §12 (14 canonical
patterns), §14 (roadmap). Each slice executes off those rows — no system reinvention.

## Standing rules for every slice (verified at review)

- **Migration is UI-only by default.** Swap legacy markup → Mantine primitives/patterns; **preserve every server
  action call, handler, href, filter, and route verbatim** (agent-contract clause 3/5; Note 20 control
  preservation; Note 22 Admin Table Preservation). A before/after control inventory is mandatory.
- **Consume the canonical Mantine patterns** from `src/design-system/mantine/patterns/**` — do not re-implement a
  table/card/form layout inline. If a pattern lacks a needed affordance (e.g. interactive cells, row actions),
  **extend the canonical pattern** (and its story), don't fork it in the product surface.
- **Mobile <640 = full-width / table→cards** per the Mantine responsive DS (no horizontal-scroll tables). P0.
- **Rendered evidence at every breakpoint × locale** (clause 12/13) — actual screenshots that prove *adaptation*
  (e.g. table→cards at 320, multi-col at wide), not just "0 pageerror". This is the gate Task 482 rework #1
  failed; do not repeat it.
- **Regression coverage (clause 15):** if a slice touches a `docs/critical-flow-registry.md` flow, baseline its
  test green first, keep/extend it, prove a planted-violation FAILs. UI migration must not change action behavior.
- **No Tailwind breakpoint classes / `.container-wide`** as new responsive logic in migrated surfaces.
- **Single-writer git:** Sonnet never runs git; orchestrator emits explicit-path commits at review.

## Slice plan (each = its own Task; numbers assigned at creation)

| Slice | Surface(s) | Mantine target | Status |
|---|---|---|---|
| **MM.0 — Task 484** ⛔ BLOCKS ALL | Mantine **visual standard** — TailAdmin-derived spacing matrix (H/V) + typography + component density → `theme.ts` + design-system doc as source of truth (brand stays `#EC5447`) | `theme.ts` + canonical card/table patterns | 📋 KICKOFF READY (owner: demo.tailadmin.com = UI source of truth) |
| **MM.1 — Task 483** | `AdminUsersTable` (recipe-proving slice) — **consumes MM.0 standard** | `MantineAdminSurfacePattern` / `MantineDataTableToCards` (interactive cells + structured `CardConfig`) | 🔧 IN REWORK — closes after MM.0 lands + renders balanced |
| MM.2 | `AdminListingsTable` | AdminSurfacePattern | ⏳ planned |
| MM.3 | `AdminReportsManager` (+ owner-row work from 461/462/463 already landed) | AdminSurfacePattern + DialogDrawer | ⏳ planned |
| MM.4 | Remaining admin managers (Companies/Currencies/EmailTemplates/ExchangeProviders/PropertyTypes/Permissions/Support/Inquiries/Legal/Locations/Pages/PopularLocations/Footer + `AdminTable`/`AdminCardList` primitives) | AdminSurfacePattern / primitives | ⏳ planned |
| MM.5 | Admin shell + page headers (`AdminLayout`, `AdminPageShell`, `AdminSidebar`, `AdminMobileHeader`) | `MantineAppShellFoundation` / `MantinePageHeaderWithActions` | ⏳ planned (Phase 3) |
| MM.6 | Public listing cards + listing detail + gallery | `MantineListingCardPattern` / `MantineListingDetailPattern` | ⏳ planned (Phase 4) |
| MM.7 | Listing forms + cabinet forms | `MantineTwoColumnForm` / `MantineFormSectionStack` / `MantineResponsiveActionFooter` | ⏳ planned |
| MM.8 | Auth forms | `MantineAuthFormPattern` | ⏳ planned |
| MM.9 | Notification center | `MantineNotificationPattern` | ⏳ planned |
| MM.10 | Public search/listing pages + remaining `src/components/ui/*` primitives | primitives + patterns | ⏳ planned (Phase 2 tail) |
| MM.Z | **Phase 6 cutover:** delete residual legacy stories/components, retire old responsive docs, re-baseline screenshot matrix under Mantine, owner visual QA | — | ⏳ final |

> Slices are sequenced so the product stays working at every step. Primitive-heavy surfaces may pull a small
> Phase-2 primitive slice forward if a later surface needs a Mantine primitive that doesn't exist yet — in that
> case STOP & ASK before widening scope.

## Definition of done (Epic)

Every product UI surface renders through Mantine; no product surface imports legacy `src/components/ui|layout|
admin/*`; all stories are `Patterns/Mantine`-consuming Mantine stories (zero legacy stories); old
Tailwind/Base-UI responsive docs retired; full screenshot/assert matrix re-baselined under Mantine; owner visual
QA signed off. Tailwind may remain only as residual styling until the final cleanup slice removes it where safe.
