import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Text } from '@mantine/core';
import { within, userEvent } from 'storybook/test';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingGalleryPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineListingGalleryPattern> = {
  title: 'Patterns/Mantine/ListingGalleryPattern',
  component: MantineListingGalleryPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Listing-detail gallery (Task 616 D1) — the main photo is a Mantine component that owns its own Mantine fullScreen-Modal lightbox (reuses LightboxView, the Task 612 primitive, as the modal it renders). `play` clicks the main photo so the rendered gate captures the lightbox OPEN.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingGalleryPattern>;

const DEMO_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80' },
];

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const labels = {
      close: storyT(l, 'storybook.mantine.lightbox_close'),
      prev: storyT(l, 'storybook.mantine.lightbox_prev'),
      next: storyT(l, 'storybook.mantine.lightbox_next'),
      // No i18n key — pure digits/slash, matches the real ListingGallery counter format
      // (LightboxView.stories.tsx precedent, Task 612).
      counter: (index: number, total: number) => `${index} / ${total}`,
      photoCountSuffix: storyT(l, 'storybook.mantine.listing_detail_photo_count_suffix'),
    };

    return (
      <Stack gap="xl" p="md">
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_gallery_section_default')}
          </Text>
          <MantineListingGalleryPattern images={DEMO_IMAGES} title={title} labels={labels} />
        </Stack>

        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_gallery_section_empty')}
          </Text>
          <MantineListingGalleryPattern images={[]} title={title} labels={labels} />
        </Stack>
      </Stack>
    );
  },
  play: async ({ canvasElement, globals }) => {
    const l = (globals?.locale as string) ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const canvas = within(canvasElement);
    const mainPhoto = await canvas.findByRole('button', { name: title });
    await userEvent.click(mainPhoto);
  },
};
