import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import { ListingsActionRow } from '@/modules/listings/components/ListingsActionRow';
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton';

/**
 * Task 781 Phase 3 (row layout revised Task 781R, owner decision 2026-09-03; extracted to its own
 * production component + F3-fixed Task 782) — the `/listings` action row: `ListingsSortBar` (sort
 * selector, mobile filters trigger, grid/list toggle) and `SaveSearchButton` (dialog →
 * `MantineModal`) as the SAME `ListingsActionRow` production component `ListingsShellView.tsx`
 * renders (via `saveSearchSlot`) — this story consumes that exact component and the REAL
 * `SaveSearchButton`, not a hand-duplicated `Flex`/`Box` wrapper (agent-contract clause 16c; this
 * was Task 781's F3 finding — the prior version of this story reproduced the wrapper markup
 * locally instead of importing it). Below 640px the row stacks column-wise (both controls full
 * width, clause 11); at ≥640px it reverts to one row with the sort bar growing to fill the
 * remainder — this is the fix for the `fullWidthButtonsAtMobile` violation a shared `nowrap` row
 * could not satisfy without reproducing Task 772's original collapse/occlusion defect.
 *
 * `.listings-sort-bar` is preserved verbatim on `ListingsSortBar`'s root — a semantic selector
 * hook consumed by the retargeted route probes, not a Tailwind utility.
 *
 * `total`/`activeFiltersCount`/`sort` are seeded non-zero via component props (not URL query) so
 * the range line, the mobile-filters count badge, and a non-default sort selection all render.
 * `SaveSearchButton` reads its own state from `useSearchParams`, seeded via
 * `nextjs.navigation.query` below.
 */
const meta: Meta<typeof ListingsActionRow> = {
  title: 'Patterns/Mantine/ListingsActionRow',
  component: ListingsActionRow,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: { sort: 'price_asc' },
      },
    },
    docs: {
      description: {
        component: 'Task 781/782 — the `/listings` action row (`ListingsSortBar` + real `SaveSearchButton`, via the production `ListingsActionRow` component). Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsActionRow>;

function ActionRowDemo() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  return (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
      <ListingsActionRow
        total={24}
        page={1}
        perPage={20}
        view={view}
        onViewChange={setView}
        onFiltersOpen={() => {}}
        activeFiltersCount={3}
        saveSearchSlot={<SaveSearchButton />}
      />
    </Box>
  );
}

export const Default: Story = {
  render: () => <ActionRowDemo />,
};
