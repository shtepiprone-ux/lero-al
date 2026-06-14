import { notFound, redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { formatPrice } from '@/lib/formatters'
import { getDetailFeatures, getDetailAttributes } from '@/modules/listings/domain/presentationEngine'
import { isListingHidden } from '@/modules/listings/domain'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'
import type { ListingStatus, PublicUserProfile } from '@/types/database'
import { ListingDetailView } from '@/modules/listings/components/ListingDetailView'

// ── Date-fns locale map (mirrors the public listing page) ─────────
const DATE_LOCALE_MAP: Record<string, Locale> = { sq, en: enUS, uk, it }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminListingPreviewPage({ params }: Props) {
  const { id } = await params
  const locale = await getAdminLocale()

  // Defensive in-route staff guard (admin layout already redirects non-staff,
  // this is a belt-and-suspenders check for this specific data-bypassing route).
  const user = await getUser()
  if (!user) redirect(`/${locale}/auth/login?next=${encodeURIComponent('/admin')}&session=lost`)

  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAuthorized = profile?.role === 'admin' || profile?.role === 'moderator'
  if (!isAuthorized) redirect(`/${locale}`)

  const db = createAdminClient()
  const { data: listing } = await db
    .from('listings')
    .select(`*, location:locations(id, name_al, slug, type), images:listing_images(url, is_cover, "order")`)
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: ownerRaw } = await db
    .from('public_user_profiles')
    .select('id, name, avatar_url, user_type, is_verified, company_name, deleted_at, has_phone, has_whatsapp')
    .eq('id', listing.user_id)
    .maybeSingle()

  const owner: PublicUserProfile = ownerRaw ?? {
    id: '',
    name: null,
    has_phone: false,
    has_whatsapp: false,
    avatar_url: null,
    user_type: 'private',
    is_verified: false,
    company_name: null,
    deleted_at: null,
  }

  const images = listing.images ?? []
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_cover) return -1
    if (b.is_cover) return 1
    return (a.order ?? 0) - (b.order ?? 0)
  })
  const coverImage = sortedImages[0]
  const galleryPreload = buildGalleryMainPreloadAttrs(coverImage?.url)

  const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'}/${locale}/listings/${listing.slug}`

  const isNew = new Date(listing.created_at) > new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  const isPriceReduced = !!(listing.price_old && listing.price < listing.price_old)

  const features = getDetailFeatures(listing)
  const detailAttrs = getDetailAttributes(listing)

  // No currency conversion in staff preview — show the listing's own currency as-is.
  const displayPrice = listing.price
  const displayCurrencyCode = listing.currency
  const displayPriceOld = listing.price_old ?? null
  const originalPriceStr = null
  const pricePerSqm = listing.area_gross ? Math.round(displayPrice / listing.area_gross) : null
  const formattedPrice = formatPrice(displayPrice, displayCurrencyCode, locale)

  const dfLocale = DATE_LOCALE_MAP[locale] ?? enUS
  const relativeTimeStr = formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: dfLocale })

  const previewBanner = isListingHidden(listing.status as ListingStatus) ? 'unpublished' : 'published'

  return (
    <ListingDetailView
      listing={{ ...listing, location: listing.location ?? null }}
      owner={owner}
      sortedImages={sortedImages}
      coverImage={coverImage}
      galleryPreload={galleryPreload}
      isNew={isNew}
      isPriceReduced={isPriceReduced}
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
      isGuest={true}
      canReport={false}
      isInitiallyFavorited={false}
      listingId={undefined}
      isStaffPreview={true}
      previewBanner={previewBanner}
    />
  )
}
