import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar';

/**
 * Task 779 — `/listings` horizontal filter bar, migrated off the shadcn `Button`, the legacy
 * `@/components/shared/Combobox` and every Tailwind utility string onto Mantine primitives
 * (`Button`, `Group`, `Stack`, `Divider`, `MantineCombobox`), consuming `LocationCombobox` as an
 * already-migrated leaf.
 *
 * Route visibility (`hidden md:flex` → `<Box visibleFrom="md">`) was moved OUT of this component
 * and into a thin wrapper in `ListingsShellView.tsx` (the sole production consumer, `:76`), so
 * this story renders the real component with NO visibility wrapper — every one of the 4
 * MANTINE_VIEWPORTS (320/375/390/1024) shows real UI instead of 3 of them being blank
 * (`display:none`) behind the old gate (kickoff §3.5/§3.6/§10.4).
 *
 * Task 783 — three named states prove the Advanced filters count (canonical `MantineCountButton`,
 * replacing the prior `Indicator` corner overlay) at its real URL-derived boundaries, each seeded
 * through `nextjs.navigation.query` and read back by the real `useListingsUrlFilters` →
 * `filterEngine.ts` — never a mock or a fixture constant:
 * - `Default` — no query params, `activeCount === 0`: no reset control, no count badge.
 * - `OneActiveFilter` — `type=sale` only, `activeCount === 1`: one-digit inline badge.
 * - `ManyActiveFilters` — the ten-param query named in the kickoff (§9): `type`, `property_type`,
 *   `location_id`, `price_min`, `price_max`, `area_min`, `area_max`, `rooms` (2 values),
 *   `floor_min`, `premium`. **Discrepancy recorded, not silently corrected:** the kickoff's own
 *   arithmetic (`1+1+1+1+1+1+1+2+1+1 = 12`) sums its own ten listed addends to 11, and the real
 *   `countActiveFilters()` returns 11 for this exact query (verified against `filterEngine.ts`'s
 *   published counting rule — 9 singleton params × 1 + `rooms` (2 values) = 11), not 12. The
 *   query is reproduced byte-for-byte from the kickoff rather than altered with an invented
 *   eleventh param to force 12 — seeing "task specification contradicted by the repository" as a
 *   stop condition, not a license to pick an unspecified extra filter on this task's behalf. This
 *   story still proves the required two-digit/no-clip/in-flow boundary the state exists for.
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
 * `ListingsPageFrame.stories.tsx` and its siblings already do. No production file changes to
 * reproduce this gutter — the bar itself is unpadded and unindented, matching the real route
 * exactly.
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
        query: {},
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

function renderBar(context: { globals?: { locale?: string } }) {
  const l = context?.globals?.locale ?? 'en';
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
}

/** activeCount === 0 — no query params. No reset control, no count badge. */
export const Default: Story = {
  render: (_, context) => renderBar(context),
};

/** activeCount === 1 — a single `type` param. One-digit inline badge. */
export const OneActiveFilter: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: { type: 'sale' },
      },
    },
  },
  render: (_, context) => renderBar(context),
};

/**
 * activeCount === 11 through the real query/parser/counter — see the component doc comment above
 * for the recorded arithmetic discrepancy against the kickoff's stated "12".
 */
export const ManyActiveFilters: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: {
          type: 'sale',
          property_type: 'apartment',
          location_id: '1',
          price_min: '100',
          price_max: '200',
          area_min: '30',
          area_max: '90',
          rooms: '2,3',
          floor_min: '1',
          premium: 'true',
        },
      },
    },
  },
  render: (_, context) => renderBar(context),
};
