import type { Meta, StoryObj } from '@storybook/react'
import { Divider, Stack, Group, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Separator',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — horizontal: §6o gray-200, 1px solid, full-width at <640 — two content blocks
              separated by a full-width horizontal Divider */}
          <Stack gap="sm">
            <Text size="sm" c="gray.8">{t('separator_content_intro')}</Text>
            <Divider />
            <Text size="sm" c="gray.7">{t('separator_content_details')}</Text>
          </Stack>

          {/* 2 — vertical: same gray-200 token, intrinsic height (not stretched full-width) —
              two inline items separated by a vertical Divider */}
          <Group gap="sm">
            <Text size="sm" c="gray.7">{t('separator_item_left')}</Text>
            <Divider orientation="vertical" />
            <Text size="sm" c="gray.7">{t('separator_item_right')}</Text>
          </Group>

          {/* 3 — negative: long uk/sq/it content wraps around the divider, never clips, no
              h-scroll at 320 */}
          <Stack gap="sm">
            <Text size="sm" c="gray.8" style={{ wordBreak: 'break-word' }}>{t('separator_content_long')}</Text>
            <Divider />
            <Text size="sm" c="gray.7">{t('separator_content_details')}</Text>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
