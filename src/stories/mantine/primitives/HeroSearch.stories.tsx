import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { HeroSearch } from '@/components/shared/HeroSearch'
import { HeroSearchView } from '@/components/shared/HeroSearchView'
import { HeroSearchFallback } from '@/components/shared/HeroSearchFallback'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 554/556/566/567 precedent): the rendered-assert harness
 * (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under
 * `--mantine-only` to stories whose title matches this exact prefix. `HeroSearch` is a composite
 * (tab strip + already-migrated Comboboxes + `FiltersPanel`), not a primitive — this title is a
 * display-grouping choice for gate enforcement, not a taxonomy claim (same rationale as
 * `PhoneField`/`FilterControls`/`FiltersPanelShell`).
 *
 * Task 568 item 0 (owner decision 2026-07-10) split `HeroSearch` into a thin container (owns
 * `useLocations`/`useRouter`/state) and a pure presentational `HeroSearchView` (all JSX + the 4
 * migrated Mantine `Button`s). This story renders `HeroSearchView` DIRECTLY with a deterministic
 * fixture `locations` list + seeded state + no-op callbacks — NO `useLocations`/`useRouter` mock,
 * no `.storybook` Vite alias, no live Supabase call (supersedes the earlier hook-mock plan).
 *
 * `locations` reuses the existing `storybook.mantine.combobox_option_tirana`/`_durres` fixture
 * keys (Task 554/567) — no new location-name keys needed. `activeFiltersCount=2` (no filters
 * actually staged — the view treats it as a pure display number, not derived from `filters`) shows
 * the filters button's active/filled state + the corner active-count badge in the same capture.
 * `filtersOpen=false` — this task's focus is the hero card + the 3 migrated Buttons (tabs, filters
 * trigger, search); the FiltersPanel drawer itself is already proven by the Task 567
 * `FiltersPanelShell` story, so it is not re-opened here (its title doesn't match a
 * `MANTINE_OVERLAY_PRIMITIVES` open-trigger name, so the harness would not auto-click it anyway).
 *
 * Task 841 — adds `Container`, a third state rendering the real `HeroSearch` container
 * (`@/components/shared/HeroSearch`) DIRECTLY and unmocked, per GR-3/16c: a composition Story that
 * only renders `HeroSearchView` is not proof for the container itself. `HeroSearch` owns
 * `useLocations()`/`useRouter()` (Task 568 container/presentational split, `docs/component-rules.md`
 * → "Container / Presentational Primitive Split") — Storybook's `nextjs: { appDirectory: true }`
 * global parameter (`.storybook/preview.tsx:227-229`) resolves `useRouter`, and `useLocations`
 * resolves to its real (possibly-empty, `.catch`-guarded) result exactly like the precedented
 * `FavoritesShell`/`AuthSheet` container stories — consistent with the Task 568 owner decision that
 * rejected hook-mocking. No mock or alias of either hook is added here or anywhere in this file.
 * The hero `Box` frame duplicated across `Default`/`Fallback` is factored into `HeroFrame` and
 * reused by all three exports so the three states stay visually identical by construction.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/HeroSearch',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

// Task 670: production hero background is `bg="var(--hero-bg)"` (solid coral,
// `src/app/[locale]/page.tsx:27`, since Task 659; retokenized off `--primary` onto its own
// `--hero-bg` token 2026-08-18) — the gradient this section used to render here was stale
// (pre-659). Task 712: renders the SAME Mantine `Box` composition production renders
// (`src/app/[locale]/page.tsx:28-29`) — no raw `<section>`/`<div>` wrapper, no raw Tailwind
// utility (cl. 16c parity). Task 841: factored out of `Default`/`Fallback` so `Container` reuses
// the identical frame byte-for-byte rather than a third copy.
function HeroFrame({ children }: { children: ReactNode }) {
  return (
    <Box component="section" bg="var(--hero-bg)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>
      <Box className="container-wide">
        {children}
      </Box>
    </Box>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const locations: LocationOption[] = [
      { id: 1, name_al: t('combobox_option_tirana'), type: 'city' },
      { id: 2, name_al: t('combobox_option_durres'), type: 'city' },
    ]

    return (
      <MantineStoryShell>
        <HeroFrame>
          <HeroSearchView
            locations={locations}
            listingType="sale"
            onListingTypeChange={() => {}}
            propertyType=""
            onPropertyTypeChange={() => {}}
            locationId={null}
            onLocationChange={() => {}}
            filters={{}}
            onFiltersChange={() => {}}
            activeFiltersCount={2}
            filtersOpen={false}
            onOpenFilters={() => {}}
            onCloseFilters={() => {}}
            onSearch={() => {}}
            onLocationKeyDown={() => {}}
          />
        </HeroFrame>
      </MantineStoryShell>
    )
  },
}

/**
 * Task 670 — statically imports `HeroSearchFallback`, the `HeroSearchClient` `ssr:false`
 * `loading:` component extracted into its own presentational component so it can be
 * story-rendered deterministically (the dynamic import itself can't be story-rendered in its
 * loading branch, per the kickoff §3.4). Rendered in the SAME wrapper/background as `Default` so
 * `scripts/task670-qa-hero-fallback-geometry.mjs` measures both under identical conditions
 * (AC3/AC4). Enrolled in `scripts/mantine-migration-scope.json`.
 */
export const Fallback: Story = {
  render: () => (
    <MantineStoryShell>
      <HeroFrame>
        <HeroSearchFallback />
      </HeroFrame>
    </MantineStoryShell>
  ),
}

/**
 * Task 841 — the real `HeroSearch` container, unmocked. See the module JSDoc above for the
 * GR-3/16c rationale and the Task 568 precedent this follows.
 */
export const Container: Story = {
  render: () => (
    <MantineStoryShell>
      <HeroFrame>
        <HeroSearch />
      </HeroFrame>
    </MantineStoryShell>
  ),
}
