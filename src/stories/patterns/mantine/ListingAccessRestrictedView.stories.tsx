import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { ListingAccessRestrictedView } from '@/modules/listings/components/ListingAccessRestrictedView';

/**
 * Task 923 R103 (D72) — the page a visitor sees at the address of a listing they may not open. A COMPOSE of the listings page frame and the canonical empty state; the View receives
 * strings and hrefs only. `Guest` offers to sign in, `SignedIn` offers to browse the listings. Strings come from the real messages through the toolbar locale.
 */
const meta: Meta<typeof ListingAccessRestrictedView> = {
  title: 'Patterns/Mantine/ListingAccessRestrictedView',
  component: ListingAccessRestrictedView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Task 923 R103 — the restricted-listing page: breadcrumb band, then the empty state with a lock icon, title, text and one action (full width below 640px). Guest and SignedIn differ in the action only. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof ListingAccessRestrictedView>;

const localeOf = (context?: { globals?: Record<string, unknown> }) => (context?.globals?.locale as string) ?? 'en';

export const Guest: Story = {
  render: (_, context) => {
    const l = localeOf(context);
    return (
      <ListingAccessRestrictedView
        homeHref={`/${l}`}
        homeLabel={storyT(l, 'nav.home')}
        listingsHref={`/${l}/listings`}
        listingsLabel={storyT(l, 'listing.all_listings')}
        currentLabel={storyT(l, 'listing.access_restricted_crumb')}
        breadcrumbAriaLabel={storyT(l, 'common.aria_breadcrumb')}
        title={storyT(l, 'listing.access_restricted_title')}
        description={storyT(l, 'listing.access_restricted_text')}
        actionHref={`/${l}/auth/login`}
        actionLabel={storyT(l, 'listing.access_restricted_sign_in')}
      />
    );
  },
};

export const SignedIn: Story = {
  render: (_, context) => {
    const l = localeOf(context);
    return (
      <ListingAccessRestrictedView
        homeHref={`/${l}`}
        homeLabel={storyT(l, 'nav.home')}
        listingsHref={`/${l}/listings`}
        listingsLabel={storyT(l, 'listing.all_listings')}
        currentLabel={storyT(l, 'listing.access_restricted_crumb')}
        breadcrumbAriaLabel={storyT(l, 'common.aria_breadcrumb')}
        title={storyT(l, 'listing.access_restricted_title')}
        description={storyT(l, 'listing.access_restricted_text')}
        actionHref={`/${l}/listings`}
        actionLabel={storyT(l, 'listing.access_restricted_browse')}
      />
    );
  },
};
