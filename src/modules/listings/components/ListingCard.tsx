'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import type { ListingLayoutContext } from '@/lib/imageDelivery'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'
import { formatPrice } from '@/lib/formatters'
import { MapPin, Camera, Maximize2, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { cn } from '@/lib/utils'
import { getCardFeatures, type ListingSnapshot } from '@/modules/listings/domain/presentationEngine'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
import { convertPrice as convertPriceMulti } from '@/lib/getExchangeRate'
import type { ExchangeRates } from '@/lib/getExchangeRate'

export interface CardListingData extends ListingSnapshot {
  id:           string
  slug:         string
  title:        string
  price:        number
  price_old?:   number | null
  currency:     string
  listing_type: string
  is_premium:   boolean
  status:       ListingStatus
  created_at:   string
  images?:      { url: string; is_cover: boolean; order: number }[] | null
  location?:    { id: number; name_al: string; slug: string; type: string } | null
  views_count?: number
}

interface ListingCardProps {
  listing: CardListingData
  variant?: 'vertical' | 'horizontal'
  onBeforeNavigate?: (slug: string) => void
  displayCurrency?: string
  /** Multi-currency rates map (ALL per 1 foreign currency). */
  rates?: ExchangeRates | null
  isFavorited?: boolean
  onFavoriteToggled?: (newState: boolean) => void
  /** Mark the card image as LCP-priority. Use getImagePriority() from imageDelivery to decide. */
  priority?: boolean
  /** Grid layout context for the listing image sizes hint. See ListingLayoutContext in imageDelivery.ts. */
  layoutContext?: ListingLayoutContext
}

// Display map — allowed by domain policy (badge colors are presentation-layer constants).
const CLOSED_OVERLAY_STYLE: Partial<Record<ListingStatus, string>> = {
  sold:   'bg-status-info/80 border-status-info',
  rented: 'bg-status-rented/80 border-status-rented',
}

function getBadges(listing: CardListingData) {
  const badges: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }[] = []

  // Status badges take priority for non-active listings
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'sold') {
    badges.push({ label: 'status_sold', variant: 'default', className: 'bg-status-info text-primary-foreground' })
    return badges
  }
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'rented') {
    badges.push({ label: 'status_rented', variant: 'default', className: 'bg-status-rented text-primary-foreground' })
    return badges
  }
  if (isListingArchived(listing.status as ListingStatus)) {
    badges.push({ label: 'status_archived', variant: 'outline', className: 'border-border text-muted-foreground' })
    return badges
  }

  // Active listing badges
  const sevenDaysAgo = new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  if (new Date(listing.created_at) > sevenDaysAgo) {
    badges.push({ label: 'new', variant: 'default', className: 'bg-badge-new hover:bg-badge-new/90 text-primary-foreground' })
  }
  // Premium is expressed through card styling, not a text badge
  if (listing.price_old && listing.price < listing.price_old) {
    badges.push({ label: 'price_reduced', variant: 'default', className: 'bg-badge-reduced hover:bg-badge-reduced/90 text-primary-foreground' })
  }
  return badges
}

