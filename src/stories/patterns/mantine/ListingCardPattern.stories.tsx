import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingCardPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineListingCardPattern> = {
  title: 'Patterns/Mantine/ListingCardPattern',
  component: MantineListingCardPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Listing card with image, badge, favorite, price, contact CTA (full-width on mobile). Grid cols adapt via SimpleGrid responsive cols. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingCardPattern>;

const makeCard = (l = 'en', id = '1', badge?: string) => ({
  data: {
    id,
    title: storyT(l, 'storybook.mantine.card_title_1'),
    location: storyT(l, 'storybook.mantine.card_location_tirana'),
    rooms: storyT(l, 'storybook.mantine.listing_feature_rooms'),
    area: storyT(l, 'storybook.mantine.listing_feature_area'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    badge: badge ?? storyT(l, 'storybook.mantine.card_badge_new'),
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop',
  },
  contactLabel: storyT(l, 'storybook.mantine.listing_contact_call'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} p="md">
        <MantineListingCardPattern {...makeCard(l, '1')} />
        <MantineListingCardPattern {...makeCard(l, '2', storyT(l, 'storybook.mantine.card_badge_premium'))} />
        <MantineListingCardPattern {...makeCard(l, '3', undefined)} />
      </SimpleGrid>
    );
  },
};
