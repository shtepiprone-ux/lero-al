import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, Stack, Text } from '@mantine/core'
import { within } from 'storybook/test'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'
// Direct file import (not a barrel) — check:story-coverage resolves import specifiers to concrete
// file paths. `GalleryThumbnailButton` is the one canonical desktop gallery/lightbox thumbnail,
// shared (not duplicated) by `LightboxView` and `MantineListingGalleryPattern`.
import { GalleryThumbnailButton } from '@/design-system/mantine/patterns/GalleryThumbnailButton'

/**
 * `GalleryThumbnailButton` is the one canonical desktop gallery/lightbox thumbnail: a fixed
 * `theme.other.boxSize.galleryThumb` square (`AspectRatio` ratio 1) that owns its own size,
 * border, radius and clipping on a single element, wrapped in Mantine's `UnstyledButton`. The
 * active border is always 2px — `transparent` when inactive — so toggling active state never
 * shifts layout.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/GalleryThumbnailButton',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const DEMO_SRC = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80'

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('gallerythumbnailbutton_inactive_caption')}</Text>
            <Group gap="xs">
              <GalleryThumbnailButton src={DEMO_SRC} alt="" label={t('gallerythumbnailbutton_inactive_label')} active={false} onClick={() => {}} />
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('gallerythumbnailbutton_active_caption')}</Text>
            <Group gap="xs">
              <GalleryThumbnailButton src={DEMO_SRC} alt="" label={t('gallerythumbnailbutton_active_label')} active onClick={() => {}} />
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('gallerythumbnailbutton_focus_caption')}</Text>
            <Group gap="xs">
              <GalleryThumbnailButton src={DEMO_SRC} alt="" label={t('gallerythumbnailbutton_focus_label')} active={false} onClick={() => {}} />
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('gallerythumbnailbutton_long_label_caption')}</Text>
            <Group gap="xs">
              <GalleryThumbnailButton
                src={DEMO_SRC}
                alt=""
                label={t('gallerythumbnailbutton_long_label')}
                active={false}
                onClick={() => {}}
              />
            </Group>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
  play: async ({ canvasElement, globals }) => {
    const locale = (globals?.locale as string) ?? 'en'
    const focusLabel = storyT(locale, 'storybook.mantine.gallerythumbnailbutton_focus_label')
    const canvas = within(canvasElement)
    const focusTarget = await canvas.findByRole('button', { name: focusLabel })
    focusTarget.focus()
  },
}
