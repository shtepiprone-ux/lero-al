import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { Info } from 'lucide-react'
import { Alert, Anchor, Box, Group, Paper, Skeleton, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import {
  MantineListingDetailPattern,
  type MantineListingDetailData,
  type ListingDetailBadge,
  type ListingFeature,
  type ListingAmenity,
} from '@/design-system/mantine/patterns'
import { ListingsPageFrame } from '@/modules/listings/components/ListingsPageFrame'
import { GalleryStaticFrame } from '@/modules/listings/components/GalleryStaticFrame'
import { GalleryIsland } from '@/modules/listings/components/GalleryIsland'
import { SimilarListings } from '@/modules/listings/components/SimilarListings'
import { MapWrapper } from '@/components/shared/MapWrapper'
import { ListingBackButton } from '@/modules/listings/components/ListingBackButton'
import { ListingStatusBanner } from '@/modules/listings/components/ListingStatusBanner'
import { ViewTracker } from '@/modules/listings/components/ViewTracker'
import { RecentlyViewedTracker } from '@/modules/listings/components/RecentlyViewedTracker'
import { RecentlyViewedSection, RecentlyViewedSkeleton } from '@/modules/listings/components/RecentlyViewedSection'
import { formatPrice } from '@/lib/formatters'
import type { DetailFeature, DetailAttribute } from '@/modules/listings/domain/presentationEngine'
import { isListingVisible } from '@/modules/listings/domain'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'
import { ListingReportDialog } from '@/modules/listings/components/ListingReportDialog'
import type { Listing, ListingImage, ListingStatus, Location, PublicUserProfile } from '@/types/database'

// ── Lazy client island — ListingContact ──────────────────────────────────────
// ssr: true keeps the phone/WhatsApp links in the SSR HTML for SEO and screen
// readers, but splits the JS into a separate lazily-loaded chunk.
const LazyListingContact = dynamic(
  () => import('@/modules/listings/components/ListingContact').then(m => ({ default: m.ListingContact })),
  { ssr: true }
)

// ── Similar listings Suspense fallback ────────────────────────────────────────
// Skeleton wraps real (invisible, `&nbsp;`) content instead of taking explicit height/width
// props — Mantine's own documented sizing mechanism, and the only way to size a placeholder
// here without a raw numeric dimension (`--scope=mantine` design-tokens gate, R9).
export function SimilarListingsSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton radius="md">
        <Title order={2} size="h4">&nbsp;</Title>
      </Skeleton>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {Array.from({ length: 4 }).map((_, i) => (
          <Paper key={i} withBorder radius="lg" style={{ overflow: 'hidden' }}>
            <Skeleton radius={0} style={{ aspectRatio: '4 / 3' }} />
            <Stack gap="xs" p="sm">
              <Skeleton radius="sm">
                <Text size="sm">&nbsp;</Text>
              </Skeleton>
              <Skeleton radius="sm">
                <Text size="md" fw={600}>&nbsp;</Text>
              </Skeleton>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
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
  /** False only when the viewer is signed in AND is the listing owner (self-inquiry guard). Default true. */
  canSendInquiry?: boolean
  /** Prefill values for signed-in viewers' inquiry dialog. */
  inquirerName?: string
  inquirerEmail?: string
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
 *
 * Task 791 — this view composes the canonical `MantineListingDetailPattern` +
 * `ListingsPageFrame`; the gallery and contact card are passed through as slots
 * (`gallerySlot`/`contactSlot`) so the LCP static-frame/island swap and the
 * Server-Component boundary survive untouched (Sprint 71 kickoff §3.3/§3.4).
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
  canSendInquiry = true,
  inquirerName,
  inquirerEmail,
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
  // Preview mode never allows the inquiry trigger (Note 14 — keep inert).
  const effectiveCanSendInquiry = isStaffPreview ? false : canSendInquiry

  const badges: ListingDetailBadge[] = [
    ...(isNew ? [{ label: t('new'), tone: 'new' as const }] : []),
    ...(listing.is_premium ? [{ label: t('premium'), tone: 'premium' as const }] : []),
    ...(isPriceReduced ? [{ label: t('price_reduced'), tone: 'reduced' as const }] : []),
    { label: t(listing.listing_type), tone: 'type' as const },
    { label: t(`property_type_${listing.property_type}`), tone: 'type' as const },
  ]

  const mappedFeatures: ListingFeature[] = features.map(f => ({
    // `theme.other!.iconSize!.compact` (14px) — the same rung the pattern's own story uses for
    // these icons (`BedDouble size={14}` etc., ListingDetailPattern.stories.tsx), referenced
    // through the theme scale instead of a bare literal (--scope=mantine design-tokens gate).
    icon: <ListingFeatureIcon name={f.icon} size={theme.other!.iconSize!.compact} />,
    label: t(f.labelKey),
    value: f.value,
  }))

  const mappedAmenities: ListingAmenity[] = detailAttrs.map(a => ({
    label: t(a.labelKey),
    value: t(a.valueKey),
  }))

  const detailData: MantineListingDetailData = {
    title: listing.title,
    location: listing.location?.name_al,
    price: formattedPrice,
    priceOld: isPriceReduced ? formatPrice(displayPriceOld!, displayCurrencyCode, locale) : undefined,
    originalPriceLabel: originalPriceStr ? t('original_price') : undefined,
    originalPrice: originalPriceStr ?? undefined,
    pricePerSqm: pricePerSqm ? `${formatPrice(pricePerSqm, displayCurrencyCode, locale)} ${t('per_sqm')}` : undefined,
    views: listing.views_count,
    viewsLabel: t('views'),
    date: relativeTimeStr,
    publicId: String(listing.public_id),
    description: listing.description ?? undefined,
  }

  // `galleryLabels` is NOT constructed here — `gallerySlot` is always supplied in this consumer
  // (Task 791 F2 fix), and `MantineListingDetailPattern`'s internal gallery/lightbox never
  // renders. Building this object would still cross the Server→Client boundary as a serialized
  // prop even though unused, and its `counter` member is a function — React rejects that at
  // render time ("Functions cannot be passed directly to Client Components"). `galleryLabels` is
  // optional on the pattern for exactly this reason (kickoff §16.2 F2 reopened by Revision 1).

  // ── Gallery — LCP-optimised RSC + lazy interactive shell, passed as a slot (Task 791 E1) ────
  // Byte-identical DOM ids/order/hidden-state to the pre-migration markup (R4). The preload
  // <link> is included here too so it stays with the rest of the gallery subtree; React 19
  // hoists it to <head> regardless of nesting depth.
  const gallerySlot = (
    <>
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
      <div id="gallery-wrapper-static">
        <GalleryStaticFrame coverUrl={coverImage?.url ?? null} title={listing.title} />
        {/* `theme.other!.iconSize!.roomy` (20px) reused as the exact pre-migration `h-5` height —
            no dedicated "spacer" scale exists, and this is the closest measured theme constant
            at that exact value (--scope=mantine design-tokens gate forbids a bare literal). */}
        {images.length > 1 && (
          <Box id="gallery-btn-placeholder" mt="sm" h={theme.other!.iconSize!.roomy} aria-hidden="true" />
        )}
      </div>
      {/* `hidden` is the literal Tailwind class name `ListingGallery.tsx`'s useEffect toggles via
          `classList.remove('hidden')` (out of scope for Task 791, owned by 794) to reveal this
          shell after hydration. This is the one unavoidable `className` in this file — replacing
          it with a Mantine/CSS-module class would silently break the LCP static-frame/island
          swap (R4), since `ListingGallery.tsx` looks up the class by its literal name. Recorded
          as a TASK SPECIFICATION CONTRADICTION between R1 (zero className) and R4 (preserve the
          swap) in the Task 791 completion report for Opus. */}
      <div id="gallery-interactive-shell" className="hidden">
        <GalleryIsland images={images} title={listing.title} />
      </div>
    </>
  )

  // ── Contact sidebar — passed as a slot (Task 791 E2), rendered exactly as before ────────────
  const contactSlot = (
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
      inquiryListingId={listing.id}
      contactListingId={listing.id}
      canSendInquiry={effectiveCanSendInquiry}
      inquirerName={inquirerName}
      inquirerEmail={inquirerEmail}
    />
  )

  // ── Left-column continuation — passed as a slot (Task 791 E3) ───────────────────────────────
  const contentFooter = (
    <>
      {listing.lat && listing.lng && (
        <Paper withBorder radius="lg" p="lg">
          <Stack gap="md">
            <Title order={2} size="h4">
              {t('location_label')}
            </Title>
            <MapWrapper lat={listing.lat} lng={listing.lng} title={listing.title} />
          </Stack>
        </Paper>
      )}

      {/* Report — authenticated non-owner only (always inert in staff preview) */}
      {effectiveCanReport && (
        <Group justify="flex-end">
          <ListingReportDialog listingId={listing.id} />
        </Group>
      )}

      {/* Recently viewed — suppressed in staff preview */}
      {!isStaffPreview && recentlyViewedSlot}

      {/* Similar listings — Server Component streamed below the fold. */}
      <Box id="similar-listings">{similarListingsSlot}</Box>
    </>
  )

  return (
    <Box
      data-testid="listing-detail-view"
      pb={{
        // Task 791 (owner decision D71-4) — `theme.other.layout.listingContactBarClearance`:
        // clearance reserved for ListingContact's `lg:hidden fixed` mobile bar (base = its tall
        // form, md = its short form). `lg` is not clearance — the bar is hidden there — so it
        // consumes the ordinary `2xl` spacing token instead of a third layout member.
        base: theme.other!.layout!.listingContactBarClearance!.base,
        md: theme.other!.layout!.listingContactBarClearance!.md,
        lg: '2xl',
      }}
    >
      {/* View/recently-viewed tracking is suppressed in staff preview — does not
          inflate view counts or pollute the staff member's recently-viewed list. */}
      {!isStaffPreview && (
        <>
          <ViewTracker slug={listing.slug} />
          <RecentlyViewedTracker listingId={listing.id} />
        </>
      )}

      <ListingsPageFrame
        homeHref={`/${locale}`}
        homeLabel={tNav('home')}
        intermediate={[
          { label: t('all_listings'), href: `/${locale}/listings` },
          ...(listing.location
            ? [{ label: listing.location.name_al, href: `/${locale}/listings?location_id=${listing.location.id}` }]
            : []),
        ]}
        currentLabel={listing.title}
        breadcrumbAriaLabel={tc('aria_breadcrumb')}
      >
        <Stack gap="md">
          <Box>
            <ListingBackButton locale={locale} label={t('back_to_listings')} />
          </Box>

          {/* Staff-only preview banner — always above the content grid */}
          {isStaffPreview && previewBanner && (
            // `theme.other!` — always set by createTheme() (theme.ts); same non-null pattern
            // PopularLocationsView.tsx uses for Server-Component theme reads.
            <Alert
              variant="light"
              color={previewBanner === 'unpublished' ? 'yellow' : 'blueLight'}
              icon={<Info size={theme.other!.iconSize!.standard} />}
            >
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {previewBanner === 'unpublished' ? t('preview_banner_unpublished') : t('preview_banner_published')}
                </Text>
                {previewBanner === 'published' && (
                  <Anchor component={Link} href={`/${locale}/listings/${listing.slug}`} target="_blank" size="sm" fw={500}>
                    {t('preview_open_public')}
                  </Anchor>
                )}
              </Stack>
            </Alert>
          )}

          {!isListingVisible(listing.status as ListingStatus) && (
            <ListingStatusBanner
              status={listing.status as 'sold' | 'rented' | 'archived' | 'expired'}
              message={t(`status_banner_${listing.status}`)}
              similarLabel={t('similar_listings')}
            />
          )}

          <MantineListingDetailPattern
            data={detailData}
            images={images.map(img => ({ url: img.url }))}
            badges={badges}
            features={mappedFeatures}
            descriptionTitle={t('description_label')}
            amenitiesTitle={t('amenities_label')}
            amenities={mappedAmenities}
            gallerySlot={gallerySlot}
            contactSlot={contactSlot}
            contentFooter={contentFooter}
            sidebarFrom="lg"
          />
        </Stack>
      </ListingsPageFrame>
    </Box>
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
