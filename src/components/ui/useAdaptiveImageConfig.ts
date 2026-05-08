'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { LISTING_LAYOUT_SIZES, type ListingLayoutContext } from '@/lib/imageDelivery'
import { usePerformanceTier } from '@/lib/performance/store'
import { updateImageSystemState } from '@/lib/performance/imageGuard'
import {
  type ImageVariant,
  type SrcsetEntry,
  VARIANTS,
  insertTransform,
  buildSrcset,
  buildBlurUrl,
} from './appImageConfig'

// ── Priority image counter ────────────────────────────────────────────────────
// Tracks how many priority images are currently mounted. Used by PerfDevOverlay
// to verify the priority budget is not exceeded. Dev debugging only.

let priorityCount = 0
const priorityCountListeners = new Set<() => void>()

function notifyPriorityCount(): void {
  for (const cb of priorityCountListeners) cb()
}

export function subscribePriorityCount(cb: () => void): () => void {
  priorityCountListeners.add(cb)
  return () => priorityCountListeners.delete(cb)
}

export function getPriorityCount(): number {
  return priorityCount
}

// Stable named function — never inline. See imageGuard.ts:getGuardServerSnapshot for rationale.
function getPriorityServerSnapshot(): number { return 0 }

export function usePriorityImageCount(): number {
  return useSyncExternalStore(subscribePriorityCount, getPriorityCount, getPriorityServerSnapshot)
}

// ── Layout context normalization ──────────────────────────────────────────────
// Omitting layoutContext on variant="listing" is valid and safe. It means the
// default 3-column responsive grid. Only pass an explicit context when the card
// renders in a different known layout (sidebar, 4-col, 3-col-xl).
const DEFAULT_LISTING_LAYOUT_CONTEXT: ListingLayoutContext = 'default'

// ── Adaptation hook ───────────────────────────────────────────────────────────

export interface AdaptiveImageConfig {
  containerClass: string
  imageClass: string
  optimizedSrc: string
  srcset: string
  effectiveSizes: string
  blurUrl: string | undefined
  isLow: boolean
  fetchPriorityAttr: 'high' | 'auto'
  shouldPreload: boolean
  hoverClass: string | undefined
}

const NEVER_PRIORITY_VARIANTS: readonly ImageVariant[] = [
  'gallery-strip',
  'avatar',
  'upload',
]

export function useAdaptiveImageConfig(
  src: string | null | undefined,
  variant: ImageVariant,
  priority: boolean,
  layoutContext: ListingLayoutContext | undefined,
): AdaptiveImageConfig {
  const tier = usePerformanceTier()
  const isLow = tier === 'low'
  const hasImage = Boolean(src)

  const config = VARIANTS[variant]
  const optimizedSrc = hasImage ? insertTransform(src!, config.cloudinaryTransform) : ''
  const blurUrl = hasImage && config.useLqip ? buildBlurUrl(src!) : undefined

  const effectiveLayoutContext: ListingLayoutContext =
    layoutContext ?? DEFAULT_LISTING_LAYOUT_CONTEXT

  const effectiveSizes =
    variant === 'listing'
      ? LISTING_LAYOUT_SIZES[effectiveLayoutContext]
      : config.sizes

  // LOW: drop the widest srcset candidate to cap peak bandwidth on weak connections
  const effectiveEntries: SrcsetEntry[] =
    isLow && config.srcsetEntries.length > 1
      ? config.srcsetEntries.slice(0, -1)
      : config.srcsetEntries

  const srcset = hasImage ? buildSrcset(src!, config.srcsetBase, effectiveEntries) : ''

  // Preload: HIGH only (proactive <link rel="preload">)
  // MEDIUM: fetchPriority="high" is sufficient without speculative preload
  // LOW: natural priority — reduces contention on weak devices
  const shouldPreload = priority && hasImage && Boolean(srcset) && tier === 'high'
  const fetchPriorityAttr: 'high' | 'auto' = priority && !isLow ? 'high' : 'auto'

  // Dev-only: warn for genuinely wrong variant/priority combinations only.
  // Missing layoutContext is NOT an error — it defaults to 'default' grid context.
  if (process.env.NODE_ENV === 'development') {
    if (priority && NEVER_PRIORITY_VARIANTS.includes(variant)) {
      console.warn(
        `[AppImage] priority=true on variant="${variant}" is likely wrong. ` +
        `This variant renders as a thumbnail or avatar and cannot be LCP. ` +
        `Remove priority to enable lazy loading.`,
      )
    }
  }

  // Track mounted priority images for the dev overlay and image guard pressure
  useEffect(() => {
    if (!priority || !hasImage) return
    priorityCount++
    notifyPriorityCount()
    updateImageSystemState({ priorityCount })
    return () => {
      priorityCount--
      notifyPriorityCount()
      updateImageSystemState({ priorityCount })
    }
  }, [priority, hasImage])

  return {
    containerClass: config.containerClass,
    imageClass: config.imageClass,
    optimizedSrc,
    srcset,
    effectiveSizes,
    blurUrl,
    isLow,
    fetchPriorityAttr,
    shouldPreload,
    hoverClass: isLow ? undefined : config.hoverClass,
  }
}
