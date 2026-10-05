import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';
import { ListingsShellView, type ListingsShellViewProps } from '@/modules/listings/components/ListingsShellView';
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton';
import { FIXTURE_OLD_CREATED_AT, makeStateListing } from '@/stories/fixtures/cardListingData.fixture';

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

// Task 741 Revision 3e (R50, owner D46-6): every state below is one `/listings` can render
// (`page.tsx:46-49`, `ListingsShell.tsx:167`, `ListingsPagination.tsx:21`). Inactive, pending, archived and expired
// never reach this page; they stay in the `Mantine/Primitives/ListingCard` Story. Cards come from the shared
// `makeStateListing`, strings from the existing keys, and the URL query drives tabs and chips like production.
const FAVOURITE_KEY = 'favourite';

const ACTIVE_STATES = (l: string) => [
  makeStateListing(l, 'new'),
  makeStateListing(l, 'plain', { createdAt: FIXTURE_OLD_CREATED_AT }),
  makeStateListing(l, 'new-reduced', { priceOld: 92000 }),
  makeStateListing(l, 'premium', { createdAt: FIXTURE_OLD_CREATED_AT, premium: true }),
  makeStateListing(l, 'no-image', { createdAt: FIXTURE_OLD_CREATED_AT, noImage: true }),
  makeStateListing(l, FAVOURITE_KEY, { createdAt: FIXTURE_OLD_CREATED_AT }),
];

const CLOSED_STATES = (l: string) => [
  makeStateListing(l, 'sold', { status: 'sold', createdAt: FIXTURE_OLD_CREATED_AT }),
  makeStateListing(l, 'rented', { status: 'rented', createdAt: FIXTURE_OLD_CREATED_AT }),
];

const ACTIVE_QUERY = { type: 'sale', rooms: '2' };
const CLOSED_QUERY = { tab: 'closed' };

function ShellDemo(props: Partial<ListingsShellViewProps> & { locale: string }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { locale, ...overrides } = props;

  return (
    <StoryPageGutter>
      <ListingsShellView
        listings={ACTIVE_STATES(locale)}
        total={18}
        page={1}
        perPage={6}
        locations={[]}
        tab="active"
        activeFiltersCount={2}
        displayCurrency="EUR"
        rates={null}
        favoriteIds={new Set([`story-listing-001-${FAVOURITE_KEY}`])}
        view={view}
        filtersOpen={false}
        isLoadingMore={false}
        showLoadMore
        onViewChange={setView}
        onFiltersOpenChange={() => {}}
        onFiltersOpen={() => {}}
        onShowMore={() => {}}
        onBeforeNavigate={() => {}}
        onFavoriteToggled={() => {}}
        filtersSlot={null}
        saveSearchSlot={<SaveSearchButton />}
        {...overrides}
      />
    </StoryPageGutter>
  );
}

const localeOf = (context?: { globals?: Record<string, unknown> }) => (context?.globals?.locale as string) ?? 'en';

const queryParams = (query: Record<string, string>) => ({ nextjs: { navigation: { pathname: '/listings', query } } });

/** Active tab: new, plain, price reduced, premium, no photo and favourite cards; 2 filter chips; "Show more" and 3 pages. */
export const Default: Story = {
  parameters: queryParams(ACTIVE_QUERY),
  render: (_, context) => <ShellDemo locale={localeOf(context)} />,
};

/** Closed tab: a sold and a rented card with the overlay; everything is loaded, so no "Show more" and no pagination. */
export const ClosedTab: Story = {
  parameters: queryParams(CLOSED_QUERY),
  render: (_, context) => {
    const l = localeOf(context);
    return <ShellDemo locale={l} tab="closed" activeFiltersCount={0} listings={CLOSED_STATES(l)} total={2} perPage={20} showLoadMore={false} />;
  },
};

/** Closed tab with no sold or rented listing: the canonical empty state, no description. */
export const ClosedEmpty: Story = {
  parameters: queryParams(CLOSED_QUERY),
  render: (_, context) => (
    <ShellDemo locale={localeOf(context)} tab="closed" activeFiltersCount={0} listings={[]} total={0} perPage={20} showLoadMore={false} />
  ),
};

/** Active tab with no result: the canonical empty state with title and description. */
export const Empty: Story = {
  parameters: queryParams({}),
  render: (_, context) => (
    <ShellDemo locale={localeOf(context)} activeFiltersCount={0} listings={[]} total={0} perPage={20} showLoadMore={false} />
  ),
};

/** `Default`'s data while "Show more" is fetching: the button shows Mantine's own loading state. */
export const LoadingMore: Story = {
  parameters: queryParams(ACTIVE_QUERY),
  render: (_, context) => <ShellDemo locale={localeOf(context)} isLoadingMore />,
};
