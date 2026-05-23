'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { addFavorite, removeFavorite } from '@/modules/listings/actions/favoriteActions'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { openAuthSheet } from '@/lib/auth/authSheet'

interface FavoriteButtonProps {
  listingId: string
  isFavorited: boolean
  className?: string
  onToggled?: (newState: boolean) => void
  disabled?: boolean
  disabledLabel?: string
  /** Visual shape. 'icon' (default) = compact round button for card overlays; 'pill' = full-height pill for action rows. */
  shape?: 'icon' | 'pill'
}

export function FavoriteButton({ listingId, isFavorited, className, onToggled, disabled = false, disabledLabel, shape = 'icon' }: FavoriteButtonProps) {
  const tc = useTranslations('common')
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
    // Do nothing during in-flight auth transitions to avoid false triggers.
    if (!user) {
      if (status === 'unauthenticated') {
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
        return
      }

      // Reconcile with the authoritative server result (handles edge cases where
      // a concurrent action may have already changed the state).
      setFavorited(result.isFavorited)
      onToggled?.(result.isFavorited)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        shape === 'icon' && 'rounded-full w-8 h-8 p-0',
        disabled
          ? 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-50'
          : favorited
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
            : 'bg-card/80 text-foreground hover:bg-card hover:text-destructive',
        !disabled && isPending && 'opacity-60 cursor-wait',
        className,
      )}
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-label={disabled ? (disabledLabel ?? tc('aria_add_favorite')) : (favorited ? tc('aria_remove_favorite') : tc('aria_add_favorite'))}
      aria-pressed={disabled ? undefined : favorited}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledLabel : undefined}
    >
      <Heart className={cn('h-4 w-4', !disabled && favorited && 'fill-current')} />
    </Button>
  )
}
