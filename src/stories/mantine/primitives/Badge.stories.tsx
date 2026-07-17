import type { Meta, StoryObj } from '@storybook/react'
import { Badge, Group, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

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
      <MantineStoryShell>
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
              {/* Task 617 — added for MantineListingCardPattern's sold/rented status badges
                  (globals.css --status-info / --status-rented have no prior Mantine color). */}
              <Badge color="blueLight">{t('storybook.mantine.badge_info')}</Badge>
              <Badge color="purple">{t('storybook.mantine.badge_purple')}</Badge>
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

          {/* Task 617 — `variant="filled"` (opaque, solid background + white text). The theme
              default `variant="light"` (all sections above) mixes a translucent tint, which reads
              poorly when a badge sits directly on top of a photo (e.g. MantineListingCardPattern's
              corner status badges) — the underlying image can bleed through and kill contrast.
              `filled` has no transparency, so it stays legible over any photo. Demoed on a gray
              swatch below to make the "sits on a photo" case visible even in this plain story. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('storybook.mantine.badge_filled_caption')}
            </Text>
            <Group gap="xs" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-lg)' }}>
              <Badge variant="filled" color="green">{t('storybook.mantine.admin_status_active')}</Badge>
              <Badge variant="filled" color="yellow">{t('storybook.mantine.admin_status_pending')}</Badge>
              <Badge variant="filled" color="red">{t('storybook.mantine.badge_blocked')}</Badge>
              <Badge variant="filled" color="gray">{t('storybook.mantine.admin_status_archived')}</Badge>
              <Badge variant="filled" color="brand">{t('storybook.mantine.badge_brand')}</Badge>
              <Badge variant="filled" color="blueLight">{t('storybook.mantine.badge_info')}</Badge>
              <Badge variant="filled" color="purple">{t('storybook.mantine.badge_purple')}</Badge>
            </Group>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
