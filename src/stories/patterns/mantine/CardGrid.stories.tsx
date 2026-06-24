import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineCardGrid } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineCardGrid> = {
  title: 'Patterns/Mantine/CardGrid',
  component: MantineCardGrid,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Responsive card grid (SimpleGrid 1→2→3→4 cols). Property listing grid pattern. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineCardGrid>;

const makeItems = (l = 'en') => ([
  {
    id: '1',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    subtitle: storyT(l, 'storybook.mantine.card_subtitle_1'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    badge: storyT(l, 'storybook.mantine.card_badge_new'),
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    subtitle: storyT(l, 'storybook.mantine.card_subtitle_1'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    badge: storyT(l, 'storybook.mantine.card_badge_premium'),
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    subtitle: storyT(l, 'storybook.mantine.card_subtitle_1'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    subtitle: storyT(l, 'storybook.mantine.card_subtitle_1'),
    price: storyT(l, 'storybook.mantine.card_price_1'),
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
  },
]);

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineCardGrid items={makeItems(l)} />;
  },
};
