import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Divider, Paper, Stack, Text, useMantineTheme } from '@mantine/core'
import { Fragment, type ReactNode } from 'react'
import { NotificationItem } from '@/modules/notifications/components/NotificationItem'
import { notificationRows } from '../../fixtures/notifications.fixture'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 861 R4c (clause 16d tier-1) — canonical Mantine story for the real production `NotificationItem`
 * (rendered once per row by `NotificationCenter` inside the bell's popover). MIGRATED from the retired
 * `src/modules/notifications/components/NotificationItem.stories.tsx` (title `Notifications/NotificationItem`,
 * scenarios `AllCases` / `PriceChangeUnread` / `SavedSearchMatchUnread`) — all three scenarios are kept here as
 * labelled sections of the one `Default` page; that file is deleted, never left beside this one (GR-3a).
 * Statically imports the real component (clause 16c). Locale and viewport come from the Storybook toolbar —
 * no `globals.viewport` pin, no width- or locale-named export.
 */
const meta: Meta<typeof NotificationItem> = {
  title: 'Mantine/Primitives/NotificationItem',
  component: NotificationItem,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof NotificationItem>

/** Bell-panel-width column (the real `NotificationCenter` list width), story-harness layout only. */
function PanelWidth({ children }: { children: ReactNode }) {
  const theme = useMantineTheme()
  return (
    <Paper withBorder radius="lg" maw="100%" w={theme.other.layout.notificationPanelWidth} style={{ overflow: 'hidden' }}>
      {children}
    </Paper>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const rows = notificationRows((context?.globals?.locale as string) ?? 'en')
    const [SAVED_SEARCH_ROW, PRICE_CHANGE_ROW] = rows
    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — AllCases: every Task 319 producer + the legacy fallbacks, unread/read mixed, in the real
              panel-width column with a Divider between rows (as `NotificationCenter` renders them). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              all cases — every producer + legacy fallbacks; unread rows tinted with a dot, read rows plain; long uk/sq titles wrap, no h-scroll@320
            </Text>
            <PanelWidth>
              {rows.map((row, i) => (
                <Fragment key={row.id}>
                  {i > 0 && <Divider />}
                  <NotificationItem notification={row} onRead={() => {}} />
                </Fragment>
              ))}
            </PanelWidth>
          </Stack>

          {/* 2 — PriceChangeUnread: one price_change row — long listing name + ICU price params */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>price_change — long listing name + locale-grouped prices</Text>
            <PanelWidth>
              <NotificationItem notification={PRICE_CHANGE_ROW} onRead={() => {}} />
            </PanelWidth>
          </Stack>

          {/* 3 — SavedSearchMatchUnread: one saved_search_match row — long search name, title param wrap */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>saved_search_match, unread — long search name wraps</Text>
            <PanelWidth>
              <NotificationItem notification={SAVED_SEARCH_ROW} onRead={() => {}} />
            </PanelWidth>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
