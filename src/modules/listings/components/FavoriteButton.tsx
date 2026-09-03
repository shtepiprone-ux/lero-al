'use client'

import { useState, useTransition, useEffect, useRef, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { ActionIcon, Button, useMantineTheme } from '@mantine/core'
import { cn } from '@/lib/utils'
import { addFavorite, removeFavorite } from '@/modules/listings/actions/favoriteActions'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { openAuthSheet } from '@/lib/auth/authSheet'
import { toast } from '@/lib/toast'
import styles from './FavoriteButton.module.css'

interface FavoriteButtonProps {
  listingId: string
  isFavorited: boolean
  className?: string
  onToggled?: (newState: boolean) => void
  disabled?: boolean
  disabledLabel?: string
  /** Visual shape. 'icon' (default) = compact round button for card overlays; 'pill' = full-height pill for action rows. */
  shape?: 'icon' | 'pill'
  /** Canonical button size for pill shape. Has no effect on icon shape. */
  size?: 'default' | 'lg' | 'xl'
  /**
   * Task 656 (owner-caught regression, `Mantine/Primitives/ListingCard` canonical Story):
   * grid-card floating top-right overlay position. Mantine `ActionIcon`'s own unlayered CSS
   * (`@mantine/core/styles/ActionIcon.css` `.mantine-ActionIcon-root { position: relative }`)
   * unconditionally beats a Tailwind `absolute top-2 right-2` className — Tailwind utilities
   * live in the layered `@layer utilities`, and unlayered CSS always wins regardless of
   * specificity or source order (the same cascade-layer trap already documented for
   * background/color in this file). So the "absolute top-2/right-2" contract could never
   * actually apply via className alone — verified via rendered computed-style inspection
   * (`getComputedStyle(button).position` resolved to `'relative'`, not `'absolute'`) on both
   * the `ListingCardPattern` story and the real production `ListingCard`. An inline `style`
   * always wins over ANY external stylesheet rule for the same property regardless of cascade
   * layer (same precedent as the color/background note below), so `overlay` inline-styles
   * `position`/`top`/`right` instead of relying on the caller's className for those three
   * properties. `top`/`right` use the theme's own `xs` spacing token (0.5rem/8px — matches the
   * pre-fix `top-2`/`right-2` value exactly, zero invented number). Default `false` (list/
   * inline usage, unaffected — `shrink-0 -mt-0.5 -mr-1` never needed `position:absolute`).
   */
  overlay?: boolean
}

// Task 653: pill-shape size → Mantine Button size, governing padding-x/font-size only.
// theme.ts's project-wide Button `styles.root` (line ~304-312) sets `minHeight: '2.75rem'` +
// `height: 'auto'` UNCONDITIONALLY on every Button instance (a P0 touch-target rule, not
// scoped to mobile — verified via rendered inline-style inspection: the resolved `height`
// property is always `auto` with a 44px floor, regardless of the `size` prop or its
// `--button-height-*` custom property). This means the migrated pill renders at 44px height
// on ALL breakpoints, not the legacy sibling's fixed 36px (`h-9`) on desktop — see the R2
// deviation note in the Task 653 session log; NOT overridden here (would violate the P0
// touch-target rule project-wide). 'default'/'xl' are unexercised by any current consumer.
const PILL_SIZE_MAP = { default: 'xs', lg: 'sm', xl: 'md' } as const

export function FavoriteButton({ listingId, isFavorited, className, onToggled, disabled = false, disabledLabel, shape = 'icon', size, overlay = false }: FavoriteButtonProps) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const { user, status } = useAuth()
  const [favorited, setFavorited] = useState(isFavorited)
  const [isPending, startTransition] = useTransition()

  // Tracks isPending without adding it to the isFavorited effect's dependency array.
  // Declared as a ref so reads inside effects always see the committed value.
  const isPendingRef = useRef(false)

  // Authority rules:
  //   pending  → internal optimistic state wins; external prop updates are ignored
  //   settled  → external prop (router.refresh, cross-tab, parent re-render) becomes authority
  //
  // Two-effect pattern — DECLARATION ORDER IS REQUIRED:
  //   [isPending] must be declared first so it fires before [isFavorited] in renders
  //   where both change simultaneously (transition settling + parent prop update).

  // Effect 1: keep ref in sync with committed isPending value.
  useEffect(() => {
    isPendingRef.current = isPending
  }, [isPending])

  // Effect 2: re-sync from external authority only when no transition is in flight.
  useEffect(() => {
    if (!isPendingRef.current) setFavorited(isFavorited)
  }, [isFavorited])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    // Guest guard: open AuthSheet drawer instead of redirecting.
    // Guard only against active sign-out; all other null-user states are guests
    // ('unauthenticated', 'refreshing' on visibility sync, 'error', 'initializing').
    if (!user) {
      if (status !== 'signing_out') {
        openAuthSheet('login')
      }
      return
    }

    const previousState = favorited
    const nextState = !favorited
    setFavorited(nextState)

    startTransition(async () => {
      const result = previousState
        ? await removeFavorite(listingId)
        : await addFavorite(listingId)

      if ('error' in result) {
        setFavorited(previousState)
        toast.error(tc('favorite_error'))
        return
      }

      // Reconcile with the authoritative server result (handles edge cases where
      // a concurrent action may have already changed the state).
      setFavorited(result.isFavorited)
      onToggled?.(result.isFavorited)
    })
  }

  // Task 653: three-state colors traced verbatim from globals.css/theme.ts —
  // --card=#FFFFFF, --foreground=#232323, --destructive=--brand-900=theme.ts brand[9]=#8E322B
  // (NOT the red/error scale), --muted=#F5F5F5, --muted-foreground=#8C8C8C. Applied via
  // FavoriteButton.module.css keyed off these `data-*` attributes — NOT an inline `style`.
  // An inline style would reliably beat ActionIcon/Button's own unlayered CSS at rest (Tasks
  // 629/650/651/612), but it ALSO unconditionally blocks any `:hover` rule from ever applying
  // (inline style wins over every external stylesheet rule for the same property regardless of
  // specificity — verified empirically: an earlier draft used inline `style` and the `:hover`
  // rules below never took effect in a real browser). The CSS module's `[data-favorited]`/
  // `[data-fav-disabled]`/`[data-pending]` attribute selectors instead compete with Mantine's
  // own unlayered CSS on equal footing via specificity (0,2,0 vs Mantine's plain-class (0,1,0)),
  // which lets `:hover` correctly cascade over the resting state.
  const icon = <Heart size={theme.other.iconSize.standard} fill={!disabled && favorited ? 'currentColor' : 'none'} />

  // See the `overlay` doc block above — inline style is the only mechanism that reliably wins
  // over ActionIcon's own unlayered `position: relative`, for these 3 position-only properties.
  const overlayStyle: CSSProperties | undefined = overlay
    ? { position: 'absolute', top: 'var(--mantine-spacing-xs)', right: 'var(--mantine-spacing-xs)' }
    : undefined

  const commonProps = {
    type: 'button' as const,
    onClick: handleClick,
    disabled: disabled || isPending,
    'aria-label': disabled ? (disabledLabel ?? tc('aria_add_favorite')) : (favorited ? tc('aria_remove_favorite') : tc('aria_add_favorite')),
    'aria-pressed': disabled ? undefined : favorited,
    'aria-disabled': disabled || undefined,
    title: disabled ? disabledLabel : undefined,
    'data-favorited': String(favorited),
    // NOT `data-disabled` — Mantine's own ActionIconProps/ButtonProps reserve that name as a
    // typed boolean prop wired into its own internal disabled-state styling hook.
    'data-fav-disabled': disabled ? 'true' : undefined,
    'data-pending': !disabled && isPending ? 'true' : undefined,
    className: cn(styles.control, className),
    style: overlayStyle,
  }

  if (shape === 'icon') {
    return (
      // Icon shape — round 32px overlay heart (card corners). Canonical `ActionIcon`, `variant="subtle"`
      // (same borderless baseline as the HeaderActions.tsx favorites precedent); `radius="pill"` is the
      // theme's own 9999px token (matches the legacy `rounded-full`); `size={32}` matches the legacy
      // `w-8 h-8` (32px) exactly.
      <ActionIcon {...commonProps} variant="subtle" size={theme.other.iconSize.prominent} radius="pill">
        {icon}
      </ActionIcon>
    )
  }

  return (
    // Pill shape — ListingContact.tsx action row. Canonical `Button`, `variant="default"`. `radius`
    // and `bd` are set to the EXACT pixel/token values of the still-legacy `SaveToCollectionButton`
    // sibling's Tailwind `rounded-xl border border-border` (18px / `var(--border)` #EBEBEB) via Mantine
    // props (not Tailwind classes — the unlayered-CSS rule), so the migrated pill's radius/border
    // visually match its legacy neighbor exactly (Task 653 R2). Height does NOT match the sibling's
    // 36px — see `PILL_SIZE_MAP` above and the R2 deviation note in the session log.
    <Button {...commonProps} variant="default" size={PILL_SIZE_MAP[size ?? 'default']} radius="1.125rem" bd="1px solid var(--border)">
      {icon}
    </Button>
  )
}
