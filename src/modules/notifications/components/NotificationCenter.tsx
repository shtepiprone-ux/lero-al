'use client'

import { Fragment, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCheck } from 'lucide-react'
import { Box, Button, Divider, Flex, Stack, Text, useMantineTheme } from '@mantine/core'
import { markAllNotificationsRead } from '@/modules/notifications/lib/mutations'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/types/database'

interface Props {
  notifications: Notification[]
  onRead: () => void
}

export function NotificationCenter({ notifications, onRead }: Props) {
  const t = useTranslations('notifications')
  const theme = useMantineTheme()
  const [isPending, startTransition] = useTransition()

  function handleMarkAll() {
    if (isPending) return
    startTransition(async () => {
      await markAllNotificationsRead()
      onRead()
    })
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <Stack
      data-testid="notification-center"
      gap={0}
      flex="1 1 0%"
      mih={0}
      style={{ overflow: 'hidden' }}
    >
      {/* Header — Task 593: <640px the mark-all button drops to its own row below the title,
          full-width with flush-left content (owner decision 2026-07-14); >=640px reverts to the
          original single-row layout (title left, button right) byte-for-byte. Task 724 first
          retargeted this from the custom 390px breakpoint token to the canonical 640px `sm`, but
          that retarget was never committed to this file (724R V4 reverted the NotificationCenter.tsx
          portion pending an owner decision superseding 593); Task 749 D-2 (2026-08-15) is that
          decision, so the threshold now moves 390 -> 640 using Tailwind's stock `sm:` breakpoint
          instead of the now-deleted custom token. Task 754: `sm:` = 640px in this project's
          Tailwind config (`--bp-sm: 640px`, globals.css:281) — Mantine's own `sm` breakpoint is
          40em = 640px (mantine-responsive-design-system.md §6.1), an exact 1:1 mapping. */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ sm: 'center' }}
        justify={{ sm: 'space-between' }}
        gap="xs"
        px="md"
        py="sm"
        style={{ flexShrink: 0 }}
      >
        {/* Task 878: raw lh={1.625} removed — theme `sm` lineHeight (1.43) now applies (D81-7). */}
        <Text size="sm" fw={600}>{t('title')}</Text>
        {hasUnread && (
          <Button
            variant="transparent"
            color="brand"
            leftSection={<CheckCheck size={theme.other.iconSize.compact} />}
            onClick={handleMarkAll}
            disabled={isPending}
            justify="flex-start"
            styles={{ label: { textAlign: 'left' } }}
            w={{ base: '100%', sm: 'auto' }}
          >
            {t('mark_all_read')}
          </Button>
        )}
      </Flex>
      <Divider />

      {/* List — Task 861 R4c: the CSS module's `divide-y` reproduction is now a canonical `Divider`
          between adjacent rows (same primitive `MantineDashboardWorkList` uses), and the module is deleted. */}
      <Box flex="1 1 0%" mih={0} style={{ overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" px="md" py="2xl">
            {t('empty')}
          </Text>
        ) : (
          notifications.map((n, i) => (
            <Fragment key={n.id}>
              {i > 0 && <Divider />}
              <NotificationItem notification={n} onRead={onRead} />
            </Fragment>
          ))
        )}
      </Box>
    </Stack>
  )
}
