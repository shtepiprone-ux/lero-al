import type { Meta, StoryObj } from '@storybook/react'
import { Box, Button, Card, Paper, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Card',
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
        <Stack gap="xl">
          {/* Section 1: Content Card — radius-16, 20px padding, gray-1 border, flat (no shadow) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              default card / flat chrome
            </Text>
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600}>{t('storybook.mantine.card_demo_title')}</Text>
                <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>
                <Button
                  mih="2.75rem"
                  w={{ base: '100%', sm: 'fit-content' }}
                >
                  {t('storybook.mantine.card_demo_action')}
                </Button>
              </Stack>
            </Card>
          </Stack>

          {/* Section 2: Paper variant — identical chrome (radius-16, gray-1 border, no shadow) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              paper variant
            </Text>
            <Paper withBorder p="lg">
              <Stack gap="sm">
                <Text fw={600}>{t('storybook.mantine.card_paper_title')}</Text>
                <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>
              </Stack>
            </Paper>
          </Stack>

          {/* Section 3: Negative flow */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              negative flow — no border / nested
            </Text>
            {/* 3a: withBorder=false — no border, but radius+padding tokens still apply */}
            <Card withBorder={false}>
              <Text size="sm" c="gray.7">{t('storybook.mantine.card_demo_body')}</Text>
            </Card>
            {/* 3b: Nested Card — no double border/shadow stacking */}
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600}>{t('storybook.mantine.card_demo_title')}</Text>
                <Card withBorder>
                  <Text size="sm" c="gray.7">{t('storybook.mantine.card_paper_title')}</Text>
                </Card>
              </Stack>
            </Card>
          </Stack>
        </Stack>
      </Box>
    )
  },
}
