import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * `UnstyledButton` is a stock `@mantine/core` primitive: a `<button>` (or, polymorphically, any
 * element) with every default button chrome reset, used as the base for every custom-styled
 * clickable control in this codebase (`GalleryNavActionIcon`'s sibling `GalleryThumbnailButton`,
 * the gallery main photo and thumbnail row). Canonical Story so a first-time consumer inspects the
 * real primitive's own behavior before styling on top of it.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/UnstyledButton',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const theme = useMantineTheme()
    const demoBorder = `${theme.other.borderWidth.hairline} solid var(--mantine-color-gray-3)`

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('unstyledbutton_basic_caption')}</Text>
            <UnstyledButton p="xs" bd={demoBorder} bdrs="md">
              <Text>{t('unstyledbutton_basic_label')}</Text>
            </UnstyledButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>{t('unstyledbutton_link_caption')}</Text>
            <UnstyledButton component="a" href="#" p="xs" bd={demoBorder} bdrs="md">
              <Text>{t('unstyledbutton_link_label')}</Text>
            </UnstyledButton>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
