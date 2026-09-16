import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, Stack, Text, ActionIcon, useMantineTheme } from '@mantine/core'
import { Heart, Trash2 } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * `ActionIcon` is a stock `@mantine/core` primitive consumed across the codebase (`GalleryNavActionIcon`'s
 * lightbox/gallery controls, `MantineTooltip`'s trigger) — this is its own canonical proof of the
 * stock variant spectrum and disabled state. The gallery/lightbox nav composition built on top of
 * it has its own dedicated Stories (`Mantine/Primitives/GalleryNavActionIcon`,
 * `Mantine/Primitives/GalleryDesktopNavigation`) rather than living here.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/ActionIcon',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const genericAria = t('actionicon_generic_aria')
    const theme = useMantineTheme()
    const iconSize = theme.other.iconSize.standard

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('actionicon_variant_caption')}</Text>
            <Group gap="sm">
              <ActionIcon variant="filled" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
              <ActionIcon variant="light" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
              <ActionIcon variant="outline" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
              <ActionIcon variant="subtle" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
              <ActionIcon variant="transparent" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
              <ActionIcon variant="default" aria-label={genericAria}><Heart size={iconSize} /></ActionIcon>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('actionicon_disabled_caption')}</Text>
            <ActionIcon variant="filled" disabled aria-label={genericAria}>
              <Trash2 size={iconSize} />
            </ActionIcon>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
