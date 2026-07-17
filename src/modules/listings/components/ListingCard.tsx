'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { MantineListingCardPattern } from '@/design-system/mantine/patterns'
import type { ListingLayoutContext } from '@/lib/imageDelivery'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'
import { formatPrice, formatCount, formatListingDate } from '@/lib/formatters'
import { Maximize2, Copy, Check } from 'lucide-react'
import { getCardFeatures, type ListingSnapshot } from '@/modules/listings/domain/presentationEngine'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
import { convertPrice as convertPriceMulti } from '@/lib/getExchangeRate'
import type { ExchangeRates } from '@/lib/getExchangeRate'

export interface CardListingData extends ListingSnapshot {
  id:           string
  public_id?:   number | null
  slug:         string
  title:        string
  price:        number
  price_old?:   number | null
  currency:     string
  listing_type: string
  is_premium:   boolean
  status:       ListingStatus
  created_at:   string
  expires_at?:  string | null
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
// The centered rotated closed-overlay is plain Tailwind-styled markup (not the Badge component),
// so it is unaffected by the Task 617 Badge migration below — left as-is.
const CLOSED_OVERLAY_STYLE: Partial<Record<ListingStatus, string>> = {
  sold:   'bg-status-info/80 border-status-info',
  rented: 'bg-status-rented/80 border-status-rented',
}

// Tone -> Mantine theme color name (Task 617). Replaces the legacy `className` color override —
// Mantine's `Badge.css` sets `background`/`font-size`/`padding` as UNLAYERED rules, so a Tailwind
// `@layer utilities` className on a Mantine `Badge` can never win (Task 602/606/612/616/617
// cascade-layer trap). `new`=green, `price_reduced`=brand (matches the literal
// `globals.css --badge-reduced: var(--brand-700)` token), `status_sold`=blueLight (matches
// `--status-info`, added to the canonical `Mantine/Primitives/Badge` story first), `status_rented`
// =purple (matches `--status-rented`, `purple` added to `theme.ts` + the Badge story first),
// `status_archived`=gray, `status_expired`=yellow (matches `--status-warning`). No `variant` field
// — `MantineListingCardPattern` always renders these `variant="filled"` (opaque, safe on the
// photo these badges sit on top of; the theme's default `variant="light"` is translucent and
// unreadable over a photo, owner-caught 2026-07-17).
function getBadges(listing: CardListingData) {
  const badges: { label: string; color: string }[] = []

  // Status badges take priority for non-active listings
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'sold') {
    badges.push({ label: 'status_sold', color: 'blueLight' })
    return badges
  }
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'rented') {
    badges.push({ label: 'status_rented', color: 'purple' })
    return badges
  }
  if (isListingArchived(listing.status as ListingStatus)) {
    badges.push({ label: 'status_archived', color: 'gray' })
    return badges
  }
  if (listing.status === 'expired') {
    badges.push({ label: 'status_expired', color: 'yellow' })
    return badges
  }

  // Active listing badges
  const sevenDaysAgo = new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  if (new Date(listing.created_at) > sevenDaysAgo) {
    badges.push({ label: 'new', color: 'green' })
  }
  // Premium is expressed through card styling, not a text badge
  if (listing.price_old && listing.price < listing.price_old) {
    badges.push({ label: 'price_reduced', color: 'brand' })
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
  // Original price shown below converted price when currency differs.
  // Always 'en' grouping (deterministic, hydration-safe — see formatters.ts).
  const originalPriceStr = showConversion
    ? `${formatCount(listing.price, 'en')} ${listing.currency}`
    : null
  const pricePerSqm = listing.area_gross && listing.area_gross > 0
    ? Math.round(displayPrice / listing.area_gross)
    : null

  if (variant === 'horizontal') {
    // ── Horizontal (List view) card — thin data-mapper over
    // MantineListingCardPattern layout="list" (Task 608), mirroring the vertical branch's
    // split below: the pattern owns ALL list-row chrome (border/radius/hover, type-label+
    // inline-favorite row, title, price(+old)+per-sqm, features row, location+footer row);
    // this container only converts/formats real listing data into the pattern's data props
    // and builds the 2 behavior-bearing nodes (image/favorite; footerActions) it cannot own
    // itself (presentational-split gate). No overlay/photoCount/onContact — the ported
    // legacy list design never had them (badges already convey sold/rented).

    const thumbImage = (
      <AppImage variant="listing-thumb" src={coverImage?.url} alt={listing.title} priority={priority} predictive>
        {!coverImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Maximize2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </AppImage>
    )

    const inlineFavorite = (
      <FavoriteButton
        listingId={listing.id}
        isFavorited={isFavorited}
        onToggled={onFavoriteToggled}
        disabled={isClosed}
        disabledLabel={closedLabel}
        className="shrink-0 -mt-0.5 -mr-1"
      />
    )

    const patternBadges = badges.map(b => ({ label: t(b.label), color: b.color }))

    const listFeatures = getCardFeatures(listing).map(f => ({
      icon: <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />,
      value: f.value,
    }))

    const pricePerSqmStr = pricePerSqm ? `${formatPrice(pricePerSqm, activeCurrency, locale)} ${t('per_sqm')}` : undefined

    const listFooterActions = (
      <>
        <button
          type="button"
          onClick={copyId}
          title={listing.id}
          aria-label={idCopied ? t('id_copied') : t('copy_id')}
          className="font-mono text-2xs text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          #{listing.public_id ?? listing.id.slice(0, 8)}
          {idCopied
            ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
            : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
          }
        </button>
        <span className="whitespace-nowrap">{formatListingDate(listing.created_at, locale)}</span>
      </>
    )

    return (
      <Link
        href={`/${locale}/listings/${listing.slug}`}
        className="listing-card listing-card--horizontal block"
        data-track="listing_click"
        data-listing-slug={listing.slug}
        onClick={() => onBeforeNavigate?.(listing.slug)}
      >
        <MantineListingCardPattern
          layout="list"
          data={{
            id: listing.id,
            title: listing.title,
            location: locationName,
            price: formatPrice(displayPrice, activeCurrency, locale),
            priceOld: displayPriceOld ? formatPrice(displayPriceOld, activeCurrency, locale) : undefined,
          }}
          image={thumbImage}
          favorite={inlineFavorite}
          typeLabel={`${t(listing.listing_type)} · ${t(`property_type_${listing.property_type}`)}`}
          badges={patternBadges}
          features={listFeatures}
          originalPriceStr={originalPriceStr}
          pricePerSqmStr={pricePerSqmStr}
          footerActions={listFooterActions}
          isPremium={listing.is_premium}
          isArchived={isListingArchived(listing.status as ListingStatus)}
        />
      </Link>
    )
  }

  // ── Vertical card — thin data-mapper over MantineListingCardPattern (Task 602, completed
  // as the single source of truth in Task 605) ── The pattern owns ALL card structure/layout/
  // chrome (badges, sold/rented overlay, photo counter, features row, footer layout, premium/
  // archived, hover); this container only translates/converts/formats real listing data into
  // the pattern's data props and builds the 3 behavior-bearing nodes (image/favorite/
  // footerActions) it cannot own itself (presentational-split gate).

  // The real photo element — only the "no image" fallback lives alongside it (tied to whether
  // coverImage exists, a pure data-mapping concern, not card chrome).
  const image = (
    <AppImage variant="listing" src={coverImage?.url} alt={listing.title} priority={priority} layoutContext={layoutContext} predictive>
      {!coverImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Maximize2 className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </AppImage>
  )

  // Real favorite control — self-positions via className (contract with the pattern).
  const favorite = (
    <FavoriteButton
      listingId={listing.id}
      isFavorited={isFavorited}
      onToggled={onFavoriteToggled}
      disabled={isClosed}
      disabledLabel={closedLabel}
      className="absolute top-2 right-2 shadow-sm"
    />
  )

  // Badges + overlay — pre-translated here (pattern stays hook-free/no i18n).
  const patternBadges = badges.map(b => ({ label: t(b.label), color: b.color }))
  const overlay = isClosed
    ? { label: t(`status_${listing.status}` as 'status_sold' | 'status_rented').toUpperCase(), className: CLOSED_OVERLAY_STYLE[listing.status] }
    : undefined

  // Features — icons pre-rendered as nodes so the pattern needs no app-specific icon map.
  const features = getCardFeatures(listing).map(f => ({
    icon: <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />,
    value: f.value,
  }))

  const pricePerSqmStr = pricePerSqm ? `${formatPrice(pricePerSqm, activeCurrency, locale)} ${t('per_sqm')}` : undefined

  // Copy-ID + date cluster — carries its own state (idCopied), stays a passed node.
  const footerActions = (
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={copyId}
        title={listing.id}
        aria-label={idCopied ? t('id_copied') : t('copy_id')}
        className="font-mono text-2xs text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
      >
        #{listing.public_id ?? listing.id.slice(0, 8)}
        {idCopied
          ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
          : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
        }
      </button>
      <span className="whitespace-nowrap">{formatListingDate(listing.created_at, locale)}</span>
    </div>
  )

  return (
    <Link
      href={`/${locale}/listings/${listing.slug}`}
      className="listing-card listing-card--vertical block h-full"
      data-track="listing_click"
      data-listing-slug={listing.slug}
      onClick={() => onBeforeNavigate?.(listing.slug)}
    >
      <MantineListingCardPattern
        data={{
          id: listing.id,
          title: listing.title,
          location: locationName,
          price: formatPrice(displayPrice, activeCurrency, locale),
          priceOld: displayPriceOld ? formatPrice(displayPriceOld, activeCurrency, locale) : undefined,
        }}
        image={image}
        favorite={favorite}
        typeLabel={`${t(listing.listing_type)} · ${t(`property_type_${listing.property_type}`)}`}
        badges={patternBadges}
        overlay={overlay}
        photoCount={imageCount}
        features={features}
        originalPriceStr={originalPriceStr}
        pricePerSqmStr={pricePerSqmStr}
        footerActions={footerActions}
        isPremium={listing.is_premium}
        isArchived={isListingArchived(listing.status as ListingStatus)}
      />
    </Link>
  )
}
