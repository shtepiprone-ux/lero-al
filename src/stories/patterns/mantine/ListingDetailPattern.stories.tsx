import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingDetailPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineListingDetailPattern> = {
  title: 'Patterns/Mantine/ListingDetailPattern',
  component: MantineListingDetailPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Listing detail layout: gallery + features grid + sticky contact panel. Responsive 12-col grid. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingDetailPattern>;

const makeArgs = (l = 'en') => ({
  data: {
    title: storyT(l, 'storybook.mantine.card_title_1'),
    location: storyT(l, 'storybook.mantine.card_location_tirana'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    badge: storyT(l, 'storybook.mantine.card_badge_new'),
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
    features: [
      { label: storyT(l, 'storybook.mantine.admin_table_col_status'), value: storyT(l, 'storybook.mantine.admin_status_active') },
      { label: storyT(l, 'storybook.mantine.listing_feature_rooms'), value: '3' },
      { label: storyT(l, 'storybook.mantine.listing_feature_area'), value: '85 m²' },
      { label: storyT(l, 'storybook.mantine.listing_feature_floor'), value: '3' },
    ],
    description: storyT(l, 'storybook.mantine.empty_description'),
  },
  callLabel: storyT(l, 'storybook.mantine.listing_contact_call'),
  whatsappLabel: storyT(l, 'storybook.mantine.listing_contact_wa'),
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineListingDetailPattern {...makeArgs(l)} />;
  },
};
