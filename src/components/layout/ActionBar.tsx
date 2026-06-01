// One-shared-height contract: all Button children MUST be passed at size="xl" (h-11 = 44px)
// for the canonical page-level action row — satisfying docs/design-system.md §11.4 and
// ui-rules.md §15 (touch ≥44px floor). Icon-only actions use size="icon-xl" (also 44px).
// ActionBar is layout-only and does NOT mutate, clone, or resize children.

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ActionBarProps = {
  children: ReactNode
  align?: 'start' | 'end'
  as?: 'div' | 'nav'
  className?: string
}

export function ActionBar({
  children,
  align = 'end',
  as: Comp = 'div',
  className,
}: ActionBarProps) {
  return (
    <Comp
      className={cn(
        'flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center',
        align === 'end' ? 'md:justify-end' : 'md:justify-start',
        className,
      )}
    >
      {children}
    </Comp>
  )
}
