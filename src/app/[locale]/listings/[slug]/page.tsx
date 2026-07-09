import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getArchivedNoindexDays, getSetting } from '@/modules/admin/lib/settings'
import { formatPrice, formatCount } from '@/lib/formatters'
import { getDetailFeatures, getDetailAttributes } from '@/modules/listings/domain/presentationEngine'
import { isListingArchived } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'
import { getExchangeRates } from '@/lib/getExchangeRateServer'
import { convertPrice } from '@/lib/getExchangeRate'
import type { PreferredCurrency } from '@/types/database'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'
import type { PublicUserProfile } from '@/types/database'
import { ListingDetailView } from '@/modules/listings/components/ListingDetailView'

// ── Date-fns locale map (mirrors RelativeTime.tsx — server-side only) ─────────
const DATE_LOCALE_MAP: Record<string, Locale> = { sq, en: enUS, uk, it }

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
  const priceStr = data.price ? `${formatCount(data.price, 'en')} ${data.currency}` : ''
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

  // One client instance for the entire page — reused for listing + favorites.
  // getUser() creates its own client internally (separate auth API call).
  // Running both in parallel saves the sequential auth-then-query waterfall.
  const supabase = await createClient()
  const [authUser, { data: listing }, exchangeRates] = await Promise.all([
    getUser(),
    supabase
      .from('listings')
      .select(`*, location:locations(id, name_al, slug, type), images:listing_images(url, is_cover, "order")`)
      .eq('slug', slug)
      .in('status', ['active', 'sold', 'rented', 'archived'])
      .single(),
    getExchangeRates(),
  ])

  if (!listing) notFound()

  // Parallel: owner profile (via view) + favorites + preferred currency — all need authUser.
  // Guests get ownerRaw = null → showGuestCTA branch fires in ListingContact (unchanged).
  // public_user_profiles view is granted to authenticated only; anon returns null.
  let isInitiallyFavorited = false
  let preferredCurrency: PreferredCurrency = 'ALL'
  let hasValidProfile = false
  let ownerRaw: PublicUserProfile | null = null
  let inquirerName: string | undefined
  if (authUser) {
    const [favResult, profileResult, ownerResult] = await Promise.all([
      supabase.from('favorites').select('id').eq('user_id', authUser.id).eq('listing_id', listing.id).maybeSingle(),
      supabase.from('users').select('preferred_currency, name').eq('id', authUser.id).single(),
      supabase
        .from('public_user_profiles')
        .select('id, name, avatar_url, user_type, is_verified, company_name, deleted_at, has_phone, has_whatsapp')
        .eq('id', listing.user_id)
        .maybeSingle(),
    ])
    isInitiallyFavorited = !!favResult.data
    preferredCurrency = (profileResult.data?.preferred_currency as PreferredCurrency) ?? 'ALL'
    hasValidProfile = !!profileResult.data
    ownerRaw = ownerResult.data as PublicUserProfile | null
    inquirerName = profileResult.data?.name ?? undefined
  }
  // A zombie session has a valid JWT (authUser truthy) but no profile row (deleted/orphaned account).
  // Treat zombie sessions as guests so the contact card shows "Sign in" instead of "Account deleted".
  const isGuest = !authUser || !hasValidProfile
  const canReport = !isGuest && !!authUser && authUser.id !== listing.user_id
  // Inquiry trigger hidden only for the listing's own (authenticated, non-zombie) owner.
  const canSendInquiry = !authUser || isGuest || authUser.id !== listing.user_id
  const inquirerEmail = !isGuest ? (authUser?.email ?? undefined) : undefined

  // Viewer auth state (isGuest) and owner account status (deleted_at) are independent concerns.
  // ownerRaw is null for guests (RLS blocks the embed join) or when the owner row is genuinely gone.
  const owner = ownerRaw ?? {
    id: '' as string,
    name: null as string | null,
    has_phone: false,
    has_whatsapp: false,
    avatar_url: null as string | null,
    user_type: 'private' as string,
    is_verified: false,
    company_name: null as string | null,
    deleted_at: null,
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

  const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'}/${locale}/listings/${slug}`

  const isNew = new Date(listing.created_at) > new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  const isPriceReduced = listing.price_old && listing.price < listing.price_old

  const features    = getDetailFeatures(listing)
  const detailAttrs = getDetailAttributes(listing)

  // Currency conversion — use user's preferred_currency when authenticated and exchange rates are available
  const needsConversion = !!exchangeRates && !!authUser && preferredCurrency !== listing.currency
  const displayPrice = needsConversion ? convertPrice(listing.price, listing.currency, preferredCurrency, exchangeRates) : listing.price
  const displayCurrencyCode = needsConversion ? preferredCurrency : listing.currency
  const displayPriceOld = listing.price_old
    ? (needsConversion ? convertPrice(listing.price_old, listing.currency, preferredCurrency, exchangeRates) : listing.price_old)
    : null
  // Original price line shown below converted price on detail page
  const originalPriceStr = needsConversion ? formatPrice(listing.price, listing.currency, locale) : null
  // per-m² derived from the displayed price so value and label always share the same currency
  const pricePerSqm = listing.area_gross ? Math.round(displayPrice / listing.area_gross) : null

  const formattedPrice = formatPrice(displayPrice, displayCurrencyCode, locale)

  // Relative time formatted server-side — removes RelativeTime ('use client') from
  // the above-fold hydration tree. date-fns runs on the server; locale is known
  // from the route params. Static string is passed as JSX, no hydration needed.
  const dfLocale = DATE_LOCALE_MAP[locale] ?? enUS
  const relativeTimeStr = formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: dfLocale })

  return (
    <ListingDetailView
      listing={listing}
      owner={owner}
      sortedImages={sortedImages}
      coverImage={coverImage}
      galleryPreload={galleryPreload}
      isNew={isNew}
      isPriceReduced={!!isPriceReduced}
      features={features}
      detailAttrs={detailAttrs}
      displayPrice={displayPrice}
      displayCurrencyCode={displayCurrencyCode}
      displayPriceOld={displayPriceOld}
      originalPriceStr={originalPriceStr}
      pricePerSqm={pricePerSqm}
      formattedPrice={formattedPrice}
      relativeTimeStr={relativeTimeStr}
      listingUrl={listingUrl}
      locale={locale}
      isGuest={isGuest}
      canReport={canReport}
      isInitiallyFavorited={isInitiallyFavorited}
      listingId={authUser ? listing.id : undefined}
      canSendInquiry={canSendInquiry}
      inquirerName={inquirerName}
      inquirerEmail={inquirerEmail}
      isStaffPreview={false}
      previewBanner={null}
    />
  )
}
