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
        {/* Task 684 (owner D3, 2026-07-29): `top` clears the sticky site header
            (HeaderView.tsx, `sticky top-0 z-30`), replacing the package's own
            16px inset rather than adding to it. Values are the measured
            `header.site-header` height at each MANTINE_VIEWPORTS width
            (scripts/check-stories-rendered.mjs:392): 97px at 320/375 (the
            wrapped two-row header below the header's own 390px breakpoint,
            Task 590) and 65px at 390/1024 (single h-16 row + 1px border-b).
            `sm` (640px) is the smallest key in theme.ts's breakpoints at or
            above that 390px wrap point, so it is the correct cutover — `xs`
            (320px) would apply the 65px value too early and collide. */}
        <Notifications position="top-right" top={{ base: 97, sm: 65 }} />
        {children}
      </ModalsProvider>
    </MantineProvider>
  )
}
