'use client'

// next/image is NOT used here. All images are delivered via Cloudinary CDN
// with native <img> + manual srcset. Do not re-introduce next/image anywhere.
// To change delivery logic: see appImageConfig.ts and useAdaptiveImageConfig.ts.
// To change predictive preload behavior: see src/lib/performance/predictive.ts.

import { useState, useEffect, useRef } from 'react'
import { preload } from 'react-dom'
import { cn } from '@/lib/utils'
import styles from './AppImage.module.css'
import type { ListingLayoutContext } from '@/lib/imageDelivery'
import { useAdaptiveImageConfig } from './useAdaptiveImageConfig'
import { usePredictivePreload } from '@/lib/performance/predictive'
import { notifyPriorityPreload } from '@/lib/performance/imageGuard'

export type { ImageVariant } from './appImageConfig'

interface AppImageProps {
  /** Cloudinary or any HTTPS image URL. Falsy → renders container with children only. */
  src?: string | null
  alt: string
  variant: import('./appImageConfig').ImageVariant
  /** Mark as LCP-candidate image. Caller decides; no variant sets this automatically. */
  priority?: boolean
  /** Non-layout classes for the wrapper container (cursor, group, rounding, etc.). */
  className?: string
  /** Overlay content (badges, buttons, chips) rendered inside the positioned container. */
  children?: React.ReactNode
  /**
   * Grid context for the `listing` variant only.
   * Controls the `sizes` attribute to match the card's real grid column width.
   * Ignored for all other variants.
   * Omitting is safe — defaults to 'default' 3-col responsive grid.
   * Pass an explicit context when the card renders in a different layout:
   *   'sidebar' | '4-col' | '3-col-xl'
   * To add a new grid context: extend ListingLayoutContext in imageDelivery.ts.
   */
  layoutContext?: ListingLayoutContext
  /**
   * Enable behavior-driven predictive preloading for this image.
   * When true, AppImage attaches hover and viewport-proximity signals to trigger
   * an early preload fetch before the user navigates to the image.
   *
   * Rules (enforced internally — no action needed from caller):
   *   - Never overrides or competes with priority preloads
   *   - Disabled automatically on LOW performance tier
   *   - Budget-capped at MAX_PREDICTIVE_PRELOADS=2 per page
   *   - MEDIUM: hover signal only; HIGH: hover + viewport + scroll prediction
   */
  predictive?: boolean
}

export function AppImage({
  src,
  alt,
  variant,
  priority = false,
  className,
  children,
  layoutContext,
  predictive = false,
}: AppImageProps) {
  const {
    containerClass,
    imageClass,
    optimizedSrc,
    srcset,
    effectiveSizes,
    blurUrl,
    fetchPriorityAttr,
    shouldPreload,
    hoverClass,
  } = useAdaptiveImageConfig(src, variant, priority, layoutContext)

  const hasImage = Boolean(src)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Show immediately if the image was already cached before JS ran
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  // React 19 render-phase resource preload — explicitly safe to call during render.
  // Registers a <link rel="preload"> hint; React deduplicates automatically.
  if (shouldPreload) {
    preload(optimizedSrc, {
      as: 'image',
      imageSrcSet: srcset,
      imageSizes: effectiveSizes,
    })
  }

  // Register the preloaded URL with imageGuard AFTER commit — never during render.
  // notifyPriorityPreload() calls commit() → statsListeners synchronously, which
  // would update PerfOverlayContent while AppImage is still rendering:
  //   "Cannot update a component while rendering a different component"
  // useEffect ensures guard notifications fire post-commit only.
  //
  // Ordering safety: this effect is registered at position 3 in AppImage's hook
  // call order; usePredictivePreload's observer setup is position 4. React fires
  // effects in registration order, so the URL is in preloadedUrls before any
  // IntersectionObserver is even created — zero race window.
  //
  // StrictMode: the idempotency guard in notifyPriorityPreload (preloadedUrls.has)
  // ensures the second StrictMode invocation skips the rate counter but still
  // recomputes pressure — no double-counting.
  useEffect(() => {
    if (!shouldPreload || !optimizedSrc) return
    notifyPriorityPreload(optimizedSrc)
    // No cleanup: URL registrations are page-scoped (cleared on navigation via resetGuard).
  }, [shouldPreload, optimizedSrc])

  // Behavior-driven predictive preload (hover + viewport proximity + scroll prediction)
  // Inactive on LOW tier and when predictive=false. Budget-enforced globally.
  usePredictivePreload(containerRef, optimizedSrc, srcset, effectiveSizes, variant, predictive)

  return (
    <div
      ref={containerRef}
      className={cn(containerClass, className)}
      style={
        blurUrl && !loaded
          ? { backgroundImage: `url(${blurUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {hasImage && (
        // AppImage is the canonical <img> render site; next/image is project-wide banned
        // (eslint.config.mjs IMAGE_RENDER_EXCEPTIONS). This disable is intentional and approved.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcset || undefined}
          sizes={srcset ? effectiveSizes : undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={fetchPriorityAttr}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            styles.imageLayer,
            // Priority images (LCP candidates) start opaque so Chrome can measure
            // them for LCP immediately from DOM render without waiting for JS state.
            // Non-priority images fade in from LQIP blur once loaded.
            !priority && styles.fade,
            loaded || priority ? styles.visible : styles.hidden,
            imageClass,
            hoverClass,
          )}
        />
      )}
      {children}
    </div>
  )
}
