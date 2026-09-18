'use client'

import type { ButtonProps } from '@mantine/core'
import { Button, Badge, useMantineTheme } from '@mantine/core'
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
 *
 * **Task 841 fix — collapsed + zero count (no badge) previously rendered as an off-center icon in
 * a non-square box.** Two compounding defects, both owner-caught on the real `HeroSearch`
 * container Story (Task 841), the first render to ever combine "collapsed" with "no badge" (every
 * prior `iconOnlyBelow` demo, in this file's own Story and in `FiltersPanel`'s Apply button, always
 * had a non-zero count, so a badge/`rightSection` was always present):
 * 1. Mantine's own `Button` unconditionally applies `margin-inline-end: var(--mantine-spacing-xs)`
 *    to `leftSection` toward the label (`Button.module.css` `.section[data-position='left']`),
 *    even when the label is empty. With no `rightSection` to balance that one-sided margin, the
 *    icon sat visibly left of the button's own center.
 * 2. With no fixed width, the button's content-driven width (icon + asymmetric padding, per
 *    `.root[data-with-left-section]`'s reduced `padding-inline-start`) never matched its
 *    `minHeight: 2.75rem`, so the icon-only button rendered as a non-square rectangle instead of
 *    the square icon-button shape every other icon-only control in this design system uses.
 *
 * Fix, applied only in the badge-less collapsed state (the collapsed+badge case is untouched —
 * `leftSection`/`rightSection` there already balance each other symmetrically and keep their
 * existing content-driven width):
 * - the icon renders as the Button's own centered `children`/label instead of `leftSection`, so no
 *   asymmetric margin applies (closes defect 1);
 * - `w`/`h` are both pinned to `theme.other.touchTarget` (the SAME canonical 44px token every
 *   other square icon-only control in this design system already uses for its touch target —
 *   `theme.ts:488`, no new token invented) and `px={0}` (the fixed width already provides all the
 *   surrounding space a centered 16-20px icon needs) — guaranteeing a true square regardless of
 *   the icon's own intrinsic size (closes defect 2).
 */
export function MantineCountButton({
  count, rightSection, children, variant, iconOnlyBelow, iconOnlyAbove, px, leftSection, ...props
}: MantineCountButtonProps) {
  const theme = useMantineTheme()
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
    iconOnlyBelow != null
      ? iconOnlyAbove != null
        ? `(min-width: ${iconOnlyAbove}px) and (max-width: ${iconOnlyBelow - 1}px)`
        : `(max-width: ${iconOnlyBelow - 1}px)`
      : '(max-width: 0px)',
    false,
    { getInitialValueInEffect: true },
  )
  // Task 749 narrows the pre-existing query into a range without adding a second viewport hook.
  // It remains false on the server and the first client render, so the pre-hydration output is
  // unchanged; with no `iconOnlyBelow`, `iconOnlyAbove` remains inert.
  const collapsed = iconOnlyBelow != null && belowThreshold
  const resolvedRightSection = rightSection ?? countBadge
  // See the Task 841 fix doc block above: only the badge-less collapsed state swaps leftSection
  // for children and pins a square size — the collapsed+badge case keeps leftSection/rightSection
  // and its existing content-driven width, already symmetric.
  const collapsedIconOnly = collapsed && !resolvedRightSection

  return (
    <Button
      {...props}
      variant={variant}
      leftSection={collapsedIconOnly ? undefined : leftSection}
      rightSection={resolvedRightSection}
      px={collapsedIconOnly ? 0 : (collapsed ? 'xs' : px)}
      w={collapsedIconOnly ? theme.other.touchTarget : undefined}
      h={collapsedIconOnly ? theme.other.touchTarget : undefined}
    >
      {collapsedIconOnly ? leftSection : (collapsed ? null : children)}
    </Button>
  )
}
