import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Avatar, Box, Group, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Avatar',
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
        <Stack gap="xl">
          {/* Section 1: Image avatar — 40px and 44px, photo cropped to circle */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              image / 40px · 44px
            </Text>
            <Group gap="sm" align="center">
              <Avatar
                src="/og-default.png"
                alt={t('storybook.mantine.avatar_demo_name')}
                size={40}
              />
              <Avatar
                src="/og-default.png"
                alt={t('storybook.mantine.avatar_demo_name')}
                size={44}
              />
            </Group>
          </Stack>

          {/* Section 2: Initials fallback — brand-tinted circle, uppercase initials, 40px and 44px */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              initials / 40px · 44px
            </Text>
            <Group gap="sm" align="center">
              <Avatar
                name={t('storybook.mantine.avatar_demo_name')}
                color="brand"
                size={40}
              />
              <Avatar
                name={t('storybook.mantine.avatar_demo_name')}
                color="brand"
                size={44}
              />
            </Group>
          </Stack>

          {/* Section 3: Composite user cell (§6b) — avatar + name + subtitle, full-width container at <640 */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              composite cell (§6b)
            </Text>
            <Box w="100%">
              <Group gap="sm" align="center" wrap="nowrap">
                <Avatar
                  name={t('storybook.mantine.avatar_demo_name')}
                  color="brand"
                  size={40}
                  style={{ flexShrink: 0 }}
                />
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500} c="gray.7">
                    {t('storybook.mantine.avatar_demo_name')}
                  </Text>
                  <Text size="xs" c="gray.5">
                    {t('storybook.mantine.avatar_demo_subtitle')}
                  </Text>
                </Stack>
              </Group>
            </Box>
          </Stack>

          {/* Section 4: Negative flow */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              negative flow
            </Text>
            <Group gap="sm" align="center">
              {/* 4a: no name / no src → graceful placeholder (children="?"), no crash, no raw color */}
              <Avatar size={40}>?</Avatar>
              {/* 4b: broken src → Mantine falls back to initials derived from name, no broken-image glyph */}
              <Avatar
                src="/not-found-avatar-broken.jpg"
                name={t('storybook.mantine.avatar_demo_name')}
                color="brand"
                size={40}
              />
            </Group>
            {/* 4c: long uk name — locale=uk avatar_demo_name="Олена Коваленко" → "ОК" initials;
                composite cell below — text wraps at 320, no clip or h-scroll */}
            <Box w="100%">
              <Group gap="sm" align="center" wrap="nowrap">
                <Avatar
                  name={t('storybook.mantine.avatar_demo_name')}
                  color="brand"
                  size={40}
                  style={{ flexShrink: 0 }}
                />
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500} c="gray.7" style={{ overflowWrap: 'break-word' }}>
                    {t('storybook.mantine.avatar_demo_name')}
                  </Text>
                  <Text size="xs" c="gray.5" style={{ overflowWrap: 'break-word' }}>
                    {t('storybook.mantine.avatar_demo_subtitle')}
                  </Text>
                </Stack>
              </Group>
            </Box>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
