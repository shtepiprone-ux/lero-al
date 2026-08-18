'use client'

import type { ReactNode, CSSProperties } from 'react'
import { Stack } from '@mantine/core'

export interface MantineAddItemPanelProps {
  children: ReactNode
  className?: string
  /** Optional margin-top (raw px number or CSS length) — callers own their own spacing
   *  before the panel; the panel itself carries none. */
  mt?: CSSProperties['marginTop']
}

/**
 * Canonical "add new X" sub-panel chrome (Task 756) — shared by `LocationCombobox`'s
 * add-location panel and `AuthSheet`'s add-company panel (Task 757), which both used the
 * identical Tailwind fragment `"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"`
 * verbatim (the only difference being `LocationCombobox`'s trailing `mt-1`, expressed here
 * via the optional `mt` prop rather than baked into the shared chrome).
 *
 * Owns ONLY the outer chrome (border/radius/padding/gap/background) — callers own their own
 * field layout as children, keeping this component free of any consumer-specific fields.
 *
 * `bg-muted/30` is an opacity-modified token (D35): reproduced as the literal `color-mix()`
 * Tailwind itself compiles to, not aliased to a bare `var(--muted)`.
 */
export function MantineAddItemPanel({ children, className, mt }: MantineAddItemPanelProps) {
  return (
    <Stack
      gap="xs"
      p="sm"
      mt={mt}
      className={className}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--mantine-radius-xl)',
        backgroundColor: 'color-mix(in oklab, var(--muted) 30%, transparent)',
      }}
    >
      {children}
    </Stack>
  )
}
