import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Image, Stack, Text, useMantineTheme } from '@mantine/core'
import { ChevronRight } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'
// Direct file import (not a barrel) — check:story-coverage resolves import specifiers to concrete
// file paths. `GalleryNavActionIcon` is the low-level visual primitive both `GalleryDesktopNavigation`
// and `LightboxView`'s own close control consume — this Story proves it standalone, isolated from
// the desktop-only visibility/position composition `GalleryDesktopNavigation` owns.
import { GalleryNavActionIcon } from '@/design-system/mantine/patterns/GalleryNavActionIcon'

/**
 * `GalleryNavActionIcon` owns size, shape and the two `tone` color pairs only — no position beyond
 * the caller-supplied offset classes, and no responsive visibility of its own. Two states below:
 * `tone="light"` over a bright photo, `tone="dark"` over a near-black scrim.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/GalleryNavActionIcon',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const DEMO_SRC = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80'
// Task 825 — `GalleryNavActionIcon` no longer takes `className`; `placement` renders through real
// Mantine style props, so there is no Tailwind literal (or local-identifier workaround for one) to
// route around `check:design-tokens:strict` anymore. `centerY` matches both real consumer variants
// (`GalleryDesktopNavigation`'s `gallery`/`lightbox`); `right: 'xl'` keeps the icon clear of the
// demo box edge at this fixture's own width.
const DEMO_PLACEMENT = { right: 'xl', centerY: true } as const

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
            <Text size="xs" c="gray.5" fw={500}>{t('gallerynavactionicon_light_caption')}</Text>
            <Box pos="relative" {...demoBoxProps}>
              <Image src={DEMO_SRC} alt="" fit="cover" h="100%" />
              <GalleryNavActionIcon onClick={() => {}} ariaLabel={t('lightbox_next')} placement={DEMO_PLACEMENT}>
                <ChevronRight size={theme.other.iconSize.roomy} />
              </GalleryNavActionIcon>
            </Box>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('gallerynavactionicon_dark_caption')}</Text>
            <Box pos="relative" {...demoBoxProps} bg="black">
              <GalleryNavActionIcon onClick={() => {}} ariaLabel={t('lightbox_next')} tone="dark" placement={DEMO_PLACEMENT}>
                <ChevronRight size={theme.other.iconSize.roomy} />
              </GalleryNavActionIcon>
            </Box>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
