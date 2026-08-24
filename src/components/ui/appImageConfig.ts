// ── AppImage internal configuration ──────────────────────────────────────────
//
// This file is an implementation detail of AppImage.tsx.
// Do NOT import from this file outside of:
//   src/components/ui/AppImage.tsx
//   src/components/ui/useAdaptiveImageConfig.ts
//
// To add a new image variant: add an entry to VARIANTS below.
// To add a new grid layout context: see src/lib/imageDelivery.ts.
//
// Task 763 (Sprint 63 Phase 1): `containerClass`/`imageClass`/`hoverClass` are CSS Module class
// names from AppImage.module.css, not Tailwind utility strings — see that file's header for the
// I1-extracted source of every declaration.
// Task 763 Revision 1: the CSS Module class names below are role names (`.frame`, `.frameRatio4x3`,
// etc.), not the utility-shaped names (`.relative`, `.aspect4x3`, etc.) the original submission
// used — see AppImage.module.css's header for the full rename mapping. No declaration changed.
// Task 764: `listing`'s `hoverClass` (formerly the one exception, a literal Tailwind
// `'group-hover:scale-105'` string) is REMOVED, not migrated. Its effect is folded into
// `MantineListingCardPattern.module.css`'s `.cardGrid:hover .imageSection img` rule instead —
// see that file's header for the fold rationale and the measured 1.1025 product. `hoverClass`
// stays on `VariantConfig` as an API (`gallery-main`/`gallery-side` still use it via
// `styles.hoverBrightness`); `listing` simply no longer sets it.

import { cn } from '@/lib/utils'
import styles from './AppImage.module.css'

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
    containerClass: cn(styles.frame, styles.frameRatio4x3, styles.frameWidth, styles.frameClip, styles.framePlaceholder),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameRatio16x9, styles.frameWidth, styles.frameClip, styles.framePlaceholder),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameRatio4x3, styles.frameWidth, styles.frameClip, styles.framePlaceholder),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameRatioSquare, styles.frameClip, styles.frameCircle, styles.framePlaceholder),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameFill, styles.frameClip),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameFill, styles.frameClip),
    imageClass: styles.fitCover,
    hoverClass: styles.hoverBrightness,
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
    containerClass: cn(styles.frame, styles.frameFill, styles.frameClip),
    imageClass: styles.fitCover,
    hoverClass: styles.hoverBrightness,
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
    containerClass: cn(styles.frame, styles.frameFill, styles.frameClip),
    imageClass: styles.fitCover,
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
    containerClass: cn(styles.frame, styles.frameFill),
    imageClass: styles.fitContain,
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
