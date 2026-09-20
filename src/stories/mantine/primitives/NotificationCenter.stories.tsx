import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Paper, Stack, Text, useMantineTheme } from '@mantine/core'
import type { ReactNode } from 'react'
import { NotificationCenter } from '@/modules/notifications/components/NotificationCenter'
import type { Notification } from '@/types/database'
import { notificationRows } from '../../fixtures/notifications.fixture'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 861 R4c (clause 16d tier-1) — canonical Mantine story for the real production `NotificationCenter`
 * (the bell popover's panel: title row, "mark all read", the divided list, the empty state). Statically imports
 * the real component (clause 16c). Before this task it had no Story of its own — it was only reachable through
 * the `NotificationBellView` composition (GR-3). Locale and viewport come from the Storybook toolbar.
 * Fixtures are labelled data (`notifications.fixture.ts`) — no Supabase, no hook mock.
 */
const meta: Meta<typeof NotificationCenter> = {
  title: 'Mantine/Primitives/NotificationCenter',
  component: NotificationCenter,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof NotificationCenter>

/**
 * The bounded flex ancestor `NotificationBellView` supplies: panel width + max height (both from
 * `theme.other.layout`), so the panel's own `flex:1 / min-height:0` list scrolls internally.
 */
function PanelFrame({ children }: { children: ReactNode }) {
  const theme = useMantineTheme()
  return (
    <Paper withBorder radius="lg" maw="100%" w={theme.other.layout.notificationPanelWidth} style={{ overflow: 'hidden' }}>
      <Box style={{ display: 'flex', flexDirection: 'column', maxHeight: theme.other.layout.notificationPanelMaxHeight, overflow: 'hidden' }}>
        {children}
      </Box>
    </Paper>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const rows = notificationRows((context?.globals?.locale as string) ?? 'en')
    const allReadRows: Notification[] = rows.map(row => ({ ...row, is_read: true }))
    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — unread: mixed read/unread rows (the list exceeds the panel's max height and scrolls
              internally), "mark all read" visible — full-width below the title <640, on the title row ≥640. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              unread — mixed rows, &quot;mark all read&quot; visible; header stacks &lt;640 / one row ≥640; list scrolls inside the panel
            </Text>
            <PanelFrame>
              <NotificationCenter notifications={rows} onRead={() => {}} />
            </PanelFrame>
          </Stack>

          {/* 2 — all read: no "mark all read" button */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>all read — no &quot;mark all read&quot; button</Text>
            <PanelFrame>
              <NotificationCenter notifications={allReadRows} onRead={() => {}} />
            </PanelFrame>
          </Stack>

          {/* 3 — empty: localized empty message, no button */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>empty — localized empty message</Text>
            <PanelFrame>
              <NotificationCenter notifications={[]} onRead={() => {}} />
            </PanelFrame>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
