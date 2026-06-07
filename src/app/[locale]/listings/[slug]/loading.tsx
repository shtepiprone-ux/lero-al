import { Skeleton } from '@/components/ui/skeleton'

// Suspense shell for the listing detail page.
// Next.js App Router renders this instantly on navigation while the server
// component (page.tsx) resolves the listing from the database. The gallery
// grid dimensions and column layout match ListingGallery and the page grid
// exactly so the layout does not shift when real content arrives.
export default function ListingLoading() {
  return (
    <div className="pb-32 md:pb-20 lg:pb-8">
      {/* Breadcrumb bar */}
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <Skeleton className="h-4 w-52 rounded" />
        </div>
      </div>

      <div className="container-wide pt-4 pb-6">
        {/* Back button */}
        <div className="mb-5">
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-8 min-w-0">

            {/* Gallery — mirrors ListingGallery grid exactly:
                grid-cols-4 grid-rows-2, main image col-span-4 md:col-span-2 row-span-2,
                four side thumbnails hidden on mobile. rounded-none because the parent
                overflow-hidden already clips the 2xl corners. */}
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] rounded-2xl overflow-hidden">
              <Skeleton className="col-span-4 md:col-span-2 row-span-2 rounded-none" />
              <Skeleton className="hidden md:block rounded-none" />
              <Skeleton className="hidden md:block rounded-none" />
              <Skeleton className="hidden md:block rounded-none" />
              <Skeleton className="hidden md:block rounded-none" />
            </div>

            {/* Title + badges + price */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-9 w-44 rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>

            {/* Key features card */}
            <Skeleton className="h-28 rounded-2xl w-full" />

            {/* Description card */}
            <Skeleton className="h-40 rounded-2xl w-full" />

            {/* Additional details card */}
            <Skeleton className="h-32 rounded-2xl w-full" />
          </div>

          {/* ── Right column: contact sidebar — desktop only ── */}
          <div className="hidden lg:block">
            <Skeleton className="h-96 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
