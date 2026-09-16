import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Image, Stack, Text, useMantineTheme } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'
// Direct file import (not a barrel) — check:story-coverage resolves import specifiers to concrete
// file paths. `GalleryDesktopNavigation` is the one canonical owner of the gallery/lightbox
// prev/next controls (desktop-only visibility + position/tone contract) — imported here to prove
// the real production composition, not a re-typed pair of `GalleryNavActionIcon`s.
import { GalleryDesktopNavigation } from '@/design-system/mantine/patterns/GalleryDesktopNavigation'

/**
 * The two overlay-nav sections below render the real, shared `GalleryDesktopNavigation` component
 * over two different backdrops (a bright photo, a black scrim) — the same component
 * `MantineListingGalleryPattern` and `LightboxView` consume, so this Story stays honest about the
 * desktop-only visibility and position/tone contract instead of hardcoding an always-visible
 * lookalike (it renders nothing below the `sm` breakpoint, exactly like production).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/GalleryDesktopNavigation',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const DEMO_SRC = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80'

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const theme = useMantineTheme()
    const demoBoxProps = { maw: theme.other.boxSize.galleryNavDemoWidth, h: theme.other.boxSize.galleryNavDemoHeight }

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('actionicon_gallery_nav_caption')}</Text>
            <Box pos="relative" {...demoBoxProps}>
              <Image src={DEMO_SRC} alt="" fit="cover" h="100%" />
              <GalleryDesktopNavigation
                variant="gallery"
                onPrev={() => {}}
                onNext={() => {}}
                prevLabel={t('lightbox_prev')}
                nextLabel={t('lightbox_next')}
                hasMultiple
              />
            </Box>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('actionicon_lightbox_nav_caption')}</Text>
            <Box pos="relative" {...demoBoxProps} bg="black">
              <GalleryDesktopNavigation
                variant="lightbox"
                onPrev={() => {}}
                onNext={() => {}}
                prevLabel={t('lightbox_prev')}
                nextLabel={t('lightbox_next')}
                hasMultiple
              />
            </Box>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
