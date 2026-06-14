import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { MapPin, Eye, CalendarDays, Info } from 'lucide-react'
import { GalleryStaticFrame } from '@/modules/listings/components/GalleryStaticFrame'
import { GalleryIsland } from '@/modules/listings/components/GalleryIsland'
import { SimilarListings } from '@/modules/listings/components/SimilarListings'
import { MapWrapper } from '@/components/shared/MapWrapper'
import { Badge } from '@/components/ui/badge'
import { ListingBackButton } from '@/modules/listings/components/ListingBackButton'
import { ListingStatusBanner } from '@/modules/listings/components/ListingStatusBanner'
import { ListingMobileCTA } from '@/modules/listings/components/ListingMobileCTA'
import { ViewTracker } from '@/modules/listings/components/ViewTracker'
import { RecentlyViewedTracker } from '@/modules/listings/components/RecentlyViewedTracker'
import { RecentlyViewedSection, RecentlyViewedSkeleton } from '@/modules/listings/components/RecentlyViewedSection'
import { formatPrice } from '@/lib/formatters'
import type { DetailFeature, DetailAttribute } from '@/modules/listings/domain/presentationEngine'
import { isListingArchived, isListingVisible } from '@/modules/listings/domain'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'
import { ListingReportDialog } from '@/modules/listings/components/ListingReportDialog'
import { cn } from '@/lib/utils'
import type { Listing, ListingImage, ListingStatus, Location, PublicUserProfile } from '@/types/database'

// ── Lazy client island — ListingContact ──────────────────────────────────────
// ssr: true keeps the phone/WhatsApp links in the SSR HTML for SEO and screen
// readers, but splits the JS into a separate lazily-loaded chunk.
const LazyListingContact = dynamic(
  () => import('@/modules/listings/components/ListingContact').then(m => ({ default: m.ListingContact })),
  { ssr: true }
)

