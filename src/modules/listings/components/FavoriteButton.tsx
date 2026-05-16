'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleFavorite } from '@/modules/listings/actions/toggleFavorite'

interface FavoriteButtonProps {
  listingId: string
  isFavorited: boolean
  className?: string
  onToggled?: (newState: boolean) => void
  disabled?: boolean
  disabledLabel?: string
}

export function FavoriteButton({ listingId, isFavorited, className, onToggled, disabled = false, disabledLabel }: FavoriteButtonProps) {
  const tc = useTranslations('common')
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

    const previousState = favorited
    const nextState = !favorited
    setFavorited(nextState)

    startTransition(async () => {
      // Pass previousState so the server knows the user's intent (add vs. remove).
      // This prevents incorrect DELETE on 23505 when two tabs favorite simultaneously.
      const result = await toggleFavorite(listingId, previousState)

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
    <button
      type="button"
      className={cn(
        'flex items-center justify-center rounded-full w-8 h-8 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
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
    </button>
  )
}
