# Sprint 76 — the legacy islands no route sprint owns move to Mantine

**Opened:** 2026-09-18 · **Status:** ✅ **CLOSED 2026-09-18** by owner decision (criterion 2 read as met, "варіант А"). The closure audit is below and the sprint is archived in `docs/backlog-archive.md` · **Landed tasks:** 2 (841, 842) · **Active tasks:** 0

> **Opened by owner instruction, 2026-09-18:** *"закривай спринт і заводь задачі на міграцію"*, given when Sprint 75 closed. Sprint 75's closure audit
> found eight components loaded through `next/dynamic`, invisible to every GR-1 tool. The owner ruled that the
> answer is migration, not a detector: *"у проекті не треба створювати тести, які будуть перевіряти legacy
> компоненти та елементи. Ми мігруємо на Minetine увесь проект."* (2026-09-18). Six of the eight are owned by
> open sprints (794/795/796 and 839 in Sprint 71, 840 in Sprint 69). The remaining two sit on surfaces no open
> sprint's goal covers — the homepage hero and the admin/cabinet avatar editor — so they open this sprint.

## Goal

`HeroSearch`, `PropertyTypeCombobox` and `AvatarCropModal` stop being legacy: no `@/components/ui/*` import, no
Tailwind utility class, each with its own canonical Mantine Story and a `scripts/mantine-migration-scope.json` entry,
rendered by their production consumers without a visible or behavioural regression.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 841/842? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Listing card only. |
| **55 · 56 · 57 · 61 · 62** | ARIA semantics · raw enum leaks · deletion · ledger projection · Tailwind runtime tokens | **No.** None is a component migration. |
| **68 · 69** | `/listings` leaves Tailwind / finishes the Mantine migration | **No.** Route-scoped to `/[locale]/listings`; the hero renders on `/[locale]`, the avatar editor on admin and cabinet routes. (840 does fit 69 and is filed there.) |
| **70** | The site chrome leaves Tailwind | **No.** Header/footer/navigation only. |
| **71** | The listing-detail route leaves Tailwind | **No.** One route. (839 fits and is filed there.) |
| **72 · 73 · 74** | Similar-listings search · sold-listing visibility · one card width | **No.** |

## Tasks

> **This table is the single state source for the sprint.**

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **841** | Homepage hero search: `HeroSearch` (container loaded by `HeroSearchClient` through `next/dynamic`) gets its own Story + manifest entry; `PropertyTypeCombobox`'s Tailwind fallback `'sm:w-48 shrink-0'` and its icon's `h-4 w-4` go | P2 | **Q4** (critical-flow row 56) | ✅ **APPROVED WITH NOTES** 2026-09-18, review 2 (Revision 1; owner decisions OD-1..3 in kickoff §16.2; scope includes the owner-added `MantineCountButton` collapsed/no-badge fix, R7) → [`Sprint_76_kickoff_prompt_Task_841_…`](Sprint_76_kickoff_prompt_Task_841_Hero_Search_Container_And_Property_Type_Combobox.md) · session `docs/sessions/2026-09-18-task841-hero-search-container-and-property-type-combobox.md`. Duplicate check done: no other property-type selector; proofs **extend** `Mantine/Primitives/FilterControls` and `Mantine/Primitives/HeroSearch`, no new page. |
| **842** | `AvatarCropModal` leaves shadcn `Dialog`/`Button` for the canonical Mantine modal pattern — consumed by `AdminUserAvatar` in `AdminUserProfile` (admin) and `ProfileTab` (cabinet) | P2 | Q3 | ✅ **APPROVED WITH NOTES** 2026-09-18, review 1 — [`Sprint_76_kickoff_prompt_Task_842_…`](Sprint_76_kickoff_prompt_Task_842_Avatar_Crop_Modal_Mantine.md) · session `docs/sessions/2026-09-18-task842-avatar-crop-modal-mantine.md`. Census root `manifest:yes story:yes className:0 ui-imports:0`; owner accepted all six §13.3 tuples. |

## Execution order

Both tasks have landed (842, then 841, 2026-09-18). 841 landed first on the shared `src/stories/mantine/primitives/FilterControls.stories.tsx`, so Sprint 69's 840 now extends that file after it.

## Closure audit — 2026-09-18 (Opus, on owner request) — ✅ CLOSED by the owner

Measured natively (`win32 v22.22.3`, `node.exe scripts\check-surface-census.mjs --surface <component>`, root rows):

| Component | Root row | Criterion 2 |
|---|---|---|
| `src/components/shared/HeroSearch.tsx` | `manifest:yes story:yes className:0 ui-imports:0` | met |
| `src/components/shared/AvatarCropModal.tsx` | `manifest:yes story:yes className:0 ui-imports:0` | met |
| `src/components/shared/PropertyTypeCombobox.tsx` | `manifest:yes story:yes className:1 ui-imports:0` | met by owner decision (below) |

- **Criterion 1: met.** 842 and 841 are both `APPROVED WITH NOTES` (2026-09-18, archive rows).
- **Criterion 2: met by owner decision.** `PropertyTypeCombobox`'s single `className` is the consumer pass-through
  `<div className={cn('property-type-combobox', className)}>` (`PropertyTypeCombobox.tsx:38`). It uses the
  `LocationCombobox` idiom and holds no Tailwind utility, which is what the sprint goal asks for. Owner decision,
  2026-09-18, choosing between (A) accept as met and (B) file a task to remove the attribute: **"варіант А"**.
- **Not a Sprint 76 criterion:** the `HeroSearch` surface census still exits 1. It blocks only on the four shared filter
  leaves (`FilterChoiceGroup`, `FilterRangeInputs`, `FilterRoomsRow`, `YearCombobox`), which are owned by **840** (Sprint 69, open).

## Preconditions

- Each kickoff re-runs `node.exe scripts\check-surface-census.mjs --surface <component>` at design time and at I0.
- Per the owner rule of 2026-09-18, neither task adds a test, detector or baseline whose purpose is to watch a legacy
  component; verification proves the migrated Mantine result.

## Exit criteria

1. 841 and 842 are `APPROVED` / `APPROVED WITH NOTES`, or explicitly deferred by a quoted owner decision.
2. The census root rows of `HeroSearch`, `PropertyTypeCombobox` and `AvatarCropModal` read
   `manifest:yes story:yes` with className 0 and ui-imports 0.