// ── Similar listings Suspense fallback ────────────────────────────────────────
export function SimilarListingsSkeleton() {
  return (
    <div>
      <div className="h-7 w-48 rounded-lg bg-muted animate-pulse mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border overflow-hidden">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type PreviewBanner = 'unpublished' | 'published' | null

export interface ListingDetailViewListing extends Listing {
  location: Pick<Location, 'id' | 'name_al' | 'slug' | 'type'> | null
}

// next-intl's `t` from getTranslations() (server) and useTranslations() (client)
// are structurally interchangeable for the plain `t(key)` / `t(key, values)` calls
// used in this view — `any` on the key avoids fighting the two call signatures'
// literal-union key types across the server/client boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translator = (key: any, values?: Record<string, string | number | Date>) => string

export interface ListingDetailViewProps {
  listing: ListingDetailViewListing
  owner: PublicUserProfile
  sortedImages: Pick<ListingImage, 'url' | 'is_cover' | 'order'>[]
  coverImage: Pick<ListingImage, 'url' | 'is_cover' | 'order'> | undefined
  galleryPreload: ReturnType<typeof buildGalleryMainPreloadAttrs>
  isNew: boolean
  isPriceReduced: boolean
  features: DetailFeature[]
  detailAttrs: DetailAttribute[]
  displayPrice: number
  displayCurrencyCode: string
  displayPriceOld: number | null
  originalPriceStr: string | null
  pricePerSqm: number | null
  formattedPrice: string
  relativeTimeStr: string
  listingUrl: string
  locale: string
  isGuest: boolean
  canReport: boolean
  isInitiallyFavorited: boolean
  /** Listing ID required to enable the favorite action; omit/undefined disables it. */
  listingId?: string
  /** True when rendered from the admin staff preview route (`/admin/listings/[id]/preview`). */
  isStaffPreview?: boolean
  /** Staff-only banner shown above the content grid in preview mode. */
  previewBanner?: PreviewBanner
}

export interface ListingDetailViewBodyProps extends ListingDetailViewProps {
  t: Translator
  tNav: Translator
  tc: Translator
  /** Below-the-fold "similar listings" section — async Server Component in production, placeholder in Storybook. */
  similarListingsSlot: ReactNode
  /** "Recently viewed" section — async Server Component in production, placeholder in Storybook. Rendered only when `!isStaffPreview`. */
  recentlyViewedSlot: ReactNode
}

/**
 * Sync, presentational body of the shared listing detail view. Split out from
 * `ListingDetailView` so it can be rendered in Storybook (where `getTranslations`
 * and the async `SimilarListings`/`RecentlyViewedSection` Server Components — both
 * doing live Supabase queries — cannot run). `ListingDetailView` (below) is the
 * production entry point; it resolves translations and passes the real async
 * sections as `similarListingsSlot`/`recentlyViewedSlot`.
 */
export function ListingDetailViewBody({
  listing,
  owner,
  sortedImages,
  coverImage,
  galleryPreload,
  isNew,
  isPriceReduced,
  features,
  detailAttrs,
  displayPrice,
  displayCurrencyCode,
  displayPriceOld,
  originalPriceStr,
  pricePerSqm,
  formattedPrice,
  relativeTimeStr,
  listingUrl,
  locale,
  isGuest,
  canReport,
  isInitiallyFavorited,
  listingId,
  isStaffPreview = false,
  previewBanner = null,
  t,
  tNav,
  tc,
  similarListingsSlot,
  recentlyViewedSlot,
}: ListingDetailViewBodyProps) {
  const images = sortedImages

  // Preview mode never allows reporting/favoriting and never seeds the
  // favorite action with a listing id (Note 14 — keep these inert).
  const effectiveCanReport = isStaffPreview ? false : canReport
  const effectiveIsFavorited = isStaffPreview ? false : isInitiallyFavorited
  const effectiveListingId = isStaffPreview ? undefined : listingId

  return (
    <div className="pb-32 md:pb-20 lg:pb-8">
      {/* ── LCP image preload — native RSC <link>, hoisted to <head> by React 19 / Next.js. */}
      {galleryPreload && (
        <link
          rel="preload"
          as="image"
          href={galleryPreload.href}
          imageSrcSet={galleryPreload.imageSrcSet}
          imageSizes={galleryPreload.imageSizes}
          fetchPriority="high" // eslint-disable-line no-restricted-syntax -- fetchPriority on <link rel="preload"> is intentional; governance rule targets <img> bypass only
        />
      )}

      {/* View/recently-viewed tracking is suppressed in staff preview — does not
          inflate view counts or pollute the staff member's recently-viewed list. */}
      {!isStaffPreview && (
        <>
          <ViewTracker slug={listing.slug} />
          <RecentlyViewedTracker listingId={listing.id} />
        </>
      )}

      {/* Sticky mobile contact bar — shown only on mobile when owner has contact info */}
      {!isListingArchived(listing.status as ListingStatus) && (owner.has_phone || owner.has_whatsapp) && (
        <ListingMobileCTA
          price={formattedPrice}
          hasPhone={owner.has_phone}
          hasWhatsapp={owner.has_whatsapp}
          listingId={listing.id}
          listingTitle={listing.title}
          listingOwnerId={listing.user_id}
          locale={locale}
        />
      )}

      {/* Breadcrumbs */}
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap" aria-label={tc('aria_breadcrumb')}>
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">{tNav('home')}</Link>
            <span>/</span>
            <Link href={`/${locale}/listings`} className="hover:text-foreground transition-colors">{t('all_listings')}</Link>
            {listing.location && (<><span>/</span><Link href={`/${locale}/listings?location_id=${listing.location.id}`} className="hover:text-foreground transition-colors">{listing.location.name_al}</Link></>)}
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{listing.title}</span>
          </nav>
        </div>
      </div>

      <div className="container-wide pt-4 pb-6">
        <div className="mb-5">
          <ListingBackButton locale={locale} label={t('back_to_listings')} />
        </div>

        {/* Staff-only preview banner — always above the content grid */}
        {isStaffPreview && previewBanner && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-5 py-4 mb-6',
              previewBanner === 'unpublished'
                ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                : 'bg-status-info/10 border-status-info/30 text-status-info',
            )}
          >
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug whitespace-normal break-words">
                {previewBanner === 'unpublished' ? t('preview_banner_unpublished') : t('preview_banner_published')}
              </p>
              {previewBanner === 'published' && (
                <Link
                  href={`/${locale}/listings/${listing.slug}`}
                  target="_blank"
                  className="inline-flex items-center min-h-11 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity w-fit whitespace-normal break-words"
                >
                  {t('preview_open_public')}
                </Link>
              )}
            </div>
          </div>
        )}

        {!isListingVisible(listing.status as ListingStatus) && (
          <ListingStatusBanner
            status={listing.status as 'sold' | 'rented' | 'archived'}
            message={t(`status_banner_${listing.status}`)}
            similarLabel={t('similar_listings')}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-8 min-w-0">

            {/* ── Gallery — LCP-optimised RSC + lazy interactive shell ───────── */}
            <div id="gallery-wrapper-static">
              <GalleryStaticFrame coverUrl={coverImage?.url ?? null} title={listing.title} />
              {images.length > 1 && (
                <div id="gallery-btn-placeholder" className="mt-3 h-5" aria-hidden="true" />
              )}
            </div>
            <div id="gallery-interactive-shell" className="hidden">
              <GalleryIsland images={images} title={listing.title} />
            </div>

            {/* Title + price + badges */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {isNew && <Badge className="bg-badge-new text-primary-foreground">{t('new')}</Badge>}
                {listing.is_premium && <Badge className="bg-badge-premium text-primary-foreground">{t('premium')}</Badge>}
                {isPriceReduced && <Badge className="bg-badge-reduced text-primary-foreground">{t('price_reduced')}</Badge>}
                <Badge variant="outline">{t(listing.listing_type)}</Badge>
                <Badge variant="outline">{t(`property_type_${listing.property_type}`)}</Badge>
              </div>

              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{listing.title}</h1>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-primary">{formattedPrice}</span>
                  {isPriceReduced && <span className="text-lg text-muted-foreground line-through">{formatPrice(displayPriceOld!, displayCurrencyCode, locale)}</span>}
                  {pricePerSqm && <span className="text-sm text-muted-foreground whitespace-nowrap">{formatPrice(pricePerSqm, displayCurrencyCode, locale)} {t('per_sqm')}</span>}
                </div>
                {originalPriceStr && (
                  <span className="text-xs text-muted-foreground">{t('original_price')}: {originalPriceStr}</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {listing.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{listing.location.name_al}</span>
                )}
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{listing.views_count} {t('views')}</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{relativeTimeStr}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground/70">ID: #{listing.public_id}</span>
              </div>
            </div>

            {/* Key features grid */}
            {features.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-sm p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {features.map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />
                        {t(f.labelKey)}
                      </span>
                      <span className="font-semibold text-sm">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="rounded-2xl border bg-card shadow-sm p-5">
                <h2 className="font-bold text-lg mb-3">{t('description_label')}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Additional details */}
            {detailAttrs.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-sm p-5">
                <h2 className="font-bold text-lg mb-4">{t('amenities_label')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailAttrs.map(a => (
                    <div key={a.labelKey} className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t(a.labelKey)}</span>
                      <span className="text-sm font-medium">{t(a.valueKey)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {listing.lat && listing.lng && (
              <div className="rounded-2xl border bg-card shadow-sm p-5">
                <h2 className="font-bold text-lg mb-4">{t('location_label')}</h2>
                <MapWrapper lat={listing.lat} lng={listing.lng} title={listing.title} />
              </div>
            )}

            {/* Report — authenticated non-owner only (always inert in staff preview) */}
            {effectiveCanReport && (
              <div className="flex justify-end">
                <ListingReportDialog listingId={listing.id} />
              </div>
            )}

            {/* Recently viewed — suppressed in staff preview */}
            {!isStaffPreview && recentlyViewedSlot}

            {/* Similar listings — Server Component streamed below the fold. */}
            <div id="similar-listings">
              {similarListingsSlot}
            </div>
          </div>

          {/* ── Right column: contact sidebar — always rendered ── */}
          <LazyListingContact
            owner={owner}
            isGuest={isGuest}
            listingTitle={listing.title}
            listingUrl={listingUrl}
            price={displayPrice}
            currency={displayCurrencyCode}
            originalPrice={originalPriceStr ?? undefined}
            originalPriceLabel={t('original_price')}
            listingStatus={listing.status as ListingStatus}
            listingId={effectiveListingId}
            isFavorited={effectiveIsFavorited}
            canReport={effectiveCanReport}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Shared presentational detail view consumed by BOTH the public listing page
 * (`/[locale]/listings/[slug]`) and the admin staff preview route
 * (`/admin/listings/[id]/preview`). All data is pre-fetched/pre-computed by
 * the caller — this component resolves translations and the async below-the-fold
 * sections, then delegates rendering to `ListingDetailViewBody`.
 */
export async function ListingDetailView(props: ListingDetailViewProps) {
  const t = await getTranslations('listing')
  const tNav = await getTranslations('nav')
  const tc = await getTranslations('common')

  const { listing, isStaffPreview = false } = props

  return (
    <ListingDetailViewBody
      {...props}
      t={t}
      tNav={tNav}
      tc={tc}
      similarListingsSlot={
        <Suspense fallback={<SimilarListingsSkeleton />}>
          <SimilarListings
            currentId={listing.id}
            propertyType={listing.property_type}
            locationId={listing.location?.id ?? null}
          />
        </Suspense>
      }
      recentlyViewedSlot={
        !isStaffPreview ? (
          <Suspense fallback={<RecentlyViewedSkeleton />}>
            <RecentlyViewedSection currentListingId={listing.id} />
          </Suspense>
        ) : null
      }
    />
  )
}