export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, displayCurrency, rates, isFavorited = false, onFavoriteToggled, priority = false, layoutContext }: ListingCardProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const badges = getBadges(listing)
  const [idCopied, setIdCopied] = useState(false)
  const isClosed = isListingClosed(listing.status as ListingStatus)
  const closedLabel = isClosed ? t(`action_disabled_${listing.status}` as 'action_disabled_sold' | 'action_disabled_rented') : undefined

  function copyId(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard?.writeText(listing.id).catch(() => {})
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 1500)
  }

  const coverImage = listing.images?.find(img => img.is_cover) || listing.images?.[0]
  const imageCount = listing.images?.length ?? 0
  const locationName = listing.location?.name_al ?? ''

  const effectiveRates: ExchangeRates | null = rates ?? null
  const showConversion = !!(displayCurrency && effectiveRates && displayCurrency !== listing.currency)
  const activeCurrency = showConversion ? displayCurrency! : listing.currency
  const displayPrice = showConversion
    ? convertPriceMulti(listing.price, listing.currency, displayCurrency!, effectiveRates)
    : listing.price
  const displayPriceOld = listing.price_old
    ? (showConversion ? convertPriceMulti(listing.price_old, listing.currency, displayCurrency!, effectiveRates) : listing.price_old)
    : null
  // Original price shown below converted price when currency differs
  const originalPriceStr = showConversion
    ? `${new Intl.NumberFormat('en').format(Math.round(listing.price))} ${listing.currency}`
    : null
  const pricePerSqm = listing.area_gross && listing.area_gross > 0
    ? Math.round(displayPrice / listing.area_gross)
    : null

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/${locale}/listings/${listing.slug}`}
        className={cn(
          "listing-card listing-card--horizontal group flex gap-3 rounded-xl border bg-card transition-shadow overflow-hidden",
          listing.is_premium
            ? "border-badge-premium/50 shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)] hover:shadow-[0_4px_16px_oklch(0.700_0.162_65_/_0.25)]"
            : "hover:shadow-md",
          isListingArchived(listing.status as ListingStatus) && "grayscale opacity-60 hover:opacity-70",
        )}
        data-track="listing_click"
        data-listing-slug={listing.slug}
        onClick={() => onBeforeNavigate?.(listing.slug)}
      >
        {/* Image */}
        <div className="relative w-32 shrink-0 sm:w-44 self-stretch min-h-[80px] overflow-hidden bg-muted">
          {coverImage ? (
            <AppImage variant="listing-thumb" src={coverImage.url} alt={listing.title} priority={priority} predictive />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.map(b => (
              <Badge key={b.label} variant={b.variant} className={cn('text-[10px] px-1.5 py-0', b.className)}>
                {t(b.label)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between py-3 pr-3 flex-1 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="text-xs text-muted-foreground">
                {t(listing.listing_type)} · {t(`property_type_${listing.property_type}`)}
              </p>
              <FavoriteButton
                listingId={listing.id}
                isFavorited={isFavorited}
                onToggled={onFavoriteToggled}
                disabled={isClosed}
                disabledLabel={closedLabel}
                className="shrink-0 -mt-0.5 -mr-1"
              />
            </div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
          </div>
          <div>
            <div className="flex flex-col mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-primary">{formatPrice(displayPrice, activeCurrency, locale)}</span>
                {displayPriceOld && (
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(displayPriceOld, activeCurrency, locale)}</span>
                )}
              </div>
              {originalPriceStr && (
                <span className="text-[10px] text-muted-foreground/70 leading-tight">{originalPriceStr}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {getCardFeatures(listing).map(f => (
                <span key={f.key} className="flex items-center gap-1">
                  <ListingFeatureIcon name={f.icon} className="h-3 w-3" />
                  {f.value}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              {locationName ? (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {locationName}
                </span>
              ) : <span />}
              <span className="ml-auto shrink-0 pl-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyId}
                  title={listing.id}
                  aria-label={idCopied ? t('id_copied') : t('copy_id')}
                  className="font-mono text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                >
                  #{listing.id.slice(0, 8)}
                  {idCopied
                    ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
                    : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
                  }
                </button>
                <RelativeTime date={listing.created_at} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/${locale}/listings/${listing.slug}`}
      className={cn(
        "listing-card listing-card--vertical group flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200",
        listing.is_premium
          ? "border-badge-premium/50 shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)] hover:shadow-[0_8px_24px_oklch(0.700_0.162_65_/_0.2)] hover:-translate-y-0.5"
          : "hover:shadow-lg hover:-translate-y-0.5",
        isListingArchived(listing.status as ListingStatus) && "grayscale opacity-60 hover:opacity-70",
      )}
      data-track="listing_click"
      data-listing-slug={listing.slug}
      onClick={() => onBeforeNavigate?.(listing.slug)}
    >
      {/* Premium top stripe */}
      {listing.is_premium && (
        <div className="h-0.5 bg-gradient-to-r from-badge-premium/0 via-badge-premium to-badge-premium/0 shrink-0" />
      )}

      {/* Image — AppImage owns the aspect-[4/3] container; overlays go inside as children */}
      <AppImage variant="listing" src={coverImage?.url} alt={listing.title} priority={priority} layoutContext={layoutContext} predictive>
        {/* No-image fallback */}
        {!coverImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Maximize2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Sold/Rented overlay */}
        {isListingClosed(listing.status as ListingStatus) && (
          <div className="absolute inset-0 bg-overlay/30 flex items-center justify-center">
            <span className={cn(
              'text-overlay-foreground font-bold text-sm px-3 py-1.5 rounded-xl rotate-[-8deg] border-2',
              CLOSED_OVERLAY_STYLE[listing.status],
            )}>
              {t(`status_${listing.status}`).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {badges.map(b => (
            <Badge key={b.label} variant={b.variant} className={cn('text-[10px] px-1.5 py-0', b.className)}>
              {t(b.label)}
            </Badge>
          ))}
        </div>

        {/* Photo count bottom-right */}
        {imageCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-overlay/60 text-overlay-foreground text-xs px-2 py-0.5 rounded-full">
            <Camera className="h-3 w-3" />
            {imageCount}
          </div>
        )}

        {/* Favorite button */}
        <FavoriteButton
          listingId={listing.id}
          isFavorited={isFavorited}
          onToggled={onFavoriteToggled}
          disabled={isClosed}
          disabledLabel={closedLabel}
          className="absolute top-2 right-2 shadow-sm"
        />
      </AppImage>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        {/* Type label */}
        <p className="text-xs text-muted-foreground">
          {t(listing.listing_type)} · {t(`property_type_${listing.property_type}`)}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">{formatPrice(displayPrice, activeCurrency, locale)}</span>
              {displayPriceOld && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(displayPriceOld, activeCurrency, locale)}</span>
              )}
            </div>
            {originalPriceStr && (
              <span className="text-[10px] text-muted-foreground/70 leading-tight">{originalPriceStr}</span>
            )}
          </div>
          {pricePerSqm && (
            <span className="text-xs text-muted-foreground">{formatPrice(pricePerSqm, activeCurrency, locale)} {t('per_sqm')}</span>
          )}
        </div>

        {/* Features row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          {getCardFeatures(listing).map(f => (
            <span key={f.key} className="flex items-center gap-1">
              <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />
              {f.value}
            </span>
          ))}
        </div>

        {/* Location + date + ID */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {locationName && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {locationName}
            </span>
          )}
          <span className="ml-auto shrink-0 pl-2 flex items-center gap-2">
            <button
              type="button"
              onClick={copyId}
              title={listing.id}
              aria-label={idCopied ? t('id_copied') : t('copy_id')}
              className="font-mono text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              #{listing.id.slice(0, 8)}
              {idCopied
                ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
                : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
              }
            </button>
            <RelativeTime date={listing.created_at} />
          </span>
        </div>
      </div>
    </Link>
  )
}
