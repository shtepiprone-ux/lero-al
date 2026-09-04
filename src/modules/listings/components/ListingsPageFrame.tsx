import type { ReactNode } from 'react'
import Link from 'next/link'
import { Box, Breadcrumbs, Anchor, Text } from '@mantine/core'
import styles from './ListingsPageFrame.module.css'

export interface ListingsPageFrameProps {
  homeHref: string
  homeLabel: string
  currentLabel: string
  breadcrumbAriaLabel: string
  children: ReactNode
}

/**
 * Task 775 — `/listings` route chrome. Server component: no `'use client'`, no function props,
 * so it can wrap the client `ListingsShell` island without moving the server/client boundary
 * (precedent: `src/app/[locale]/page.tsx` + `MantineHomeSection.tsx`, §3.2).
 *
 * Gutter (D775-A = A2): Mantine responsive props only, `md -> xl -> 2xl -> 3xl`, `maw` from the
 * registered `--width-page-max` token, with no legacy Tailwind gutter class and no step above `xxl`.
 * Breadcrumb (D775-B = B2): measured TailAdmin contract, `docs/tailadmin-style-reference.md` §6d
 * (:154-:156) and the measured row (:453) — 14px, links gray.5, current gray.8, separator gray.4,
 * gap 6px via Mantine's own `separatorMargin` prop (no CSS-module length needed for the gap).
 */
export function ListingsPageFrame({
  homeHref,
  homeLabel,
  currentLabel,
  breadcrumbAriaLabel,
  children,
}: ListingsPageFrameProps) {
  return (
    <Box mih="100vh" bg="var(--background)">
      <Box
        // page background + breadcrumb band (§10.2) — the same CSS custom properties the prior
        // Tailwind markup resolved to (`--muted` at 40% alpha via Tailwind v4's own color-mix
        // opacity mechanism, `--border` for the 1px bottom rule), never a re-picked hex.
        style={{
          backgroundColor: 'color-mix(in oklab, var(--muted) 40%, transparent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Box
          maw="var(--width-page-max)"
          mx="auto"
          w="100%"
          px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}
          className={styles.breadcrumbBand}
        >
          <Breadcrumbs
            component="nav"
            aria-label={breadcrumbAriaLabel}
            separator="/"
            separatorMargin="compact"
            styles={{
              // Mantine's own `.breadcrumb` slot forces `white-space: nowrap` (compiled
              // `node_modules/@mantine/core/styles.css` `.m_f678d540`) — fine for the short
              // production strings, but the longest localized labels (AC9/N2, §11) then overflow
              // the 320px mobile gate instead of wrapping. Overridden here, component-local, so a
              // long label wraps onto a second line rather than clipping/overflowing.
              breadcrumb: { whiteSpace: 'normal', overflowWrap: 'break-word' },
              separator: { color: 'var(--mantine-color-gray-4)' },
            }}
          >
            <Anchor component={Link} href={homeHref} size="sm" c="gray.5" className={styles.homeLink}>
              {homeLabel}
            </Anchor>
            <Text size="sm" c="gray.8">
              {currentLabel}
            </Text>
          </Breadcrumbs>
        </Box>
      </Box>

      <Box
        maw="var(--width-page-max)"
        mx="auto"
        w="100%"
        px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}
        py="xl"
      >
        {children}
      </Box>
    </Box>
  )
}
