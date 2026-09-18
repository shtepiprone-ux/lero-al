# Sprint 76 — the legacy islands no route sprint owns move to Mantine

**Opened:** 2026-09-18 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Active tasks:** 2 (both kickoffs filed 2026-09-18)

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
| **841** | Homepage hero search: `HeroSearch` (container loaded by `HeroSearchClient` through `next/dynamic`) gets its own Story + manifest entry; `PropertyTypeCombobox`'s Tailwind fallback `'sm:w-48 shrink-0'` and its icon's `h-4 w-4` go | P2 | **Q4** (critical-flow row 56) | 🟢 **READY FOR SONNET** 2026-09-18 → [`Sprint_76_kickoff_prompt_Task_841_…`](Sprint_76_kickoff_prompt_Task_841_Hero_Search_Container_And_Property_Type_Combobox.md). Duplicate check done: no other property-type selector; proofs **extend** `Mantine/Primitives/FilterControls` and `Mantine/Primitives/HeroSearch`, no new page. |
| **842** | `AvatarCropModal` leaves shadcn `Dialog`/`Button` for the canonical Mantine modal pattern — consumed by `AdminUserAvatar` in `AdminUserProfile` (admin) and `ProfileTab` (cabinet) | P2 | Q3 | 🟢 **READY FOR SONNET** 2026-09-18 → [`Sprint_76_kickoff_prompt_Task_842_…`](Sprint_76_kickoff_prompt_Task_842_Avatar_Crop_Modal_Mantine.md). Duplicate check done: no Mantine crop component, zero canonical Stories; reuses `MantineModal`/`Slider`/`Button`; creates `Patterns/Mantine/AvatarCropModal`. |

## Execution order

841 and 842 share no file and may run in either order. **841 must not run concurrently with Sprint 69's 840** — both extend `src/stories/mantine/primitives/FilterControls.stories.tsx`.

## Preconditions

- Each kickoff re-runs `node.exe scripts\check-surface-census.mjs --surface <component>` at design time and at I0.
- Per the owner rule of 2026-09-18, neither task adds a test, detector or baseline whose purpose is to watch a legacy
  component; verification proves the migrated Mantine result.

## Exit criteria

1. 841 and 842 are `APPROVED` / `APPROVED WITH NOTES`, or explicitly deferred by a quoted owner decision.
2. The census root rows of `HeroSearch`, `PropertyTypeCombobox` and `AvatarCropModal` read
   `manifest:yes story:yes` with className 0 and ui-imports 0.
