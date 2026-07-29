import { notifications } from '@mantine/notifications'
import {
  NOTIFICATION_AUTO_CLOSE,
  VARIANT_COLORS,
  VARIANT_ICONS,
  type NotificationVariant,
} from '@/design-system/mantine/notificationVariants'

function show(variant: NotificationVariant, message: string) {
  notifications.show({
    message,
    color: VARIANT_COLORS[variant],
    icon: VARIANT_ICONS[variant],
    autoClose: NOTIFICATION_AUTO_CLOSE,
  })
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  warning: (message: string) => show('warning', message),
}
