'use client'

/**
 * Shared story helper — StoryListingCard + STORY_LISTINGS fixture.
 *
 * Mirrors the live ListingCard field set (Task 365 parity) without auth/API deps.
 * Imported by ListingGrid.stories.tsx and RecentlyViewedSection.stories.tsx.
 * Single source — Note 14 (no duplicate mock card components).
 *
 * Fields: image placeholder, premium stripe + border, status badges (new/price_reduced/
 * sold overlay/rented overlay/archived), photo count, favorite stub, price + /m²,
 * old price (strike-through), features row (area/beds), location, public-id copy, date-with-year.
 */

import { useState } from 'react'
import { MapPin, Maximize2, Camera, Heart, Copy, Check, BedDouble } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice, formatListingDate } from '@/lib/formatters'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import { LISTINGS_GRID_FIXTURE, makeListingFixtures } from './fixtures/listing.fixture'

// ── Extended fixture type ─────────────────────────────────────────────────────

export type StoryCardData = Omit<typeof LISTINGS_GRID_FIXTURE[number], 'status'> & {
  price_old?: number
  public_id: number
  imageCount: number
  status: 'active' | 'sold' | 'rented' | 'archived' | 'expired'
  location: string
}

// ── Story fixture with status/price variants ──────────────────────────────────

const STORY_STATUSES: StoryCardData['status'][] = [
  'active', 'active', 'sold', 'active', 'rented', 'active', 'archived', 'active',
]

const LOCATIONS = ['Tirana', 'Durrës', 'Sauk', 'Kombinat', 'Blloku', 'Vlorë', 'Berat', 'Elbasan']

/**
 * Factory — builds story listings with locale-resolved titles.
 * Call at render time: makeStoryListings(context?.globals?.locale ?? 'en')
 * Replaces the static STORY_LISTINGS export for locale-aware renders.
 */
export function makeStoryListings(locale: string): StoryCardData[] {
  return makeListingFixtures(locale).LISTINGS_GRID_FIXTURE.map((l, i) => ({
    ...(l as Omit<typeof l, 'status'>),
    price_old:  i === 0 ? l.price + 12000 : undefined,
    public_id:  1000 + i,
    imageCount: 3 + (i % 4),
    status:     STORY_STATUSES[i] ?? 'active',
    location:   LOCATIONS[i] ?? l.city,
  }))
}

/** Backward-compat static export (English). Task 381 migrates consumers to makeStoryListings(locale). */
export const STORY_LISTINGS: StoryCardData[] = makeStoryListings('en')

// ── StoryListingCard — mirrors live ListingCard (no auth/API deps) ────────────

export function StoryListingCard({ data }: { data: StoryCardData }) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const isClosed = isListingClosed(data.status)
  const isArchived = isListingArchived(data.status)
  const activeCurrency = data.displayCurrency ?? data.currency

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const pricePerSqm = data.area_sqm > 0 ? Math.round(data.price / data.area_sqm) : null

  return (
    <div
      className={cn(
        'listing-card listing-card--vertical flex flex-col h-full rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        data.is_premium
          ? 'border-badge-premium'
          : '',
        isArchived && 'grayscale opacity-60',
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Maximize2 className="h-8 w-8" />
        </div>

        {/* Sold/Rented overlay */}
        {isClosed && (
          <div className="absolute inset-0 bg-overlay/30 flex items-center justify-center">
            <span className={cn(
              'text-overlay-foreground font-bold text-sm px-3 py-1.5 rounded-xl rotate-[-8deg] border-2',
              ({ sold: 'bg-status-info/80 border-status-info', rented: 'bg-status-rented/80 border-status-rented' } as Record<string, string>)[data.status] ?? 'bg-overlay/80 border-overlay',
            )}>
              {t(`status_${data.status}` as 'status_sold' | 'status_rented').toUpperCase()}
            </span>
          </div>
        )}

        {/* Status badges — new / price_reduced / archived */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {data.is_new && (
            <Badge variant="default" className="text-2xs px-1.5 py-0 bg-badge-new text-primary-foreground">
              {t('new')}
            </Badge>
          )}
          {data.price_old && data.price < data.price_old && (
            <Badge variant="default" className="text-2xs px-1.5 py-0 bg-badge-reduced text-primary-foreground">
              {t('price_reduced')}
            </Badge>
          )}
          {isArchived && (
            <Badge variant="outline" className="text-2xs px-1.5 py-0 border-border text-muted-foreground">
              {t('status_archived')}
            </Badge>
          )}
          {data.status === 'expired' && (
            <Badge variant="outline" className="text-2xs px-1.5 py-0 border-status-warning text-status-warning">
              {t('status_expired')}
            </Badge>
          )}
        </div>

        {/* Photo count chip */}
        {data.imageCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-overlay/60 text-overlay-foreground text-xs px-2 py-0.5 rounded-full">
            <Camera className="h-3 w-3" />
            {data.imageCount}
          </div>
        )}

        {/* Favorite button stub (visual only, no server action) */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('add_favorite')}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
          onClick={e => { e.preventDefault(); e.stopPropagation(); setFavorited(f => !f) }}
          disabled={isClosed}
        >
          <Heart className={cn('h-4 w-4', favorited ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
        </Button>
      </div>

      {/* Card body — flex-1 so all cards in a grid row share the same height */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Listing type + property type */}
        <p className="text-xs text-muted-foreground">
          {t(data.transaction_type as 'sale' | 'rent')} · {t('property_type_apartment')}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
          {data.title}
        </h3>

        {/* Price block — mirrors live PriceBlock contract: one currency marker, atomic clusters */}
        <div className="w-full">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 justify-between">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-primary whitespace-nowrap">
                {formatPrice(data.price, activeCurrency, locale)}
              </span>
              {data.price_old && data.price < data.price_old && (
                <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                  {formatPrice(data.price_old, activeCurrency, locale)}
                </span>
              )}
            </div>
            {pricePerSqm && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatPrice(pricePerSqm, activeCurrency, locale)} {t('per_sqm')}
              </span>
            )}
          </div>
        </div>

        {/* Features row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            {data.area_sqm}m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 shrink-0" />
            {data.bedrooms}
          </span>
        </div>

        {/* Location + date + public ID */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {data.location}
          </span>
          <span className="ml-auto shrink-0 pl-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title={`ID: ${data.id}`}
              aria-label={copied ? t('id_copied') : t('copy_id')}
              className="h-auto w-auto p-0 font-mono text-2xs text-muted-foreground/70 hover:bg-transparent hover:text-muted-foreground rounded gap-0.5 focus-visible:ring-1"
            >
              #{data.public_id}
              {copied
                ? <Check className="size-2.5 shrink-0 text-status-success" />
                : <Copy className="size-2.5 shrink-0 opacity-50" />
              }
            </Button>
            <span className="text-2xs whitespace-nowrap">
              {formatListingDate(data.created_at, locale)}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
