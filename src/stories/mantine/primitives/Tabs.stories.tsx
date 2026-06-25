import type { Meta, StoryObj } from '@storybook/react'
import { Box, ScrollArea, Stack, Tabs, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Tabs',
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
          {/* Tabs always in a single horizontal row — no wrap (owner P0).
              theme.components.Tabs.styles.list.flexWrap='nowrap' prevents multi-line.
              ScrollArea scrollbarSize={0}: custom Mantine scrollbar rendered at 0px —
              no visible scrollbar track in any browser; touch/swipe still works. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              horizontal / swipe on overflow
            </Text>
            <Tabs defaultValue="overview" color="brand">
              <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
                <Tabs.List>
                  <Tabs.Tab value="overview">
                    {t('storybook.mantine.tabs_demo_tab_overview')}
                  </Tabs.Tab>
                  <Tabs.Tab value="details">
                    {t('storybook.mantine.tabs_demo_tab_details')}
                  </Tabs.Tab>
                  <Tabs.Tab value="activity">
                    {t('storybook.mantine.tabs_demo_tab_activity')}
                  </Tabs.Tab>
                </Tabs.List>
              </ScrollArea>

              <Tabs.Panel value="overview" pt="sm">
                <Text size="sm" c="gray.7">
                  {t('storybook.mantine.tabs_demo_panel_text')}
                </Text>
              </Tabs.Panel>
              <Tabs.Panel value="details" pt="sm">
                <Text size="sm" c="gray.7">
                  {t('storybook.mantine.tabs_demo_panel_text')}
                </Text>
              </Tabs.Panel>
              <Tabs.Panel value="activity" pt="sm">
                <Text size="sm" c="gray.7">
                  {t('storybook.mantine.tabs_demo_panel_text')}
                </Text>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Stack>
      </Box>
    )
  },
}
