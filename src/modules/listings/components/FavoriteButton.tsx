'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleFavorite } from '@/modules/listings/actions/toggleFavorite'

interface FavoriteButtonProps {
  listingId: string
  isFavorited: boolean
  className?: string
  onToggled?: (newState: boolean) => void
}

export function FavoriteButton({ listingId, isFavorited, className, onToggled }: FavoriteButtonProps) {
  const tc = useTranslations('common')
  const [favorited, setFavorited] = useState(isFavorited)
  const [isPending, startTransition] = useTransition()

  // Re-sync when external authority (router.refresh, cross-surface navigation, or
  // parent state update) changes the prop. The parent's onToggled callback keeps
  // isFavorited in sync after each transition, so this effect reconciles cross-tab
  // and cross-surface changes without fighting in-flight optimistic updates.
  useEffect(() => {
    setFavorited(isFavorited)
  }, [isFavorited])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

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
        favorited
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-card/80 text-foreground hover:bg-card hover:text-destructive',
        isPending && 'opacity-60 cursor-wait',
        className,
      )}
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? tc('aria_remove_favorite') : tc('aria_add_favorite')}
      aria-pressed={favorited}
    >
      <Heart className={cn('h-4 w-4', favorited && 'fill-current')} />
    </button>
  )
}
