// ── AppImage internal configuration ──────────────────────────────────────────
//
// This file is an implementation detail of AppImage.tsx.
// Do NOT import from this file outside of:
//   src/components/ui/AppImage.tsx
//   src/components/ui/useAdaptiveImageConfig.ts
//
// To add a new image variant: add an entry to VARIANTS below.
// To add a new grid layout context: see src/lib/imageDelivery.ts.

export type ImageVariant =
  | 'listing'
  | 'listing-thumb'
  | 'gallery-main'
  | 'gallery-side'
  | 'gallery-strip'
  | 'lightbox'
  | 'preview'
  | 'upload'
  | 'avatar'

export interface SrcsetEntry {
  w: number
  h?: number
}

export interface VariantConfig {
  containerClass: string
  /** object-fit class only — no hover effects. */
  imageClass: string
  /** Hover-effect classes applied only on medium/high performance tier. */
  hoverClass?: string
  /** sizes attribute — listing variant uses LISTING_LAYOUT_SIZES['default'] as fallback. */
  sizes: string
  /** Full Cloudinary transform for the main src (fallback for browsers without srcset). */
  cloudinaryTransform: string
  /** Cloudinary transform base for srcset entries — no w/h, no dpr_auto. */
  srcsetBase: string
  /** Width (and optional height) candidates. Covers 1× and 2× DPR range. */
  srcsetEntries: SrcsetEntry[]
  /** Whether to show the LQIP blur background while the main image loads. */
  useLqip: boolean
}

// ── Variant taxonomy ──────────────────────────────────────────────────────────
//
// Self-contained — variant owns its aspect-ratio container; no external sizing
//                  wrapper needed. Zero CLS guaranteed by the internal container.
//   listing       aspect-[4/3]   real estate card image
//   preview       aspect-[16/9]  listing create/edit form preview
//   upload        aspect-[4/3]   upload management grid thumbnail
//   avatar        aspect-square  circular user avatar
//
// Fill-parent — variant fills a caller-sized container; the caller provides
//               a defined height (px-based, grid-track, or flex-stretch).
//   listing-thumb horizontal card / cabinet row (caller sets h-*)
//   gallery-main  main gallery hero (caller is grid cell)
//   gallery-side  gallery side cell (caller is grid cell)
//   gallery-strip lightbox bottom strip (caller is button w-20 h-14)
//   lightbox      lightbox full screen (caller is max-h-[85vh] container)

