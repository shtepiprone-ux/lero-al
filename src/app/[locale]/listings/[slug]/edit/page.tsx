import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { requireViewer } from '@/lib/auth/requireViewer'
import { ListingFormLoader } from '@/modules/listings/components/ListingFormLoader'
import { ListingAccessRestrictedView } from '@/modules/listings/components/ListingAccessRestrictedView'
import { getListingAccessState } from '@/modules/listings/lib/listingAccessState'
import { checkEditPermission, canAdminEditListing } from '@/modules/listings/domain/listingPermissions'
import type { FormValues } from '@/modules/listings/types/form'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import type { ListingStatus } from '@/types/database'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'listing' })
  return { title: `${t('edit_listing')} | Lero.al`, robots: { index: false, follow: true } }
}

/**
 * The restricted page of a listing the visitor may not open (Task 923 R103 (d), D72): strings and links only, never a listing field. A guest is offered to sign in and comes
 * back to the edit link, a signed-in viewer to browse the listings.
 */
async function restrictedPage(locale: string, slug: string, action: 'sign-in' | 'browse') {
  const [t, tNav, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'listing' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'common' }),
  ])
  return (
    <ListingAccessRestrictedView
      homeHref={`/${locale}`}
      homeLabel={tNav('home')}
      listingsHref={`/${locale}/listings`}
      listingsLabel={t('all_listings')}
      currentLabel={t('access_restricted_crumb')}
      breadcrumbAriaLabel={tc('aria_breadcrumb')}
      title={t('access_restricted_title')}
      description={t('access_restricted_text')}
      actionHref={action === 'sign-in' ? `/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/listings/${slug}/edit`)}` : `/${locale}/listings`}
      actionLabel={action === 'sign-in' ? t('access_restricted_sign_in') : t('access_restricted_browse')}
    />
  )
}

export default async function EditListingPage({ params }: Props) {
  const { locale, slug } = await params

  const user = await getUser()
  if (!user) {
    // A guest on the edit link of a hidden listing gets the restricted page with the sign-in action; any other guest is sent to sign in, as before
    if ((await getListingAccessState(slug)) === 'hidden') return restrictedPage(locale, slug, 'sign-in')
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/listings/${slug}/edit`)}&session=lost`)
  }

  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, slug, status, title, description, price, price_old, currency,
      listing_type, property_type, condition, wall_type, heating,
      rooms, bedrooms, bathrooms, toilets, area_gross, area_net,
      floor, total_floors, multi_storey_building,
      land_legal_status, land_zoning, land_development_potential,
      offer_type, purchase_conditions,
      year_built, location_id, address, lat, lng, user_id,
      images:listing_images(id, url, is_cover, order)
    `)
    .eq('slug', slug)
    .single()

  if (!listing) {
    // The session reads no row: a hidden listing gets the restricted page with the browse action, any other slug is not found
    if ((await getListingAccessState(slug)) === 'hidden') return restrictedPage(locale, slug, 'browse')
    notFound()
  }

  // Always fetch the caller's role: needed both for checkEditPermission (staff
  // override) and to compute canManageStatus (status control visibility) even
  // when the caller is the listing owner.
  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated or deleted account of any role has no staff right, and a failed
  // lookup gives none either (the listing's owner still passes `checkEditPermission` by identity).
  const viewer = await requireViewer()
  const userRole = viewer.ok ? viewer.role : null

  const check = checkEditPermission(user.id, {
    user_id: listing.user_id,
    status: listing.status as ListingStatus,
  }, userRole)

  if (!check.ok) redirect(`/${locale}/listings/${listing.slug}`)

  // Owner-of-listing OR admin/moderator sees the status-correction control
  // (Task 427: privileged any-status access for owner + staff).
  const canPublish = canAdminEditListing(userRole)
  const canManageStatus = listing.user_id === user.id || canPublish

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''
  const uploadFolder = `${listing.user_id}/listings/${listing.id}`

  // Map DB images to component format; use DB row id as stable public_id key
  const images: ListingImage[] = (listing.images ?? [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((img) => ({
      url: img.url,
      public_id: img.id,
      is_cover: img.is_cover,
      order: img.order,
    }))

  const initialValues: Partial<FormValues> = {
    listing_type:               listing.listing_type as FormValues['listing_type'],
    property_type:              listing.property_type as FormValues['property_type'],
    title:                      listing.title,
    description:                listing.description ?? undefined,
    price:                      listing.price,
    price_old:                  listing.price_old ?? undefined,
    currency:                   listing.currency as 'ALL' | 'EUR',
    condition:                  listing.condition ?? undefined,
    wall_type:                  listing.wall_type ?? undefined,
    heating:                    listing.heating ?? undefined,
    rooms:                      listing.rooms ?? undefined,
    bedrooms:                   listing.bedrooms ?? undefined,
    bathrooms:                  listing.bathrooms ?? undefined,
    toilets:                    listing.toilets ?? undefined,
    area_gross:                 listing.area_gross ?? undefined,
    area_net:                   listing.area_net ?? undefined,
    floor:                      listing.floor ?? undefined,
    total_floors:               listing.total_floors ?? undefined,
    multi_storey_building:      listing.multi_storey_building ?? false,
    land_legal_status:          listing.land_legal_status ?? undefined,
    land_zoning:                listing.land_zoning ?? undefined,
    land_development_potential: listing.land_development_potential ?? undefined,
    offer_type:                 listing.offer_type ?? undefined,
    purchase_conditions:        (listing.purchase_conditions as string[] | null) ?? undefined,
    year_built:                 listing.year_built ?? undefined,
    location_id:                listing.location_id ?? undefined,
    address:                    listing.address ?? undefined,
    lat:                        listing.lat ?? undefined,
    lng:                        listing.lng ?? undefined,
    images,
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ListingFormLoader
        locale={locale}
        uploadPreset={uploadPreset}
        uploadFolder={uploadFolder}
        mode="edit"
        listingId={listing.id}
        initialValues={initialValues}
        canManageStatus={canManageStatus}
        canPublish={canPublish}
        currentStatus={listing.status as ListingStatus}
      />
    </div>
  )
}
