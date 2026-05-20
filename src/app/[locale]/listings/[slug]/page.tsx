import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { MapPin, Eye, CalendarDays, Flag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { GalleryStaticFrame } from '@/modules/listings/components/GalleryStaticFrame'
import { GalleryIsland } from '@/modules/listings/components/GalleryIsland'
import { SimilarListings } from '@/modules/listings/components/SimilarListings'
import { MapWrapper } from '@/components/shared/MapWrapper'
import { Badge } from '@/components/ui/badge'
import { ListingBackButton } from '@/modules/listings/components/ListingBackButton'
import { ListingStatusBanner } from '@/modules/listings/components/ListingStatusBanner'
import { ListingMobileCTA } from '@/modules/listings/components/ListingMobileCTA'
import { ViewTracker } from '@/modules/listings/components/ViewTracker'
import { getArchivedNoindexDays, getSetting } from '@/modules/admin/lib/settings'
import { ListingDescriptionTranslator } from '@/modules/listings/components/ListingDescriptionTranslator'
import { formatPrice } from '@/lib/formatters'
import { getDetailFeatures, getDetailAttributes } from '@/modules/listings/domain/presentationEngine'
import { isListingArchived, isListingVisible } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'
import { getExchangeRates, convertPrice } from '@/lib/getExchangeRate'
import type { PreferredCurrency } from '@/types/database'

// ── Lazy client island — ListingContact ──────────────────────────────────────
//
// ListingContact: ssr: true — keeps the phone/WhatsApp links in the SSR HTML for
// SEO and screen readers, but splits the JS into a separate lazily-loaded chunk
// so the main bundle is smaller and above-fold hydration starts earlier.
//
// ListingGallery lazy loading is handled by GalleryIsland (a 'use client' wrapper)
// because `ssr: false` is not permitted in Server Components (Next.js App Router rule).

const LazyListingContact = dynamic(
  () => import('@/modules/listings/components/ListingContact').then(m => ({ default: m.ListingContact })),
  { ssr: true }
)

// ── Date-fns locale map (mirrors RelativeTime.tsx — server-side only) ─────────
const DATE_LOCALE_MAP: Record<string, Locale> = { sq, en: enUS, uk, it }

// ── Similar listings Suspense fallback ────────────────────────────────────────
function SimilarListingsSkeleton() {
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

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// generateMetadata and ListingPage intentionally use SEPARATE Supabase queries.
//
// React's cache() is documented to work between generateMetadata and the page
// component, but in Next.js App Router the two functions run in different
// rendering phases with separate React roots. In practice the cache does not
// persist across these phases, so wrapping the heavy JOIN query in cache() only
// makes both phases run the heavy query — doubling server latency.
//
// The correct approach is:
//   - generateMetadata → lightweight SELECT (4 columns, no JOINs) → fast
//   - ListingPage      → full SELECT (*, 3 JOINs) in parallel with getUser()
//
// This keeps metadata fast and avoids any cross-phase coupling.

// OG locale map: next-intl locale → Facebook/OG locale code
const OG_LOCALE: Record<string, string> = {
  sq: 'sq_AL', en: 'en_US', uk: 'uk_UA', it: 'it_IT',
}

/** Apply Cloudinary transform for optimal OG image (1200×630, center crop). */
function toOgImageUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,g_auto,q_80,f_jpg/')
}

/** Strip HTML tags and collapse whitespace for safe metadata text. */
function safeText(raw: string | null | undefined, maxLen: number): string {
  if (!raw) return ''
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

  const supabase = await createClient()
  const [{ data }, fallbackOgImage] = await Promise.all([
    supabase
      .from('listings')
      .select(`
        title, description, status, updated_at, price, currency,
        location:locations(name_al),
        images:listing_images(url, is_cover, "order")
      `)
      .eq('slug', slug)
      .single(),
    getSetting('og_image', `${siteUrl}/og-default.png`),
  ])

  if (!data) return {}

  // Only publicly visible statuses get full OG metadata
  const publicStatuses = ['active', 'sold', 'rented', 'archived']
  if (!publicStatuses.includes(data.status)) return { title: 'Lero.al' }

  // robots noindex for old archived listings
  let robots: { index: boolean; follow: boolean } | undefined
  if (isListingArchived(data.status as ListingStatus)) {
    const noindexDays = await getArchivedNoindexDays()
    const daysSince = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 86400000)
    if (daysSince >= noindexDays) robots = { index: false, follow: true }
  }

  // Build description snippet: price · location · text
  const locationName = Array.isArray(data.location) ? data.location[0]?.name_al : (data.location as { name_al: string } | null)?.name_al
  const priceStr = data.price ? `${new Intl.NumberFormat('en').format(Math.round(data.price))} ${data.currency}` : ''
  const descriptionParts = [priceStr, locationName].filter(Boolean)
  const rawDescription = safeText(data.description, 200)
  const descriptionBody = rawDescription
    ? `${descriptionParts.join(' · ')} — ${rawDescription}`.slice(0, 160)
    : descriptionParts.join(' · ')
  const description = descriptionBody || safeText(data.title, 160)

  // Resolve cover image
  const images = Array.isArray(data.images) ? (data.images as { url: string; is_cover: boolean; order: number }[]) : []
  const coverImage = images.find(img => img.is_cover) ?? images.sort((a, b) => a.order - b.order)[0]
  const rawImageUrl = coverImage?.url ?? ''
  const ogImageUrl = rawImageUrl
    ? toOgImageUrl(rawImageUrl)
    : (fallbackOgImage || `${siteUrl}/og-default.png`)

  const canonicalUrl = `${siteUrl}/${locale}/listings/${slug}`
  const ogLocale = OG_LOCALE[locale] ?? 'sq_AL'
  const siteName = 'Lero.al'

  return {
    title: `${data.title} | ${siteName}`,
    description,
    ...(robots && { robots }),
    openGraph: {
      title: data.title,
      description,
      type: 'website' as const,
      url: canonicalUrl,
      siteName,
      locale: ogLocale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: safeText(data.title, 100),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: data.title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations('listing')
  const tNav = await getTranslations('nav')

  // One client instance for the entire page — reused for listing + favorites.
  // getUser() creates its own client internally (separate auth API call).
  // Running both in parallel saves the sequential auth-then-query waterfall.
  const supabase = await createClient()
  const [authUser, { data: listing }, exchangeRates] = await Promise.all([
    getUser(),
    supabase
      .from('listings')
      .select(`*, location:locations(id, name_al, slug, type), images:listing_images(url, is_cover, "order"), owner:users!listings_user_id_fkey(id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at)`)
      .eq('slug', slug)
      .in('status', ['active', 'sold', 'rented', 'archived'])
      .single(),
    getExchangeRates(),
  ])

  if (!listing) notFound()

  // Parallel: favorites check + user's preferred currency (both need authUser)
  let isInitiallyFavorited = false
  let preferredCurrency: PreferredCurrency = 'ALL'
  if (authUser) {
    const [favResult, profileResult] = await Promise.all([
      supabase.from('favorites').select('id').eq('user_id', authUser.id).eq('listing_id', listing.id).maybeSingle(),
      supabase.from('users').select('preferred_currency').eq('id', authUser.id).single(),
    ])
    isInitiallyFavorited = !!favResult.data
    preferredCurrency = (profileResult.data?.preferred_currency as PreferredCurrency) ?? 'ALL'
  }

  const ownerRaw = Array.isArray(listing.owner) ? listing.owner[0] : listing.owner
  const isGuest = !authUser

  // Viewer auth state (isGuest) and owner account status (deleted_at) are independent concerns.
  // For guests, RLS blocks reads on the users table, so ownerRaw is null even for active owners.
  // For authenticated viewers, ownerRaw is null only when the owner row is genuinely gone.
  const owner = ownerRaw ?? {
    id: '' as string,
    name: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    avatar_url: null as string | null,
    user_type: 'private' as string,
    is_verified: false,
    company_name: null as string | null,
    deleted_at: isGuest ? null : ('deleted' as string),
  }
  const images = listing.images ?? []

  // Sort images to find the cover — same logic used by GalleryStaticFrame and
  // ListingGallery. Both must agree on which image is first so the swap is seamless.
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_cover) return -1
    if (b.is_cover) return 1
    return (a.order ?? 0) - (b.order ?? 0)
  })
  const coverImage = sortedImages[0]

  const galleryPreload = buildGalleryMainPreloadAttrs(coverImage?.url)

  const pricePerSqm = listing.area_gross ? Math.round(listing.price / listing.area_gross) : null
  const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'}/${locale}/listings/${slug}`

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const isNew = new Date(listing.created_at) > sevenDaysAgo
  const isPriceReduced = listing.price_old && listing.price < listing.price_old

  const features    = getDetailFeatures(listing)
  const detailAttrs = getDetailAttributes(listing)

  // Currency conversion — use user's preferred_currency when authenticated and exchange rates are available
  const needsConversion = !!exchangeRates && !!authUser && preferredCurrency !== listing.currency
  const displayPrice = needsConversion ? convertPrice(listing.price, listing.currency, preferredCurrency, exchangeRates) : listing.price
  const displayCurrencyCode = needsConversion ? preferredCurrency : listing.currency
  // Original price line shown below converted price on detail page
  const originalPriceStr = needsConversion ? formatPrice(listing.price, listing.currency, locale) : null

  const formattedPrice = formatPrice(displayPrice, displayCurrencyCode, locale)

  // Relative time formatted server-side — removes RelativeTime ('use client') from
  // the above-fold hydration tree. date-fns runs on the server; locale is known
  // from the route params. Static string is passed as JSX, no hydration needed.
  const dfLocale = DATE_LOCALE_MAP[locale] ?? enUS
  const relativeTimeStr = formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: dfLocale })

  return (
    <div className="pb-32 md:pb-20 lg:pb-8">
      {/* ── LCP image preload — native RSC <link>, hoisted to <head> by React 19 / Next.js.
          Emitted per-request for every locale. No worker-level deduplication.
          fetchpriority="high" tells the browser to prioritize this fetch in the resource queue.
          Replaces react-dom preload() which deduplicated across requests in the same worker. */}
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
      <ViewTracker slug={slug} />

      {/* Sticky mobile contact bar — shown only on mobile, above the bottom nav */}
      {!isListingArchived(listing.status as ListingStatus) && owner && (
        <ListingMobileCTA
          price={formattedPrice}
          phone={owner.phone ?? null}
          whatsapp={owner.whatsapp ?? null}
          listingTitle={listing.title}
        />
      )}

      {/* Breadcrumbs */}
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">{tNav('home')}</Link>
            <span>/</span>
            <Link href={`/${locale}/listings`} className="hover:text-foreground transition-colors">{t('all_listings')}</Link>
            {listing.location && (<><span>/</span><Link href={`/${locale}/listings?location_id=${listing.location.id}`} className="hover:text-foreground transition-colors">{listing.location.name_al}</Link></>)}
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
          </nav>
        </div>
      </div>

      <div className="container-wide pt-4 pb-6">
        <div className="mb-5">
          <ListingBackButton locale={locale} label={t('back_to_listings')} />
        </div>

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

            {/* ── Gallery — LCP-optimised RSC + lazy interactive shell ─────────
                Phase 1 (SSR): GalleryStaticFrame renders the cover image as a
                plain <img> with fetchPriority="high". Chrome composites this on
                the GPU thread independently of React hydration — eliminating the
                main-thread hydration-blocked paint gap.

                Phase 2 (client): LazyListingGallery (ssr:false) mounts in the
                hidden shell after the main bundle executes. Its useEffect removes
                the static frame and reveals the interactive grid atomically in a
                single JS task — no intermediate layout recalculation, zero CLS. */}
            {/* Static gallery wrapper — ONE flex item (matches the interactive shell below).
                Wrapping frame + button-placeholder in a single div ensures the flex gap
                (gap-8 from the parent flex-col) is identical before and after the swap:
                  before: [this wrapper] ── gap-8 ── [title section]
                  after:  [shell]        ── gap-8 ── [title section]
                Both wrappers must have the same height for zero CLS.
                  - GalleryStaticFrame: h-[340px] (mobile) exactly matches listing-gallery
                  - gallery-btn-placeholder (mt-3 h-5): matches the "All photos" button in
                    ListingGallery (also mt-3, text-sm ≈ 20px height)
                ListingGallery.useEffect removes this entire wrapper and reveals the shell
                atomically in one JS task — no intermediate layout recalculation, zero CLS. */}
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
                  {isPriceReduced && <span className="text-lg text-muted-foreground line-through">{formatPrice(listing.price_old!, displayCurrencyCode, locale)}</span>}
                  {pricePerSqm && <span className="text-sm text-muted-foreground">{formatPrice(pricePerSqm, displayCurrencyCode, locale)}/{t('per_sqm').split('/')[1] ?? 'm²'}</span>}
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
                {/* Date formatted server-side — RelativeTime ('use client') removed
                    from above-fold hydration tree to reduce initial JS work. */}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{relativeTimeStr}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground/70">ID: #{listing.id.slice(0, 8)}</span>
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

            {/* Description with on-demand translation */}
            {listing.description && (
              <ListingDescriptionTranslator
                description={listing.description}
                label={t('description_label')}
              />
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

            {/* Report */}
            <div className="flex justify-end">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <Flag className="h-3.5 w-3.5" />
                {t('report_listing')}
              </button>
            </div>

            {/* Similar listings — Server Component streamed below the fold.
                Suspense boundary lets React flush the above-fold section (gallery,
                title, price) to the browser immediately, then stream the similar
                listings section in a subsequent flush. The Supabase query for
                similar listings runs inside the Suspense boundary, not at page
                top-level, so it does not delay the above-fold time-to-first-byte. */}
            <div id="similar-listings">
              <Suspense fallback={<SimilarListingsSkeleton />}>
                <SimilarListings
                  currentId={listing.id}
                  propertyType={listing.property_type}
                  locationId={listing.location?.id ?? null}
                />
              </Suspense>
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
            listingId={authUser ? listing.id : undefined}
            isFavorited={isInitiallyFavorited}
            canReport={!!authUser && authUser.id !== owner.id}
          />
        </div>
      </div>
    </div>
  )
}
