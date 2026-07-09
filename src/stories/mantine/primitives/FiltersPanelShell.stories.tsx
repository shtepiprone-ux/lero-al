import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { FiltersPanel } from '@/components/shared/FiltersPanel'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 554/556/566 precedent): the rendered-assert harness
 * (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under
 * `--mantine-only` to stories whose title matches this exact prefix. `FiltersPanel` is a
 * composite (`MantineDrawer` + toggle grids + leaf inputs), not a primitive — this title is a
 * display-grouping choice for gate enforcement, not a taxonomy claim (same rationale as
 * `PhoneField`/`FilterControls`).
 *
 * `FiltersPanelShell` is NOT in the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set (that
 * set only recognizes `Modal`/`Drawer`/`Popover`/`DropdownMenu`/`NavigationMenu`/`Select`/`Tooltip`/
 * `Combobox`), so the harness will NOT auto-click to open it — the story renders `open` directly
 * (no toggle button) so the Drawer/bottom-sheet content is always visible for capture.
 *
 * `locations` reuses the existing `storybook.mantine.combobox_option_*` fixture keys (Task 554) —
 * no new location-name keys needed. `property_type`/`market_type` are pre-set in `values` so both
 * toggle grids render with one option in the soft-tint (`variant="light"`) selected state. All of
 * `FiltersPanel`'s OWN runtime strings (headings, button labels, placeholders) resolve through the
 * real `common`/`listing` namespaces via the global `NextIntlClientProvider` decorator
 * (`.storybook/preview.tsx`) — no new component-runtime i18n keys were needed for this story.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/FiltersPanelShell',
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

    const values: FilterValues = {
      property_type: 'apartment',
      market_type: 'secondary',
    }

    return (
      <MantineStoryShell>
        <FiltersPanel
          open
          onClose={() => {}}
          values={values}
          onChange={() => {}}
          onApply={() => {}}
          locations={locations}
        />
      </MantineStoryShell>
    )
  },
}
