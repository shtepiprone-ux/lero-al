import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Box } from '@mantine/core';
import { ListingsShellView, type ListingsShellViewProps } from '@/modules/listings/components/ListingsShellView';
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton';
import { makeCardListingFixtures } from '@/stories/fixtures/cardListingData.fixture';

/**
 * Task 781 Phase 4 — `/listings` shell presentation: shell root, empty state, grid/list layout
 * and "Показати ще", migrated off shadcn `Button`/raw Tailwind grid onto Mantine
 * (`SimpleGrid`/`Stack`/`ThemeIcon`/`Button`). `:77` (`<Box visibleFrom="md">`) and `:85`
 * (`<MantineDrawer>`) were already Mantine (Task 775/778) and are unchanged.
 *
 * `className="listings-shell"` is preserved verbatim on the root — a semantic selector hook, not
 * a Tailwind utility. `ListingsShellViewProps` (all 22 members) is unchanged.
 *
 * Δ3 (D775-A, kickoff §6b/§11): the grid's 4th-column breakpoint moves from Tailwind `2xl`
 * (1536px, which does not exist on this theme) to Mantine `xxl` (1440px) — an accepted,
 * recorded migration outcome, not a regression.
 *
 * `filtersSlot` is stubbed `null` — `ListingsFilterBar`'s Drawer content has its own canonical
 * story (`Patterns/Mantine/ListingsFilterBar`). `saveSearchSlot` renders the REAL
 * `SaveSearchButton` (Task 782 F3 fix — was stubbed `null`, meaning no canonical story ever
 * rendered the production action row; `Patterns/Mantine/ListingsActionRow` covers the row's own
 * states in isolation, this story proves the SAME real component composes correctly inside the
 * full shell).
 */
const meta: Meta<typeof ListingsShellView> = {
  title: 'Patterns/Mantine/ListingsShellView',
  component: ListingsShellView,
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
        component: 'Task 781 — `/listings` shell presentation migrated onto Mantine. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsShellView>;

function ShellDemo(props: Partial<ListingsShellViewProps> & { locale: string }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const listings = makeCardListingFixtures(props.locale);

  return (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
      <ListingsShellView
        listings={props.listings ?? listings}
        total={props.total ?? listings.length}
        page={1}
        perPage={20}
        locations={[]}
        tab="active"
        activeFiltersCount={2}
        displayCurrency="EUR"
        rates={null}
        favoriteIds={new Set()}
        view={view}
        filtersOpen={false}
        isLoadingMore={false}
        showLoadMore={props.showLoadMore ?? true}
        onViewChange={setView}
        onFiltersOpenChange={() => {}}
        onFiltersOpen={() => {}}
        onShowMore={() => {}}
        onBeforeNavigate={() => {}}
        onFavoriteToggled={() => {}}
        filtersSlot={null}
        saveSearchSlot={<SaveSearchButton />}
      />
    </Box>
  );
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <ShellDemo locale={l} />;
  },
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <ShellDemo locale={l} listings={[]} total={0} showLoadMore={false} />;
  },
};
