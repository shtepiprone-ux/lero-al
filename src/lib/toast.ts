import { notifications } from '@mantine/notifications'
import {
  NOTIFICATION_AUTO_CLOSE,
  VARIANT_COLORS,
  VARIANT_ICONS,
  type NotificationVariant,
} from '@/design-system/mantine/notificationVariants'

// The last element that took focus outside a toast. A control that disables itself while its request runs (a Mantine `loading` Button)
// drops the focus to `body`, so by the time the toast is raised `document.activeElement` no longer names it.
let lastFocused: HTMLElement | null = null
if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target
      if (target instanceof HTMLElement && !target.closest('.mantine-Notification-root')) lastFocused = target
    },
    true,
  )
}

function show(variant: NotificationVariant, message: string) {
  // WCAG 2.4.3: when the toast is dismissed while focus is still on it (its close control) or has been lost, focus goes back
  // to what had it when the toast was raised; a focus the user has moved elsewhere is left alone (Task 923, R33, owner D6).
  const active = typeof document === 'undefined' ? null : document.activeElement
  const trigger = active && active !== document.body && !active.closest('.mantine-Notification-root') ? active : lastFocused
  notifications.show({
    message,
    color: VARIANT_COLORS[variant],
    icon: VARIANT_ICONS[variant],
    autoClose: NOTIFICATION_AUTO_CLOSE,
    onClose: () => {
      const active = document.activeElement
      const lost = !active || active === document.body || !!active.closest('.mantine-Notification-root')
      if (lost && trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    },
  })
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  warning: (message: string) => show('warning', message),
}
