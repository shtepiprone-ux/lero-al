# Sprint 86 — the listing create/edit form on canonical Mantine

**Opened:** 2026-09-30 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (905)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner decision O83-2, 2026-09-30, verbatim:** *"що це за Legacy-сайти і чи використовуємо ми їх наразі
> у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."* Two of the six legacy `text-2xl` sites (Task 886
> §3.2) sit in the listing create/edit form: L7 `ListingFormShellView.tsx:135`, which is live, and L8
> `steps/StepPreview.tsx:60`, which has no importer.

## The defect

`/listings/create` and `/listings/[slug]/edit` render `ListingFormLoader` → dynamic `ListingFormShell` →
`ListingFormShellView`. The whole form is legacy Tailwind/shadcn (reviewer census, 2026-09-30, with
`scripts/check-surface-census.mjs --surface src/modules/listings/components/ListingFormShell.tsx`, plus the
field registry the census cannot follow):

| Node | className | `@/components/ui/*` | manifest | Story |
|---|---|---|---|---|
| `ListingFormShellView.tsx` | 52 | 5 | no | legacy `Listings/ListingFormShellView` |
| `ListingFormShell.tsx` | 8 | 0 | no | no |
| `ImageUpload.tsx` | 28 | 1 | no | no |
| `components/admin/AdminEditLayout.tsx` | 3 | 0 | no | no |
| `components/admin/StatusChangeControl.tsx` (also `/admin/inquiries`) | 12 | 2 | no | no |
| `components/admin/StatusChangeHistory.tsx` | 15 | 0 | no | no |
| `form/DynamicFieldSection.tsx` + 9 fields via `form/fieldRegistry.ts` | 1 + 38 | 0 + 18 | no | legacy `Listings/Form/NumInputField` only |
| `components/shared/YearCombobox.tsx` (also `ListingsFilters`) | 1 | 0 | no | no own Story |

`steps/StepBasicInfo`, `StepDetails`, `StepLocation`, `StepPhotos` and `StepPreview` have **no importer**. Nothing
in `src`, tests, e2e or scripts renders them. They still hold 18 `surface-census-baseline.json` rows and one
`type-responsive-baseline.json` row.

Critical flows: **Create listing** and **Edit listing** (`docs/critical-flow-registry.md:64-65`). Every task here is
**Q4**.

## Why three tasks

The surface is too large for one executable kickoff. It is migrated bottom-up (canonical child Stories before the
composition, agent-contract 16c), and each task owns whole components:
- **905** is the leaves: the field components, and the deletion of the dead `steps/`.
- **906** is the photo upload, the largest independent leaf.
- **907** is the composition: the form shell and view, the admin edit panel, the routes and legacy site L7. Its GR-1
  census then finds every child migrated.

## Tasks

The Tasks table is the **single state source**. The execution-order note below is order and gating only.

| # | Outcome | State |
|---|---|---|
| **905** | The nine listing-form field components and `DynamicFieldSection` render canonical Mantine (`TextInput`, `Checkbox`, `Input.Wrapper`, `SimpleGrid`, the canonical `FilterChoiceGroup`), each proven by its own Story. `YearCombobox` and `FilterChoiceGroup` are enrolled. The dead `steps/` directory is deleted, with its baseline rows. | `KICKOFF FILED` 2026-09-30 → [`…Task_905…`](Sprint_86_kickoff_prompt_Task_905_Listing_Form_Fields_On_Mantine.md) |
| **906** | `ImageUpload` (listing photos) on canonical Mantine, with its own Story. | reserved (`docs/backlog-reserved.md`) |
| **907** | `ListingFormShellView`, `ListingFormShell`, `AdminEditLayout`, `StatusChangeControl` and `StatusChangeHistory` on canonical Mantine; legacy site L7 removed; the composition Story replaces the legacy `Listings/ListingFormShellView`. | reserved (`docs/backlog-reserved.md`) |

## Execution order and gating

1. **905** and **906** are independent, and either may run first.
2. **907** runs after both 905 and 906 are approved, because it composes their components.
3. `StatusChangeControl` is also rendered by `/admin/inquiries` (Sprint 84's **894**). Whichever of 894 and 907 runs
   first migrates it, and the other consumes the result. The second kickoff must re-read the first's outcome at I0.

## Owner actions

| # | Action |
|---|---|
| **O86-1** | Task 905's `OWNER VISUAL QA REQUIRED` matrix (its §13.3). |

## Exit criteria

1. `/listings/create` and `/listings/[slug]/edit` import no `@/components/ui/*` primitive, and every component they
   render is enrolled in `scripts/mantine-migration-scope.json` with its own canonical Story.
2. `scripts/type-responsive-baseline.json` holds no listing-form row, and `steps/` no longer exists.
3. The create and edit critical flows keep their automated regression evidence green.
