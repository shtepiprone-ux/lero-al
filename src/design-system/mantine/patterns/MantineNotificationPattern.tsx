'use client'

import { Button, Group, Stack, Paper, Text, ThemeIcon, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  VARIANT_COLORS,
  VARIANT_ICONS,
  NOTIFICATION_AUTO_CLOSE,
  type NotificationVariant,
} from '@/design-system/mantine/notificationVariants'

export type { NotificationVariant }

export interface NotificationConfig {
  variant: NotificationVariant
  title: string
  message: string
}

export interface MantineNotificationPatternProps {
  triggerSuccessLabel: string
  triggerErrorLabel: string
  triggerInfoLabel: string
  successConfig: NotificationConfig
  errorConfig: NotificationConfig
  infoConfig: NotificationConfig
  previewItems?: NotificationConfig[]
}

/**
 * Canonical notification pattern — demonstrates Mantine notifications system.
 *
 * Renders trigger buttons that fire Mantine toast notifications,
 * plus a static preview of notification styles.
 *
 * Requires <Notifications /> rendered in the provider tree (MantineRootProvider).
 * Notification position is fixed at "top-right" (set in MantineRootProvider).
 * This component does not control notification position.
 *
 * Responsive API:
 *   - Trigger buttons: w={{ base: '100%', sm: 'auto' }} — full-width on mobile, auto on sm+.
 *   - Touch targets: all buttons ≥44px via theme minHeight.
 */
export function MantineNotificationPattern({
  triggerSuccessLabel,
  triggerErrorLabel,
  triggerInfoLabel,
  successConfig,
  errorConfig,
  infoConfig,
  previewItems = [],
}: MantineNotificationPatternProps) {
  function showNotification(config: NotificationConfig) {
    notifications.show({
      title: config.title,
      message: config.message,
      color: VARIANT_COLORS[config.variant],
      icon: VARIANT_ICONS[config.variant],
      autoClose: NOTIFICATION_AUTO_CLOSE,
    })
  }

  return (
    <Stack gap="lg">
      <Group gap="sm" wrap="wrap">
        <Button
          color="green"
          onClick={() => showNotification(successConfig)}
          w={{ base: '100%', sm: 'auto' }}
        >
          {triggerSuccessLabel}
        </Button>
        <Button
          color="red"
          onClick={() => showNotification(errorConfig)}
          w={{ base: '100%', sm: 'auto' }}
        >
          {triggerErrorLabel}
        </Button>
        <Button
          color="blueLight"
          onClick={() => showNotification(infoConfig)}
          w={{ base: '100%', sm: 'auto' }}
        >
          {triggerInfoLabel}
        </Button>
      </Group>

      {previewItems.length > 0 && (
        <Stack gap="sm">
          {previewItems.map((item, i) => (
            <Paper key={i} shadow="xs" p="sm" radius="md" withBorder style={{ borderLeftColor: `var(--mantine-color-${VARIANT_COLORS[item.variant]}-6)`, borderLeftWidth: 4 }}>
              <Group gap="sm" align="flex-start">
                <ThemeIcon color={VARIANT_COLORS[item.variant]} variant="light" size="sm" radius="xl">
                  <span style={{ fontSize: 10 }}>✓</span>
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={600}>{item.title}</Text>
                    <Badge color={VARIANT_COLORS[item.variant]} variant="light" size="xs">{item.variant}</Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{item.message}</Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
