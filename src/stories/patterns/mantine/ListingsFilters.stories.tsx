import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineDrawer } from '@/design-system/mantine/patterns';
import { ListingsFilters } from '@/modules/listings/components/ListingsFilters';

/**
 * Task 778 — `/listings` filters panel, migrated off shadcn `Button`/`Input`/`cn` onto Mantine
 * primitives, mounted inside the SAME canonical `MantineDrawer` construction
 * `ListingsShellView.tsx` ships (`side="left"`, `size="xs"`, no `title` — the filters heading and
 * active-count badge stay inside `ListingsFilters`' own header so the host stays a thin
 * `opened`/`onClose` wrapper).
 *
 * `ListingsFilters` is absent from the rendered-assert harness's `MANTINE_OVERLAY_PRIMITIVES`
 * open-trigger set, so the harness will NOT auto-click anything open — the story renders
 * `opened` hard-coded `true` so the Drawer content is always visible for capture, matching the
 * `Mantine/Primitives/FiltersPanelShell` precedent for the same reason.
 *
 * The fixed `nextjs.navigation.query` seeds `property_type=commercial` (a genuine SUBSET of the
 * schema — `rooms`/`area`/`floor`/`floors_total`/`condition`/`market_type`/`offer_type`/
 * `purchase_conditions` show, `year_built`/`heating`/`wall_type`/`layout_features` do not — unlike
 * `apartment`, whose schema happens to show all 12 sections and would not exercise the
 * dependent-visibility branch at all) plus `market_type`/`condition`, so the active-count Badge
 * renders non-zero and the property-type-dependent section set is genuinely narrowed rather than
 * defaulting to `getFilterVisibility(undefined)`'s all-sections branch. The always-open sections
 * (`type`, `property_type`, `location`, `rooms`, `price` — `useListingsUrlFilters.ts` SECTION_DEFAULTS)
 * render their bodies without any click.
 *
 * `locations` reuses the existing `storybook.mantine.combobox_option_tirana`/`_durres` fixture
 * keys (already present in all four locales) — no new i18n key was needed for this story.
 */
const meta: Meta<typeof ListingsFilters> = {
  title: 'Patterns/Mantine/ListingsFilters',
  component: ListingsFilters,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: {
          property_type: 'commercial',
          market_type: 'secondary',
          condition: 'good',
        },
      },
    },
    docs: {
      description: {
        component: 'Task 778 — `/listings` filters panel, migrated onto Mantine primitives and hosted by the canonical MantineDrawer. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsFilters>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const t = (key: string) => storyT(l, `storybook.mantine.${key}`);

    const locations = [
      { id: 1, name_al: t('combobox_option_tirana'), type: 'city' },
      { id: 2, name_al: t('combobox_option_durres'), type: 'city' },
    ];

    return (
      <MantineDrawer opened onClose={() => {}} side="left" size="xs">
        <ListingsFilters locations={locations} onClose={() => {}} />
      </MantineDrawer>
    );
  },
};
