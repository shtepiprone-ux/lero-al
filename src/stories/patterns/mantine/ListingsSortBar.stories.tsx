import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar';

/**
 * Task 781R — canonical standalone story for `ListingsSortBar`, statically importing the real
 * production component (clause 16c). Proven here BEFORE integration into `ListingsActionRow` /
 * `ListingsShellView` — a green composition/route screenshot is not evidence for this child's own
 * visual contract (owner instruction, 2026-09-03).
 *
 * Canonical Mantine primitives selected (search evidence — task session, 2026-09-03):
 * - Active-filter count: Mantine `Badge` `circle` — Mantine's own native round-counter mod
 *   (`node_modules/@mantine/core` `Badge.mjs`/`styles.css` `[data-circle]`: `width:
 *   var(--badge-height)` + `padding-inline: 0.125rem`, i.e. width==height, a true circle), NOT
 *   `Indicator` (an absolutely-positioned overlay — the prior pattern, and the exact mechanism of
 *   the reported defect: an overlay escapes the button's own box and can visually collide with
 *   neighboring controls at narrow widths). `theme.ts`'s `Badge.styles` callback was extended
 *   (Task 781R) to exempt `circle` from the §6b oval-pill height/padding override, so the circle
 *   shape isn't fought by the theme's own inline styles. Rendered as the trigger `Button`'s
 *   `rightSection` — in-flow content contributing to the button's own layout box, not an overlay.
 * - Sort selector: `MantineCombobox variant="button"` (unchanged — already canonical, reused from
 *   `Mantine/Primitives/Combobox`).
 * - View toggle: `ActionIcon` pair inside a `Group` (unchanged — already canonical per §6a of the
 *   Task 781 kickoff's decision record; `SegmentedControl` was inspected and rejected there since
 *   this task's own §6a explicitly named `Button`/`ActionIcon`/`Indicator` as the reuse target for
 *   this exact control, before `Indicator` was itself superseded by this follow-up).
 * - Mobile filters trigger: `Button` `hiddenFrom="md"` (unchanged).
 */
const meta: Meta<typeof ListingsSortBar> = {
  title: 'Patterns/Mantine/ListingsSortBar',
  component: ListingsSortBar,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Task 781R — `/listings` sort/action toolbar migrated onto a canonical Mantine `Badge circle` counter (no `Indicator` overlay). Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsSortBar>;

function SortBarDemo({
  activeFiltersCount, total,
}: { activeFiltersCount: number; total: number }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  return (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
      <ListingsSortBar
        total={total}
        page={1}
        perPage={20}
        view={view}
        onViewChange={setView}
        onFiltersOpen={() => {}}
        activeFiltersCount={activeFiltersCount}
      />
    </Box>
  );
}

// activeFiltersCount=0 — story fixture, not production data. Badge must not render at all.
export const Default: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: {} } } },
  render: () => <SortBarDemo activeFiltersCount={0} total={24} />,
};

// activeFiltersCount=2 — story fixture. Matches the count in the owner's reported defect screenshot.
export const TwoActiveFilters: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: {} } } },
  render: () => <SortBarDemo activeFiltersCount={2} total={8} />,
};

// activeFiltersCount at a realistically large value — story fixture. ListingsFilters.tsx exposes
// 18 independently-countable filter fields (type, property_type, location, market_type, rooms,
// price×2, area×2, floor×2, floors_total×2, condition, layout_features, year_built×2, heating,
// wall_type, offer_type, purchase_conditions, period×2, listing_id) — 12 is a realistic "many
// filters active" ceiling for this route, not an arbitrary round number.
export const ManyActiveFilters: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: { sort: 'price_asc' } } } },
  render: () => <SortBarDemo activeFiltersCount={12} total={137} />,
};

// sort selected + non-zero total + a long-label locale (sq/uk) — exercises the count/range text
// and the sort trigger's selected-label rendering together. Query seeds `sort=price_desc`; no
// visible story-only text is rendered (§14.7 — no hardcoded jsx text literals in stories).
export const SortSelected: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: { sort: 'price_desc' } } } },
  render: () => <SortBarDemo activeFiltersCount={3} total={412} />,
};

// list view selected — exercises the ActionIcon toggle's selected/unselected pair.
export const ListViewSelected: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: {} } } },
  render: () => {
    function ListViewDemo() {
      const [view, setView] = useState<'grid' | 'list'>('list');
      return (
        <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
          <ListingsSortBar
            total={5}
            page={1}
            perPage={20}
            view={view}
            onViewChange={setView}
            onFiltersOpen={() => {}}
            activeFiltersCount={1}
          />
        </Box>
      );
    }
    return <ListViewDemo />;
  },
};

// total=0 — negative flow: no range line, "0 listings" count text, no pagination-adjacent state.
export const ZeroResults: Story = {
  parameters: { nextjs: { navigation: { pathname: '/listings', query: {} } } },
  render: () => <SortBarDemo activeFiltersCount={0} total={0} />,
};
