import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar';
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton';

/**
 * Task 781 Phase 3 (row layout revised Task 781R, owner decision 2026-09-03) — the `/listings`
 * action row: `ListingsSortBar` (sort selector, mobile filters trigger, grid/list toggle) and
 * `SaveSearchButton` (dialog → `MantineModal`) as the SAME `Flex` siblings production renders
 * (`ListingsShellView.tsx:88-106`), reproduced here because a per-component story cannot exercise
 * the shared-row interaction that Task 772's authenticated matrix measured (kickoff §3.6) — the
 * row wrapper is one phase, not two. Below 640px the row stacks column-wise (both controls full
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
const meta: Meta<typeof ListingsSortBar> = {
  title: 'Patterns/Mantine/ListingsActionRow',
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
        component: 'Task 781 — the `/listings` action row (`ListingsSortBar` + `SaveSearchButton`), migrated onto Mantine. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsSortBar>;

function ActionRowDemo() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  return (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }} gap="xs">
        <Box flex={{ sm: '1' }} w={{ base: '100%', sm: 'auto' }} miw={0}>
          <ListingsSortBar
            total={24}
            page={1}
            perPage={20}
            view={view}
            onViewChange={setView}
            onFiltersOpen={() => {}}
            activeFiltersCount={3}
          />
        </Box>
        <SaveSearchButton />
      </Flex>
    </Box>
  );
}

export const Default: Story = {
  render: () => <ActionRowDemo />,
};
