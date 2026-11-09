import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DEFAULT_THEME, mergeMantineTheme, Stack, Text } from '@mantine/core';
import { expect, waitFor, within, userEvent } from 'storybook/test';
import { belowMobileGateQuery } from '@/design-system/mantine/belowMobileGate';
import { theme } from '@/design-system/mantine/theme';
import { storyT } from '@/stories/_storyI18n';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';
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
      <StoryPageGutter>
      <Stack gap="xl">
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
      </StoryPageGutter>
    );
  },
  // A failed assertion of the play must fail the render (Storybook otherwise only logs it), as `CustomRangeTooLong` does.
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement, globals }) => {
    const l = (globals?.locale as string) ?? 'en';
    const title = storyT(l, 'storybook.mantine.card_title_1');
    const canvas = within(canvasElement);
    // Below the mobile gate (Task 923 R33 / Task 948 AC3) the frame is a clipping box, not a scroll container. The R33 defect is a slide that takes focus before the track has moved:
    // a hidden-overflow frame then scrolls itself to reveal it (scrollLeft 288, the wrong slide in the frame). So ArrowRight and Tab go in one keyboard call, with no wait between
    // them; then the track must have moved, the frame's own `scrollLeft` must still be 0 and the focus must stand on the visible slide (its aria-label is the title).
    // From the gate up the gallery is the static photo and this play is unchanged.
    const belowMobileGate = window.matchMedia(belowMobileGateQuery(mergeMantineTheme(DEFAULT_THEME, theme))).matches;
    if (belowMobileGate) {
      const frame = await canvas.findByRole('group', { name: title });
      await expect(getComputedStyle(frame).overflow).toBe('clip');
      const track = frame.firstElementChild as HTMLElement;
      const before = track.style.transform;
      frame.focus();
      await userEvent.keyboard('{ArrowRight}{Tab}');
      await waitFor(() => expect(track.style.transform).not.toBe(before));
      await expect(frame.scrollLeft).toBe(0);
      const focused = document.activeElement as HTMLElement;
      await expect(frame.contains(focused)).toBe(true);
      await expect(focused.getAttribute('aria-label')).toBe(title);
      await expect(focused.getAttribute('aria-hidden')).toBeNull();
    }
    // The main-photo button's accessible name is exactly `title`; every thumbnail's is
    // `"${title} ${index + 1}"`. `getByRole` name-matching is exact, so this uniquely resolves the
    // main-photo trigger without ambiguity against the thumbnail row.
    const mainPhoto = await canvas.findByRole('button', { name: title });
    await userEvent.click(mainPhoto);
  },
};
