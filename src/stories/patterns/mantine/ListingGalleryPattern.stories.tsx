import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Text } from '@mantine/core';
import { within, userEvent } from 'storybook/test';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineListingGalleryPattern } from '@/design-system/mantine/patterns/MantineListingGalleryPattern';

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

// 9 images (1 main + 8 thumbnails) exercises the "many photos (>= 8)" negative flow: the
// thumbnail row must scroll, and neither the row nor the page may grow to fit them.
const DEMO_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80&sat=-100' },
  { url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200&q=80' },
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
    // The main-photo button's accessible name is exactly `title`; every thumbnail's is
    // `"${title} ${index + 1}"`. `getByRole` name-matching is exact, so this uniquely resolves the
    // main-photo trigger without ambiguity against the thumbnail row.
    const mainPhoto = await canvas.findByRole('button', { name: title });
    await userEvent.click(mainPhoto);
  },
};
