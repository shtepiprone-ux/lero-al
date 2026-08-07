'use client'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { theme } from './theme'

interface MantineRootProviderProps {
  children: React.ReactNode
}

/**
 * Root Mantine provider — single client boundary for the entire app.
 *
 * Placed in the root App Router layout (src/app/layout.tsx) so it wraps
 * both public ([locale]) and admin routes without duplication.
 *
 * Light-only theme: owner requires one theme (Light). defaultColorScheme="light"
 * ensures Mantine always renders the Light palette. ColorSchemeScript in the
 * root layout head is kept with defaultColorScheme="light" to prevent any FOUC
 * on initial load.
 *
 * CSS imports (@mantine/core/styles.css, @mantine/notifications/styles.css)
 * are in src/app/layout.tsx (server component) per the Next.js App Router
 * convention — CSS in server components is hoisted to <head> automatically.
 */
export function MantineRootProvider({ children }: MantineRootProviderProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        {/* Task 684's header-clearance offset moved to notification-chrome.css, scoped to
            `[data-position^="top"]` (Task 723 fix, 2026-08-06). The component-level `top` prop
            used here applied to Mantine's shared `.mantine-Notifications-root` class UNQUALIFIED
            by data-position, reaching all six position containers — including the three bottom-*
            ones, which then had both `top` (from this prop) and `bottom` (from Mantine's own
            :where() rule) pinned, stretching them to full height and creating an invisible
            click-shield over the page (P0, live on lero.al). See notification-chrome.css for the
            scoped replacement and the R2 pointer-events shield. */}
        <Notifications position="top-right" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  )
}
