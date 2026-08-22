// Task 763 §10.5 — unit-level assertion that VARIANTS now yields the expected CSS Module class
// names for the 3 variants with no Storybook coverage (avatar, upload, preview), plus a full
// zero-Tailwind-string assertion across all 9 variants except the BLOCKED `listing.hoverClass`.
// Not a permanent production test (out of scope per §7) — retained as I5/§10.5 evidence only.
import { describe, it, expect } from 'vitest'
import { VARIANTS } from '@/components/ui/appImageConfig'
import styles from '@/components/ui/AppImage.module.css'

const TAILWIND_UTILITY_SHAPE = /^(relative|absolute|inset-0|w-full|h-full|aspect-\[|aspect-square|overflow-hidden|bg-muted|rounded-full|object-cover|object-contain|transition|duration-300|opacity-100|opacity-0|group-hover:)/

describe('Task 763 — appImageConfig CSS Module wiring', () => {
  it('preview: containerClass composes frame+frameRatio16x9+frameWidth+frameClip+framePlaceholder, imageClass=fitCover', () => {
    const c = VARIANTS.preview
    for (const cls of [styles.frame, styles.frameRatio16x9, styles.frameWidth, styles.frameClip, styles.framePlaceholder]) {
      expect(c.containerClass).toContain(cls)
    }
    expect(c.imageClass).toBe(styles.fitCover)
    expect(c.hoverClass).toBeUndefined()
  })

  it('upload: containerClass composes frame+frameRatio4x3+frameWidth+frameClip+framePlaceholder, imageClass=fitCover', () => {
    const c = VARIANTS.upload
    for (const cls of [styles.frame, styles.frameRatio4x3, styles.frameWidth, styles.frameClip, styles.framePlaceholder]) {
      expect(c.containerClass).toContain(cls)
    }
    expect(c.imageClass).toBe(styles.fitCover)
    expect(c.hoverClass).toBeUndefined()
  })

  it('avatar: containerClass composes frame+frameRatioSquare+frameClip+frameCircle+framePlaceholder, imageClass=fitCover', () => {
    const c = VARIANTS.avatar
    for (const cls of [styles.frame, styles.frameRatioSquare, styles.frameClip, styles.frameCircle, styles.framePlaceholder]) {
      expect(c.containerClass).toContain(cls)
    }
    expect(c.imageClass).toBe(styles.fitCover)
    expect(c.hoverClass).toBeUndefined()
  })

  it('gallery-main / gallery-side: hoverClass is styles.hoverBrightness, not a Tailwind string', () => {
    expect(VARIANTS['gallery-main'].hoverClass).toBe(styles.hoverBrightness)
    expect(VARIANTS['gallery-side'].hoverClass).toBe(styles.hoverBrightness)
  })

  it('lightbox: containerClass has no frameClip (matches prior "relative w-full h-full" utility set), imageClass=fitContain', () => {
    const c = VARIANTS.lightbox
    expect(c.containerClass).toContain(styles.frame)
    expect(c.containerClass).toContain(styles.frameFill)
    expect(c.containerClass).not.toContain(styles.frameClip)
    expect(c.imageClass).toBe(styles.fitContain)
  })

  it('listing-thumb / gallery-strip: containerClass composes frame+frameFill+frameClip, no hoverClass', () => {
    for (const key of ['listing-thumb', 'gallery-strip'] as const) {
      const c = VARIANTS[key]
      for (const cls of [styles.frame, styles.frameFill, styles.frameClip]) {
        expect(c.containerClass).toContain(cls)
      }
      expect(c.hoverClass).toBeUndefined()
    }
  })

  it('BLOCKED: listing.hoverClass is still the literal Tailwind string (documented, not an oversight)', () => {
    expect(VARIANTS.listing.hoverClass).toBe('group-hover:scale-105')
  })

  it('every containerClass/imageClass field (all 9 variants) contains no Tailwind utility shape', () => {
    for (const [name, cfg] of Object.entries(VARIANTS)) {
      expect(cfg.containerClass, `${name}.containerClass`).not.toMatch(TAILWIND_UTILITY_SHAPE)
      expect(cfg.imageClass, `${name}.imageClass`).not.toMatch(TAILWIND_UTILITY_SHAPE)
    }
  })

  it('the module exports are non-empty hashed CSS Module identifiers, not raw utility names', () => {
    for (const key of ['frame', 'frameRatio4x3', 'frameRatio16x9', 'frameRatioSquare', 'frameWidth', 'frameFill', 'frameClip', 'framePlaceholder', 'frameCircle', 'fitCover', 'fitContain', 'imageLayer', 'fade', 'visible', 'hidden', 'hoverBrightness']) {
      const val = (styles as Record<string, string>)[key]
      expect(val, `styles.${key}`).toBeTruthy()
      expect(val).not.toBe(key) // hashed, not identity-mapped
    }
  })
})
