import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { HeroSearchView } from '@/components/shared/HeroSearchView'
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
 */
const meta: Meta = {
  title: 'Mantine/Primitives/HeroSearch',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

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
        {/* Same hero wrapper classes as src/app/[locale]/page.tsx — the tabs' translucent/active
            treatment is hero-relative chrome (item 1) and only reads correctly against the real
            gradient background, not a plain white one. */}
        <section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">
          <div className="container-wide relative z-10">
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
          </div>
        </section>
      </MantineStoryShell>
    )
  },
}
