'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Group, Text, useMantineTheme } from '@mantine/core'
import { AppImage } from '@/design-system/media/AppImage'
import { MantineListingCardPattern, MantineCopyIdButton } from '@/design-system/mantine/patterns'
import type { ListingLayoutContext } from '@/lib/imageDelivery'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'
import { formatPrice, formatCount, formatListingDate } from '@/lib/formatters'
import { getCardFeatures, type ListingSnapshot } from '@/modules/listings/domain/presentationEngine'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
import { convertPrice as convertPriceMulti } from '@/lib/getExchangeRate'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import { cn } from '@/lib/utils'
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone'
import styles from './ListingCard.module.css'

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
// The sold/rented overlay colour is owned by `MantineListingCardPattern` (`overlay.tone`, Task 886 R40).

// Tone -> Mantine theme color name (Task 617). The four closed-status colours (sold/rented/archived/expired) come
// from `LISTING_STATUS_COLOR` (`listingStatusTone.ts`) — the one source shared with `ListingStatusBanner` (Task 741 R3).
// Replaces the legacy `className` color override —
// Mantine's `Badge.css` sets `background`/`font-size`/`padding` as UNLAYERED rules, so a Tailwind
// `@layer utilities` className on a Mantine `Badge` can never win (Task 602/606/612/616/617
// cascade-layer trap). `new`=green, `price_reduced`=`sale` (Task 619 — a dedicated owner-provided
// crimson `#dd0939`, replacing `brand`; matches the detail pattern's `reduced` badge so the
// "price reduced" signal reads as the same color on both surfaces, no longer colliding with the
// page's own `color="brand"` price text), `status_sold`=blueLight (matches
// `--status-info`, added to the canonical `Mantine/Primitives/Badge` story first), `status_rented`
// =purple (matches `--status-rented`, `purple` added to `theme.ts` + the Badge story first),
// `status_archived`=gray, `status_expired`=yellow (matches `--status-warning`). No `variant` field
// — `MantineListingCardPattern` always renders these `variant="filled"` (opaque, safe on the
// photo these badges sit on top of; the theme's default `variant="light"` is translucent and
// unreadable over a photo, owner-caught 2026-07-17).
// `status_inactive`=gray and `status_pending`=yellow come from the same map (Task 741 R3b, owner D46-4).
// One predicate for the struck old price and the "price reduced" badge (Task 912): a price is
// struck through only when the owner lowered it.
function isListingPriceReduced(listing: CardListingData): boolean {
  return listing.price_old != null && listing.price < listing.price_old
}

function getBadges(listing: CardListingData) {
  const badges: { label: string; color: string }[] = []

  // Status badges take priority for non-active listings
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'sold') {
    badges.push({ label: 'status_sold', color: LISTING_STATUS_COLOR.sold })
    return badges
  }
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes sold vs rented individually; isListingClosed() merges both and cannot be used here
  if (listing.status === 'rented') {
    badges.push({ label: 'status_rented', color: LISTING_STATUS_COLOR.rented })
    return badges
  }
  if (isListingArchived(listing.status as ListingStatus)) {
    badges.push({ label: 'status_archived', color: LISTING_STATUS_COLOR.archived })
    return badges
  }
  if (listing.status === 'expired') {
    badges.push({ label: 'status_expired', color: LISTING_STATUS_COLOR.expired })
    return badges
  }
  // Task 741 R3b (owner D46-4, 2026-10-04): inactive and pending are labelled from the same map, gray / yellow.
  // They return early like the other non-active statuses, so neither gets `new` / `price_reduced`.
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes inactive vs pending individually; isListingHidden() merges them (and expired) and cannot be used here
  if (listing.status === 'inactive') {
    badges.push({ label: 'status_inactive', color: LISTING_STATUS_COLOR.inactive })
    return badges
  }
  // eslint-disable-next-line no-restricted-syntax -- badge color distinguishes inactive vs pending individually; isListingHidden() merges them (and expired) and cannot be used here
  if (listing.status === 'pending') {
    badges.push({ label: 'status_pending', color: LISTING_STATUS_COLOR.pending })
    return badges
  }

  // Active listing badges
  const sevenDaysAgo = new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  if (new Date(listing.created_at) > sevenDaysAgo) {
    badges.push({ label: 'new', color: 'green' })
  }
  // Premium is expressed through card styling, not a text badge
  if (isListingPriceReduced(listing)) {
    badges.push({ label: 'price_reduced', color: 'sale' })
  }
  return badges
}

