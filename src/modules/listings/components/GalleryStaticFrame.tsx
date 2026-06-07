import { buildGalleryMainPreloadAttrs } from '@/lib/imageDelivery'

interface Props {
  coverUrl: string | null
  title: string
}

/**
 * Server Component — renders the gallery hero as a plain <img> with no JS.
 *
 * Purpose: provide an immediately-paintable LCP candidate in the SSR HTML
 * before the interactive ListingGallery client bundle downloads and hydrates.
 * Chrome can composite this image on the GPU thread while the main thread is
 * busy with React hydration — eliminating the 4.3 s paint-opportunity gap on
 * throttled mobile CPUs.
 *
 * Lifecycle:
 *   1. SSR: this frame is in the initial HTML; #gallery-interactive is hidden.
 *   2. ListingGallery mounts (lazy, ssr: false): adds the full interactive grid.
 *   3. ListingGallery's useEffect removes this frame and reveals the shell.
 *
 * Zero CLS: both the frame and the interactive gallery use the same fixed
 * height classes (h-[340px] sm:h-[420px] md:h-[500px]). The swap is atomic
 * inside a single JS task — no intermediate layout recalculation.
 */
export function GalleryStaticFrame({ coverUrl, title }: Props) {
  const preloadAttrs = buildGalleryMainPreloadAttrs(coverUrl ?? null)

  return (
    <div
      id="gallery-static-frame"
      className="listing-gallery grid grid-cols-4 grid-rows-2 gap-2 h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] rounded-2xl overflow-hidden"
      aria-hidden="true"
    >
      <div className="col-span-4 md:col-span-2 row-span-2 relative bg-muted">
        {preloadAttrs ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preloadAttrs.href}
            srcSet={preloadAttrs.imageSrcSet}
            sizes={preloadAttrs.imageSizes}
            alt={title}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>
      {/* Right-column thumbnail placeholders — desktop only, purely decorative */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="hidden md:block bg-muted" />
      ))}
    </div>
  )
}
