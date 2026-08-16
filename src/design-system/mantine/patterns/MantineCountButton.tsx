'use client'

import type { ButtonProps } from '@mantine/core'
import { Button, Badge } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export interface MantineCountButtonProps extends ButtonProps {
  /** Active-count shown inline in the Button's `rightSection`. 0/undefined renders no badge. */
  count?: number
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  /**
   * Task 571 — viewport width in px BELOW which the button collapses to icon + count only
   * (the label/`children` is hidden; `leftSection` and the count badge stay). `undefined`
   * (default) = never collapses — render is byte-identical to the pre-Task-571 primitive.
   *
   * **Consumers that set this prop MUST also pass `aria-label`.** Once the label is hidden the
   * accessible name comes ONLY from `aria-label` — a collapsing instance without one ships a
   * nameless icon button (agent-contract clause 11 a11y requirement).
   */
  iconOnlyBelow?: number
  /**
   * Optional lower bound for `iconOnlyBelow`. When set, the collapse applies only while the
   * viewport is >= this width AND < `iconOnlyBelow`. Unset (default) = no lower bound, so an
   * instance that sets only `iconOnlyBelow` renders exactly as before.
   */
  iconOnlyAbove?: number
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
 *
 * **`iconOnlyBelow` (Task 571):** an optional component-scoped collapse — below the given px
 * width the label (`children`) hides, `leftSection` + the count badge stay. Threshold is
 * implemented via `useMediaQuery` (`@mantine/hooks`, already a project dependency) — the SAME
 * SSR-safe mechanism already used by `MantineDialogDrawerPattern`, `responsiveBottomSheet`,
 * `MantineAdminSurfacePattern`, `MantineDataTableToCards`, `RangeDatePicker`, and
 * `AdminUsersTable` (all `useMediaQuery('(max-width: 40em)')` with the hook's own
 * `getInitialValueInEffect: true` default, made explicit here). SSR + the client's first render
 * both resolve to the `initialValue` (`false` below) — so the server-rendered markup and the
 * client's pre-hydration markup are byte-identical (label visible), then the effect resolves the
 * real `matchMedia` result and the label collapses if the viewport is genuinely below the
 * threshold. This is not a hydration MISMATCH (React never warns) — the only user-visible effect
 * is a single post-hydration collapse frame on an already-narrow viewport, the same accepted
 * trade-off every sibling consumer above already ships. `useMediaQuery` is called
 * unconditionally (Rules of Hooks) with a query that can never match when `iconOnlyBelow` is
 * unset (`(max-width: 0px)` — no real viewport is ever ≤0px), which is what makes the unset-prop
 * render byte-identical to the pre-Task-571 primitive. No global Tailwind `screen` or Mantine
 * theme breakpoint is added — the threshold is a plain px number scoped to this one instance.
 *
 * Compact collapsed padding reuses the existing `xs` spacing token (`theme.spacing.xs` = 8px,
 * `docs/mantine-responsive-design-system.md` §6.1 spacing scale) via the Button's own `px` Box
 * style prop — no invented px value. `leftSection`/the count badge are Mantine's own
 * `[data-with-left-section]`/`[data-with-right-section]` flex children (§18.9-verified: they are
 * never absolutely positioned, so they cannot overlap the — now hidden — label in the collapsed
 * state, and Mantine's own `.inner` flex gap keeps them apart from each other).
 */
export function MantineCountButton({
  count, rightSection, children, variant, iconOnlyBelow, iconOnlyAbove, px, ...props
}: MantineCountButtonProps) {
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

  // See the `iconOnlyBelow` doc block above for the full SSR-safety rationale.
  const belowThreshold = useMediaQuery(
    iconOnlyBelow != null ? `(max-width: ${iconOnlyBelow - 1}px)` : '(max-width: 0px)',
    false,
    { getInitialValueInEffect: true },
  )
  // `iconOnlyAbove` (Task 749) — second unconditional query, same SSR-safe idiom mirrored: unset
  // uses `(min-width: 0px)`, which always matches, so the unset case is inert (never narrows the
  // collapse). Both hooks start `false`, so `collapsed` is `false` on the server and on the
  // client's first render exactly as before.
  const aboveFloor = useMediaQuery(
    iconOnlyAbove != null ? `(min-width: ${iconOnlyAbove}px)` : '(min-width: 0px)',
    false,
    { getInitialValueInEffect: true },
  )
  const collapsed = iconOnlyBelow != null && belowThreshold && aboveFloor

  return (
    <Button
      {...props}
      variant={variant}
      rightSection={rightSection ?? countBadge}
      px={collapsed ? 'xs' : px}
    >
      {collapsed ? null : children}
    </Button>
  )
}
