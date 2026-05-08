'use client'

import dynamic from 'next/dynamic'

/**
 * Client Component island for the interactive ListingGallery.
 *
 * `next/dynamic` with `ssr: false` is forbidden in Server Components (Next.js App
 * Router constraint). This thin 'use client' island is the only permitted location
 * for `ssr: false` dynamic imports. The listing page (Server Component) imports this
 * island instead of using dynamic() directly.
 *
 * The LazyListingGallery chunk is NOT included in the SSR HTML. The LCP cover image
 * is served by GalleryStaticFrame (Server Component, above this island in the page).
 * When this island mounts, ListingGallery's useEffect removes the static frame and
 * reveals the interactive grid — single atomic JS task, zero CLS.
 */

const LazyListingGallery = dynamic(
  () => import('./ListingGallery').then(m => ({ default: m.ListingGallery })),
  { ssr: false }
)

interface GalleryImage { url: string; is_cover: boolean; order: number }

interface Props {
  images: GalleryImage[]
  title: string
}

export function GalleryIsland({ images, title }: Props) {
  return <LazyListingGallery images={images} title={title} />
}
