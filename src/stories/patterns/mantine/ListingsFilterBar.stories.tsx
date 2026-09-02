import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar';

/**
 * Task 779 — `/listings` horizontal filter bar, migrated off the shadcn `Button`, the legacy
 * `@/components/shared/Combobox` and every Tailwind utility string onto Mantine primitives
 * (`Button`, `Group`, `Stack`, `Divider`, `Indicator`, `MantineCombobox`), consuming
 * `LocationCombobox` as an already-migrated leaf.
 *
 * Route visibility (`hidden md:flex` → `<Box visibleFrom="md">`) was moved OUT of this component
 * and into a thin wrapper in `ListingsShellView.tsx` (the sole production consumer, `:76`), so
 * this story renders the real component with NO visibility wrapper — every one of the 4
 * MANTINE_VIEWPORTS (320/375/390/1024) shows real UI instead of 3 of them being blank
 * (`display:none`) behind the old gate (kickoff §3.5/§3.6/§10.4).
 *
 * The fixed `nextjs.navigation.query` seeds `type=sale`, `property_type=apartment` and
 * `premium=true` so `activeCount > 0` — the reset control (conditional) and the advanced-filters
 * `Indicator` badge (conditional) both render, and the listing-type/premium selected states are
 * both exercised (kickoff §10.4).
 *
 * `locations` reuses the existing `storybook.mantine.combobox_option_tirana`/`_durres` fixture
 * keys (already present in all four locales) — no new i18n key was needed for this story.
 *
 * Known limitation (Task 679, kickoff §3.11): Storybook has no `/api/property-types`, so
 * `usePropertyTypes()` falls back to raw lowercase enum labels (`apartment`, `house`, …) in the
 * property-type combobox, in every locale. Not fixed here — recorded, not localised or stubbed.
 *
 * Task 780R: the render wraps the bar in a `Box` carrying the SAME responsive `px` gutter ladder
 * production supplies via `ListingsPageFrame.tsx` (`px={{ base:'md', sm:'xl', lg:'2xl',
 * xxl:'3xl' }}`). `skipCanvas: true` already opts this story out of the generic `.container-wide`
 * canvas wrapper — per `.storybook/preview.tsx:119-124`, a `Patterns/Mantine/*` story is expected
 * to supply its own Mantine-native container in that wrapper's place, exactly as
 * `ListingsPageFrame.stories.tsx` and its siblings already do. This container is what the
 * advanced-filters `Indicator`'s corner-badge overhang (a deliberate, unmodified Mantine
 * `top-end` default — Task 779 §3.7) sits inside, instead of escaping past the document edge in a
 * zero-gutter render. No production file changes to reproduce this gutter — the bar itself is
 * unpadded and unindented, matching the real route exactly.
 */
const meta: Meta<typeof ListingsFilterBar> = {
  title: 'Patterns/Mantine/ListingsFilterBar',
  component: ListingsFilterBar,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: {
          type: 'sale',
          property_type: 'apartment',
          premium: 'true',
        },
      },
    },
    docs: {
      description: {
        component: 'Task 779 — `/listings` horizontal filter bar, migrated onto Mantine primitives. Route visibility lives in ListingsShellView, not here — this story renders the bar without that wrapper so every viewport shows real UI. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsFilterBar>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const t = (key: string) => storyT(l, `storybook.mantine.${key}`);

    const locations = [
      { id: 1, name_al: t('combobox_option_tirana'), type: 'city' },
      { id: 2, name_al: t('combobox_option_durres'), type: 'city' },
    ];

    return (
      <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}>
        <ListingsFilterBar locations={locations} onFiltersOpen={() => {}} />
      </Box>
    );
  },
};
