import { Skeleton } from '@mantine/core'

// Suspense shell for the listing detail page.
// Next.js App Router renders this instantly on navigation while the server
// component (page.tsx) resolves the listing from the database. The gallery
// grid dimensions and column layout match ListingGallery and the page grid
// exactly so the layout does not shift when real content arrives.
//
// Task 792 — migrated off `@/components/ui/skeleton` onto Mantine `Skeleton`. Two sizing
// techniques, both avoiding a raw numeric height/width prop or className (`--scope=mantine`
// design-tokens gate; D71-4 — no raw px, ever):
//   - Fixed-size placeholders (text lines, badges, cards) wrap an invisible `<div>` carrying the
//     original Tailwind h-*/w-* class — Mantine's own documented "size from children" mechanism,
//     the same technique this route's own `ListingDetailView.tsx` `SimilarListingsSkeleton` already
//     uses for the identical reason.
//   - The gallery grid cells use Mantine's `h="100%"` style prop (a percentage, not a raw px/rem/em
//     literal) against their own grid-item wrapper `<div>`, which CSS Grid's default
//     `align-items: stretch` gives a definite height — no children needed.
// The grid-position classes (`col-span-*`/`row-span-*`) live on each cell's plain wrapper `<div>`,
// not on the Skeleton itself, since a CSS Grid item must be a direct child of the grid container.
// This route file is not in `scripts/mantine-migration-scope.json`, so its surrounding layout
// classes (container-wide, grid, flex) stay Tailwind — Task 792 R3 migrates the Skeleton primitive
// only, not this Suspense shell's grid/container chrome.
export default function ListingLoading() {
  return (
    <div className="pb-32 md:pb-20 lg:pb-8">
      {/* Breadcrumb bar */}
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <Skeleton radius="sm">
            <div className="h-4 w-52" />
          </Skeleton>
        </div>
      </div>

      <div className="container-wide pt-4 pb-6">
        {/* Back button */}
        <div className="mb-5">
          <Skeleton>
            <div className="h-8 w-36" />
          </Skeleton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-8 min-w-0">

            {/* Gallery — mirrors ListingGallery grid exactly:
                grid-cols-4 grid-rows-2, main image col-span-4 md:col-span-2 row-span-2,
                four side thumbnails hidden on mobile. rounded-none because the parent
                overflow-hidden already clips the 2xl corners. */}
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] rounded-2xl overflow-hidden">
              <div className="col-span-4 md:col-span-2 row-span-2">
                <Skeleton radius={0} h="100%" />
              </div>
              <div className="hidden md:block">
                <Skeleton radius={0} h="100%" />
              </div>
              <div className="hidden md:block">
                <Skeleton radius={0} h="100%" />
              </div>
              <div className="hidden md:block">
                <Skeleton radius={0} h="100%" />
              </div>
              <div className="hidden md:block">
                <Skeleton radius={0} h="100%" />
              </div>
            </div>

            {/* Title + badges + price */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Skeleton radius="pill">
                  <div className="h-5 w-12" />
                </Skeleton>
                <Skeleton radius="pill">
                  <div className="h-5 w-20" />
                </Skeleton>
              </div>
              <Skeleton radius="lg">
                <div className="h-8 w-3/4" />
              </Skeleton>
              <Skeleton radius="lg">
                <div className="h-9 w-44" />
              </Skeleton>
              <div className="flex gap-4">
                <Skeleton radius="sm">
                  <div className="h-4 w-32" />
                </Skeleton>
                <Skeleton radius="sm">
                  <div className="h-4 w-24" />
                </Skeleton>
                <Skeleton radius="sm">
                  <div className="h-4 w-20" />
                </Skeleton>
              </div>
            </div>

            {/* Key features card */}
            <Skeleton radius="2xl">
              <div className="h-28 w-full" />
            </Skeleton>

            {/* Description card */}
            <Skeleton radius="2xl">
              <div className="h-40 w-full" />
            </Skeleton>

            {/* Additional details card */}
            <Skeleton radius="2xl">
              <div className="h-32 w-full" />
            </Skeleton>
          </div>

          {/* ── Right column: contact sidebar — desktop only ── */}
          <div className="hidden lg:block">
            <Skeleton radius="2xl">
              <div className="h-96 w-full" />
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  )
}
