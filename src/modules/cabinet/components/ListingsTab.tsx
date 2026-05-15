'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, Maximize2, Loader2, Check, X, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { deleteListingAction } from '@/modules/listings/actions/deleteListing'
import { formatPrice } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { cn } from '@/lib/utils'
import type { ListingStatus } from '@/types/database'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'
import {
  type ListingVisibilityGroup,
  VALID_VISIBILITY_GROUPS,
} from '@/modules/listings/domain'
import {
  useCabinetListingsRealtime,
  type CabinetListingPatch,
  type CabinetListingRealtimeEvent,
} from '@/modules/cabinet/hooks/useCabinetListingsRealtime'

// Re-export so CabinetShell can import from this path without knowing the domain layer path.
export type { ListingVisibilityGroup }

interface Props {
  listings:        CardListingData[]
  locale:          string
  initialFilter:   ListingVisibilityGroup
  initialPremium:  boolean
  userId:          string
}

// ── Constants ─────────────────────────────────────────────────────────────────

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

// Badge variants for individual listing status display — reads DB status from server response.
const STATUS_VARIANT: Record<ListingStatus, BadgeVariant> = {
  pending:  'warning',
  active:   'success',
  inactive: 'neutral',
  sold:     'info',
  rented:   'rented',
  archived: 'neutral',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ListingsTab({ listings: initial, locale, initialFilter, initialPremium, userId }: Props) {
  const t            = useTranslations('cabinet')
  const tl           = useTranslations('listing')
  const activeLocale  = useLocale()
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()

  // ── UI state layer governance ────────────────────────────────────────────────
  //
  // Layer precedence (highest to lowest authority):
  //   1. server state (initial)   — SSR-L2: immutable in client, single source of truth
  //   2. livePatches              — Live-L3: realtime UPDATE patches (scalar fields only)
  //                                 Re-initialized on every new initial (filter nav / refresh)
  //   3. deletedIds               — UI-L4: subtract-only overlay (user deletes + realtime DELETEs)
  //
  // Contract:
  //   • server state (initial) is NEVER mutated on the client
  //   • livePatches ONLY patches scalar fields present in CABINET_LISTING_SELECT
  //     (no images — joined relations are not in realtime payloads)
  //   • livePatches is reset on each new initial to prevent SSR/client drift
  //   • deletedIds can ONLY subtract; it cannot add, reorder, or replace rows
  //   • items is the sole consumer of all three layers

  const [livePatches, setLivePatches] = useState<ReadonlyMap<string, CabinetListingPatch>>(
    () => new Map()
  )
  const [deletedIds,  setDeletedIds]  = useState<ReadonlySet<string>>(new Set())
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [confirmId,   setConfirmId]   = useState<string | null>(null)

  // Re-sync Live-L3 when SSR-L2 changes (filter navigation / router.refresh)
  useEffect(() => {
    setLivePatches(new Map())
  }, [initial])

  // Memoized projection: recomputes only when the server dataset or the UI overlays change.
  const items = useMemo(
    () =>
      initial
        .filter(l => !deletedIds.has(l.id))
        .map(l => {
          const patch = livePatches.get(l.id)
          return patch ? { ...l, ...patch } : l
        }),
    [initial, deletedIds, livePatches],
  )

  const handleRealtimeEvent = useCallback(
    (event: CabinetListingRealtimeEvent) => {
      if (event.type === 'UPDATE') {
        setLivePatches(prev => {
          const next = new Map(prev)
          next.set(event.listingId, { ...(prev.get(event.listingId) ?? {}), ...event.patch })
          return next
        })
      } else if (event.type === 'DELETE') {
        setDeletedIds(prev => new Set([...prev, event.listingId]))
      }
    },
    [],
  )

  useCabinetListingsRealtime({ userId, onEvent: handleRealtimeEvent })

  // Active visibility group — URL ?filter= is source of truth; fall back to server-provided initial.
  const rawFilter = searchParams.get('filter') ?? ''
  const activeVisibility: ListingVisibilityGroup =
    (VALID_VISIBILITY_GROUPS as readonly string[]).includes(rawFilter)
      ? (rawFilter as ListingVisibilityGroup)
      : initialFilter

  // Premium attribute toggle — URL ?premium=1 is source of truth.
  const isPremium = searchParams.get('premium') === '1' || (searchParams.get('premium') === null && initialPremium)

  function setVisibility(visibility: ListingVisibilityGroup) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'listings')
    if (visibility === 'ALL') params.delete('filter')
    else params.set('filter', visibility)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function togglePremium() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'listings')
    if (isPremium) params.delete('premium')
    else params.set('premium', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteListingAction(id)
    if (result.error) {
      console.error('Failed to delete listing', { error: result.error, listingId: id })
      toast.error(t('error_deleting'))
    } else {
      setDeletedIds(prev => new Set([...prev, id]))
    }
    setDeletingId(null)
    setConfirmId(null)
  }

  // ── Filter bar ──────────────────────────────────────────────────────────────
  //
  // Two independent filter dimensions rendered in one bar:
  //  1. Visibility group buttons (exclusive) — ALL, VISIBLE, HIDDEN, ARCHIVED, CLOSED
  //  2. Premium toggle button (independent orthogonal attribute)

  const FilterBar = (
    <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={t('filter_ALL')}>
      {/* Visibility group — exclusive selection */}
      {VALID_VISIBILITY_GROUPS.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => setVisibility(key)}
          aria-pressed={activeVisibility === key}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
            activeVisibility === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {t(`filter_${key}`)}
        </button>
      ))}

      {/* Visual divider */}
      <span className="w-px h-4 bg-border mx-0.5 shrink-0" aria-hidden />

      {/* Premium attribute — independent toggle */}
      <button
        type="button"
        onClick={togglePremium}
        aria-pressed={isPremium}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
          isPremium
            ? 'bg-badge-premium text-primary-foreground shadow-sm'
            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {t('filter_PREMIUM')}
      </button>
    </div>
  )

  // ── Empty states ────────────────────────────────────────────────────────────

  if (items.length === 0) {
    // No filter active at all — show full onboarding empty state
    if (activeVisibility === 'ALL' && !isPremium) {
      return (
        <div className="listings-tab flex flex-col gap-4">
          {FilterBar}
          <div className="bg-card rounded-2xl border shadow-sm p-12 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-base">{t('no_listings')}</p>
            <Link href={`/${locale}/listings/create`}>
              <Button className="gap-2 rounded-xl h-10">
                <Plus className="h-4 w-4" />
                {t('add_listing')}
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    // One or more filters active but no results
    // Visibility filter takes precedence for message; fall back to premium message.
    const emptyKey = (activeVisibility !== 'ALL'
      ? `no_listings_${activeVisibility}`
      : 'no_listings_PREMIUM') as
      | 'no_listings_VISIBLE'
      | 'no_listings_HIDDEN'
      | 'no_listings_ARCHIVED'
      | 'no_listings_CLOSED'
      | 'no_listings_PREMIUM'

    return (
      <div className="listings-tab flex flex-col gap-4">
        {FilterBar}
        <div className="bg-card rounded-2xl border shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm text-muted-foreground">{t(emptyKey)}</p>
          <button
            type="button"
            onClick={() => setVisibility('ALL')}
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            {t('filter_ALL')}
          </button>
        </div>
      </div>
    )
  }

  // ── Listing rows ────────────────────────────────────────────────────────────

  return (
    <div className="listings-tab flex flex-col gap-3">

      {/* Filter bar + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
        {FilterBar}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {items.length} {tl('found_results', { count: items.length })}
          </span>
          <Link href={`/${locale}/listings/create`}>
            <Button size="sm" className="gap-1.5 rounded-xl h-9">
              <Plus className="h-3.5 w-3.5" />
              {t('add_listing')}
            </Button>
          </Link>
        </div>
      </div>

      {items.map(listing => {
        const cover  = listing.images?.find(i => i.is_cover) ?? listing.images?.[0]
        const status = listing.status as ListingStatus

        return (
          <div
            key={listing.id}
            className="bg-card rounded-xl border shadow-sm flex gap-4 p-3 hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <div className="relative w-24 h-20 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
              {cover ? (
                <AppImage variant="listing-thumb" src={cover.url} alt={listing.title} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Maximize2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={STATUS_VARIANT[status]} className="text-[11px] px-1.5 py-0 h-5">
                    {t(`status_${status}`)}
                  </Badge>
                  {listing.is_premium && (
                    <Badge className="text-[11px] px-1.5 py-0 h-5 bg-badge-premium text-primary-foreground">
                      {t('filter_PREMIUM')}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tl(listing.listing_type)} · {tl(`property_type_${listing.property_type}`)}
                  </span>
                </div>
                <Link
                  href={`/${activeLocale}/listings/${listing.slug}`}
                  className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
                >
                  {listing.title}
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground text-sm">
                  {formatPrice(listing.price, listing.currency, activeLocale)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {listing.views_count} {t('views')}
                </span>
                <RelativeTime date={listing.created_at} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 shrink-0 justify-start pt-0.5">
              <Link href={`/${activeLocale}/listings/${listing.slug}/edit`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  aria-label={t('edit_listing')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>

              {confirmId === listing.id ? (
                <div className="flex gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2 rounded-lg text-xs"
                    disabled={deletingId === listing.id}
                    onClick={() => handleDelete(listing.id)}
                  >
                    {deletingId === listing.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 rounded-lg text-xs"
                    onClick={() => setConfirmId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/50"
                  aria-label={t('delete')}
                  onClick={() => setConfirmId(listing.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
