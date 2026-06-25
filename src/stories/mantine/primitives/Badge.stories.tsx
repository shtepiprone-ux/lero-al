import type { Meta, StoryObj } from '@storybook/react'
import { Badge, Box, Group, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Badge',
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
    const t = (key: string) => storyT(locale, key)

    return (
      <Box p="xl">
        <Stack gap="lg">
          {/* Semantic status variants */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('storybook.mantine.admin_table_col_status')}
            </Text>
            <Group gap="xs">
              <Badge color="green">{t('storybook.mantine.admin_status_active')}</Badge>
              <Badge color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>
              <Badge color="red">{t('storybook.mantine.badge_blocked')}</Badge>
              <Badge color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>
              <Badge color="brand">{t('storybook.mantine.badge_brand')}</Badge>
            </Group>
          </Stack>

          {/* Size comparison: xs vs sm (theme default) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              xs / sm (default)
            </Text>
            <Group gap="xs" align="center">
              <Badge color="green" size="xs">{t('storybook.mantine.admin_status_active')}</Badge>
              <Badge color="green" size="sm">{t('storybook.mantine.admin_status_active')}</Badge>
            </Group>
          </Stack>

          {/* Negative flow: long uk label ("Заблокований") — no clip at 320px */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label / no clip
            </Text>
            <Group gap="xs">
              <Badge color="red">{t('storybook.mantine.badge_blocked')}</Badge>
              <Badge color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>
              <Badge color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>
            </Group>
          </Stack>
        </Stack>
      </Box>
    )
  },
}
