import { createElement, type ReactNode } from 'react'
import { CircleCheckIcon, OctagonXIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning'

// Task 681 §3.11 defect 5 — info is `blueLight`, not `blue`: `blue` is not a registered
// theme.ts colour (colors: { brand, gray, green, yellow, red, blueLight, purple, sale }),
// and theme.ts:837 documents info→blueLight as the intended mapping.
export const VARIANT_COLORS: Record<NotificationVariant, string> = {
  success: 'green',
  error: 'red',
  info: 'blueLight',
  warning: 'yellow',
}

const ICON_SIZE = 24 // §6r-LIVE captured glyph size — matches Notification.stories.tsx's ICON_SIZE

// Lazy getters, not eagerly-constructed elements: `patterns/index.ts` is a barrel that
// re-exports every pattern together, so an eager `createElement(CircleCheckIcon, ...)` here
// would force lucide-react's icon exports to resolve the instant ANY consumer imports the
// barrel (e.g. LocationCombobox importing only MantineCombobox) — breaking every test that
// partially mocks 'lucide-react'. Deferring to per-variant access keeps the import graph inert
// until a toast/notification actually fires.
export const VARIANT_ICONS: Record<NotificationVariant, ReactNode> = {} as Record<NotificationVariant, ReactNode>

Object.defineProperties(VARIANT_ICONS, {
  success: { enumerable: true, get: () => createElement(CircleCheckIcon, { size: ICON_SIZE }) },
  error: { enumerable: true, get: () => createElement(OctagonXIcon, { size: ICON_SIZE }) },
  info: { enumerable: true, get: () => createElement(InfoIcon, { size: ICON_SIZE }) },
  warning: { enumerable: true, get: () => createElement(TriangleAlertIcon, { size: ICON_SIZE }) },
})

export const NOTIFICATION_AUTO_CLOSE = 4000
