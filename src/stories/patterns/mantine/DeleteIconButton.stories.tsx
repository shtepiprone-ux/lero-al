import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, SimpleGrid } from '@mantine/core'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { AppImage } from '@/design-system/media/AppImage'
import { fixturePhotoUrl } from '@/stories/fixtures/listingPhotos.fixture'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers to concrete file paths.
import { MantineDeleteIconButton } from '@/design-system/mantine/patterns/MantineDeleteIconButton'

// Task 957 Revision 2 (R2-8; Review 2 F13): the one canonical delete icon action, with its direct Story. It owns the look (a subtle red action icon, the trash glyph, the theme's touch target);
// the consumers (`ImageUpload` photo tiles, `AdminPagesView` rows, `CollectionsSection` cards) pass the accessible name, the handler, the state and, over an image, `onMedia` (Revision 3,
// owner decision O957-7). Viewport and locale come from the toolbar. The click reaches the handler: `MantineDeleteIconButton.test.tsx` proves it, so no Story counts clicks.
const meta: Meta<typeof MantineDeleteIconButton> = {
  title: 'Patterns/Mantine/DeleteIconButton',
  component: MantineDeleteIconButton,
  tags: ['autodocs'],
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof MantineDeleteIconButton>

/** The resting, disabled and loading states side by side. */
export const States: Story = {
  render: (_, context) => {
    const label = storyT((context?.globals?.locale as string) ?? 'en', 'storybook.mantine.action_delete')
    return (
      <StoryPageGutter>
        <Group>
          <MantineDeleteIconButton label={label} onClick={() => {}} />
          <MantineDeleteIconButton label={label} onClick={() => {}} disabled />
          <MantineDeleteIconButton label={label} onClick={() => {}} loading />
        </Group>
      </StoryPageGutter>
    )
  },
}

/** Over a photograph (`onMedia`): filled red with a white glyph, resting and disabled; a `subtle` control would merge with the photo. Its place on the tile (top right) is `ImageUpload`'s, shown in `Patterns/Mantine/ImageUpload`. */
export const OnPhoto: Story = {
  render: (_, context) => {
    const label = storyT((context?.globals?.locale as string) ?? 'en', 'storybook.mantine.action_delete')
    return (
      <StoryPageGutter>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
          {[false, true].map((disabled) => (
            <AppImage key={String(disabled)} variant="upload" src={fixturePhotoUrl(disabled ? 2 : 1)} alt="">
              <MantineDeleteIconButton onMedia label={label} onClick={() => {}} disabled={disabled} />
            </AppImage>
          ))}
        </SimpleGrid>
      </StoryPageGutter>
    )
  },
}