export const VARIANTS: Record<ImageVariant, VariantConfig> = {
  listing: {
    containerClass: 'relative aspect-[4/3] w-full overflow-hidden bg-muted',
    imageClass: 'object-cover',
    hoverClass: 'group-hover:scale-105',
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
    cloudinaryTransform: 'w_800,h_600,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    srcsetEntries: [
      { w: 400, h: 300 },
      { w: 640, h: 480 },
      { w: 800, h: 600 },
    ],
    useLqip: true,
  },
  preview: {
    containerClass: 'relative aspect-[16/9] w-full overflow-hidden bg-muted',
    imageClass: 'object-cover',
    sizes: '(min-width: 768px) 50vw, 100vw',
    cloudinaryTransform: 'w_800,h_450,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    srcsetEntries: [
      { w: 640, h: 360 },
      { w: 800, h: 450 },
    ],
    useLqip: true,
  },
  upload: {
    containerClass: 'relative aspect-[4/3] w-full overflow-hidden bg-muted',
    imageClass: 'object-cover',
    sizes: '(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw',
    cloudinaryTransform: 'w_400,h_300,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    srcsetEntries: [
      { w: 200, h: 150 },
      { w: 400, h: 300 },
    ],
    useLqip: true,
  },
  avatar: {
    containerClass: 'relative aspect-square overflow-hidden rounded-full bg-muted',
    imageClass: 'object-cover',
    sizes: '96px',
    cloudinaryTransform: 'w_192,h_192,c_fill,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,f_auto,q_auto',
    srcsetEntries: [
      { w: 96, h: 96 },
      { w: 192, h: 192 },
    ],
    useLqip: false,
  },
  'listing-thumb': {
    containerClass: 'relative w-full h-full overflow-hidden',
    imageClass: 'object-cover',
    sizes: '(min-width: 640px) 176px, 128px',
    cloudinaryTransform: 'w_400,h_300,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    srcsetEntries: [
      { w: 256, h: 192 },
      { w: 352, h: 264 },
      { w: 400, h: 300 },
    ],
    useLqip: true,
  },
  'gallery-main': {
    containerClass: 'relative w-full h-full overflow-hidden',
    imageClass: 'object-cover',
    hoverClass: 'group-hover:brightness-95',
    sizes: '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw',
    cloudinaryTransform: 'w_1200,h_675,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    // Heights cap the download size to the gallery container's visible area
    // (mobile h-[340px], desktop h-[500px]) using a 16:9 ratio maximum.
    // Without heights, Cloudinary serves full-ratio tall images even when the
    // container clips them — wasting bandwidth on invisible pixels.
    srcsetEntries: [
      { w: 640,  h: 360 },
      { w: 960,  h: 540 },
      { w: 1200, h: 675 },
      { w: 1600, h: 900 },
    ],
    useLqip: true,
  },
  'gallery-side': {
    containerClass: 'relative w-full h-full overflow-hidden',
    imageClass: 'object-cover',
    hoverClass: 'group-hover:brightness-95',
    sizes: '25vw',
    cloudinaryTransform: 'w_400,h_300,c_fill,g_auto,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,g_auto,f_auto,q_auto',
    srcsetEntries: [
      { w: 320, h: 200 },
      { w: 480, h: 300 },
      { w: 640, h: 400 },
    ],
    useLqip: true,
  },
  'gallery-strip': {
    containerClass: 'relative w-full h-full overflow-hidden',
    imageClass: 'object-cover',
    sizes: '80px',
    cloudinaryTransform: 'w_160,h_112,c_fill,f_auto,q_auto,dpr_auto',
    srcsetBase: 'c_fill,f_auto,q_auto',
    srcsetEntries: [
      { w: 80, h: 56 },
      { w: 160, h: 112 },
    ],
    useLqip: false,
  },
  lightbox: {
    containerClass: 'relative w-full h-full',
    imageClass: 'object-contain',
    sizes: '(max-width: 768px) 100vw, 90vw',
    cloudinaryTransform: 'w_1920,f_auto,q_auto,dpr_auto',
    srcsetBase: 'f_auto,q_auto',
    srcsetEntries: [
      { w: 1200 },
      { w: 1600 },
      { w: 1920 },
    ],
    useLqip: false,
  },
}

// ── Cloudinary URL builders ───────────────────────────────────────────────────
// These functions are the ONLY permitted place to construct Cloudinary URLs.
// Never inline Cloudinary transform strings in component code.

const UPLOAD_MARKER = '/upload/'

export function insertTransform(src: string, transform: string): string {
  if (!transform || !src.includes('res.cloudinary.com')) return src
  const idx = src.indexOf(UPLOAD_MARKER)
  if (idx === -1) return src
  const at = idx + UPLOAD_MARKER.length
  return src.slice(0, at) + transform + '/' + src.slice(at)
}

export function buildSrcset(src: string, base: string, entries: SrcsetEntry[]): string {
  if (!src.includes('res.cloudinary.com')) return ''
  return entries
    .map(({ w, h }) => {
      const dims = h !== undefined ? `w_${w},h_${h}` : `w_${w}`
      return `${insertTransform(src, `${dims},${base}`)} ${w}w`
    })
    .join(', ')
}

// ── LQIP blur placeholder ─────────────────────────────────────────────────────
//
// Cloudinary src  → tiny Cloudinary URL (w_20,q_1) served as container
//                   background-image while the main <img> loads. ~200 bytes,
//                   HTTP/2 multiplexed, CDN-cached. Shows blurred content.
// Other src       → STATIC_BLUR: a 4×3 slate-200 SVG, encoded as data URI.
//                   Zero HTTP requests; consistent neutral placeholder.

export const STATIC_BLUR: string = (() => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect fill="#e2e8f0" width="4" height="3"/></svg>'
  try {
    const b64 =
      typeof globalThis.btoa === 'function'
        ? globalThis.btoa(svg)
        : Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${b64}`
  } catch {
    return ''
  }
})()

export function buildBlurUrl(src: string): string {
  if (!src.includes('res.cloudinary.com')) return STATIC_BLUR
  const idx = src.indexOf(UPLOAD_MARKER)
  if (idx === -1) return STATIC_BLUR
  const at = idx + UPLOAD_MARKER.length
  return src.slice(0, at) + 'w_20,h_20,c_fill,f_auto,q_1' + '/' + src.slice(at)
}
