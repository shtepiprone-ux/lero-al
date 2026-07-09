'use client'

import type { ButtonProps } from '@mantine/core'
import { Button, Badge } from '@mantine/core'

export interface MantineCountButtonProps extends ButtonProps {
  /** Active-count shown inline in the Button's `rightSection`. 0/undefined renders no badge. */
  count?: number
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

/**
 * Canonical Button + inline count primitive (Task 567 round-2, Fix 3).
 *
 * Renders an active-filter/selection count inline in the Button's `rightSection` — the SAME
 * mechanism Mantine uses to space a `leftSection` icon, exactly what the owner asked for
 * ("inline to the right of the label, with canonical spacing — like a leftSection icon").
 *
 * The round-1 implementation put the count in an absolute-positioned corner `<span>`
 * (`position:absolute -top-1.5 -right-1.5`) overlapping the button's edge — Mantine `Button`'s
 * own root has `overflow:hidden` (for its internal loader-transition), which genuinely clipped
 * that corner badge. Because `rightSection` is a normal-flow child (not absolutely positioned
 * outside the button's box), it is never clipped by that `overflow:hidden`.
 *
 * Badge chrome: `docs/tailadmin-style-reference.md` "Status badge" row (`rounded-full …
 * font-medium`) → Mantine `Badge size="sm"`.
 *
 * **Variant-aware background (owner correction 2026-07-09):** a round-2 render shipped a WHITE
 * chip on the WHITE/`default` (bordered) host button — invisible white-on-white. The chip must
 * always contrast with its host:
 * - `filled` host (the real `FiltersPanel` Apply button) → the light pill (`variant="white"
 *   color="brand"` — Mantine's own white-bg/brand-text variant): reads cleanly on the saturated
 *   brand fill.
 * - `default`/`light`/any other (light-surface) host → the canonical gray pill from the §-cited
 *   gray ramp (`docs/tailadmin-style-reference.md` row 41): `--mantine-color-gray-2` (`#e4e7ec`)
 *   fill + `--mantine-color-gray-7` (`#344054`) text — zero invented hex, both are existing
 *   Mantine theme CSS custom properties.
 */
export function MantineCountButton({ count, rightSection, children, variant, ...props }: MantineCountButtonProps) {
  const isFilledHost = variant === undefined || variant === 'filled'
  const countBadge = count && count > 0
    ? isFilledHost
      ? <Badge size="sm" variant="white" color="brand">{count}</Badge>
      : (
          <Badge
            size="sm"
            styles={{ root: { backgroundColor: 'var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-7)' } }}
          >
            {count}
          </Badge>
        )
    : undefined

  return (
    <Button {...props} variant={variant} rightSection={rightSection ?? countBadge}>
      {children}
    </Button>
  )
}