export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, displayCurrency, rates, isFavorited = false, onFavoriteToggled, priority = false, layoutContext }: ListingCardProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const theme = useMantineTheme()
  const badges = getBadges(listing)
  const isClosed = isListingClosed(listing.status as ListingStatus)
  const closedLabel = isClosed ? t(`action_disabled_${listing.status}` as 'action_disabled_sold' | 'action_disabled_rented') : undefined
  const copyIdLabel = `#${listing.public_id ?? listing.id.slice(0, 8)}`

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

  const isHorizontal = variant === 'horizontal'

  // ── Everything the card shows is built ONCE here and passed to `MantineListingCardPattern` for both variants
  // (Task 741 Revision 3h, owner D46-9): the container is a thin data-mapper, so the grid and the list card cannot
  // drift. Only the photo (a different delivery variant), the favourite control (its position) and the wrapper class
  // differ between the two variants.
  const patternBadges = badges.map(b => ({ label: t(b.label), color: b.color }))
  const overlay = isClosed
    ? { label: t(`status_${listing.status}` as 'status_sold' | 'status_rented').toUpperCase(), tone: listing.status as 'sold' | 'rented' }
    : undefined

  // Features — icons pre-rendered as nodes so the pattern needs no app-specific icon map.
  const features = getCardFeatures(listing).map(f => ({
    icon: <ListingFeatureIcon name={f.icon} size={theme.other.iconSize.compact} />,
    value: f.value,
  }))

  const pricePerSqmStr = pricePerSqm ? `${formatPrice(pricePerSqm, activeCurrency, locale)} ${t('per_sqm')}` : undefined

  // Copy-ID + date cluster — the canonical MantineCopyIdButton owns the clipboard write and the copied-state toggle
  // internally; this container only supplies the real id, display label, and translated aria strings.
  const footerActions = (
    <Group justify="flex-end" gap="xs" wrap="nowrap" fz="xs" c="dimmed">
      <MantineCopyIdButton
        id={listing.id}
        label={copyIdLabel}
        copyLabel={t('copy_id')}
        copiedLabel={t('id_copied')}
      />
      <Text component="span" size="xs" c="dimmed" miw="max-content">
        {formatListingDate(listing.created_at, locale)}
      </Text>
    </Group>
  )

  const data = {
    id: listing.id,
    title: listing.title,
    location: locationName,
    price: formatPrice(displayPrice, activeCurrency, locale),
    priceOld: isListingPriceReduced(listing) && displayPriceOld != null ? formatPrice(displayPriceOld, activeCurrency, locale) : undefined,
  }
  const typeLabel = `${t(listing.listing_type)} · ${t(`property_type_${listing.property_type}`)}`

  // The real photo element — the no-image / failed-load fallback is AppImage's canonical `MediaPlaceholder`
  // (Task 886 R22), not a card-local icon. The list row uses the `listing-thumb` delivery variant.
  const image = isHorizontal
    ? <AppImage variant="listing-thumb" src={coverImage?.url} alt={listing.title} priority={priority} predictive />
    : <AppImage variant="listing" src={coverImage?.url} alt={listing.title} priority={priority} layoutContext={layoutContext} predictive />

  // Real favourite control. Vertical: floats on the photo (self-positions via className, the contract with the
  // pattern). Horizontal: sits inline at the end of the head row.
  const favorite = (
    <FavoriteButton
      listingId={listing.id}
      isFavorited={isFavorited}
      onToggled={onFavoriteToggled}
      disabled={isClosed}
      disabledLabel={closedLabel}
      overlay={!isHorizontal}
      className={isHorizontal ? undefined : styles.overlayFavorite}
    />
  )

  return (
    <Link
      href={`/${locale}/listings/${listing.slug}`}
      className={cn('listing-card', isHorizontal ? 'listing-card--horizontal' : 'listing-card--vertical', styles.card, !isHorizontal && styles.cardVertical)}
      data-track="listing_click"
      data-listing-slug={listing.slug}
      onClick={() => onBeforeNavigate?.(listing.slug)}
    >
      <MantineListingCardPattern
        layout={isHorizontal ? 'list' : 'grid'}
        data={data}
        image={image}
        favorite={favorite}
        typeLabel={typeLabel}
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
