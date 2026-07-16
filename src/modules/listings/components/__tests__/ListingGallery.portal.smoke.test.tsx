/**
 * ListingGallery lightbox — Mantine `Modal` root-cause stacking regression guard (Task 612).
 *
 * Owner-reported bug: on the real listing-detail page the lightbox rendered INLINE in the
 * component tree with a `fixed inset-0 z-toast` div. Two roots were found and closed by this
 * task:
 *   1. Not portaled — the overlay was trapped in the listing-detail ancestor stacking context.
 *   2. `z-toast` is DEAD CSS — `globals.css`'s `--z-*` scale sits under a Tailwind v4 namespace
 *      that never compiles into `z-*` utilities (confirmed empirically: every
 *      `getComputedStyle(...).zIndex` for a `z-toast` element reads `"auto"`, and a full scan of
 *      every compiled stylesheet found zero `.z-toast`/`.z-sticky`/`.z-overlay` rules) — so even a
 *      portal alone would still lose to the header's real, working `z-30`.
 *
 * The fix migrates the lightbox to a Mantine `fullScreen Modal` (`LightboxView`), whose managed
 * z-index (`--mb-z-index`, default 200) is a REAL, working CSS value — genuinely greater than the
 * header's `z-30` — AND which Mantine portals to `document.body` for free. This test proves both:
 * the dialog is a `document.body` descendant, NOT trapped inside an ancestor stacking context, AND
 * its resolved z-index is a real number that beats a `z-30` sibling.
 *
 * NOTE: deliberately NOT `MantineProvider env="test"` — Mantine's `OptionalPortal` treats
 * `env==="test"` as an explicit signal to skip portaling entirely (renders children inline for
 * synchronous test convenience), which would defeat the exact thing this test proves. Real `env`
 * portals AND runs Mantine's rAF+setTimeout mount transition — every dialog-dependent assertion
 * below is therefore async (`findByRole`/`waitFor`) so it settles after that transition.
 *
 * Planted-violation proof (manual, recorded in the Task 612 session log): temporarily reverting
 * `LightboxView`'s `Modal.Root`/`Modal.Content` back to a plain inline `div` (no portal, no managed
 * z-index) makes the "not trapped" / "real z-index beats header" assertions genuinely FAIL, then
 * reverting restores PASS.
 */

import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ListingGallery } from '../ListingGallery'

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

beforeAll(() => {
  // AppImage's predictive-preload hook constructs a real IntersectionObserver on mount —
  // jsdom does not implement it (same stub convention as ListingCard.smoke.test.tsx).
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub

  // jsdom has no matchMedia — MantineProvider's color-scheme detection needs it.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

const IMAGES = [
  { url: 'https://example.com/photo-1.jpg', is_cover: true, order: 0 },
  { url: 'https://example.com/photo-2.jpg', is_cover: false, order: 1 },
]

function renderGallery() {
  const messages = loadMessages('en')
  // Stand-in "page chrome" ancestor: position:relative + z-index establishes a NEW stacking
  // context around the gallery, the same structural trap the real header/sticky contact card
  // create around ListingGallery on the actual listing-detail page. The fake header carries a
  // REAL working z-index (30, a native inline value) — matching production, where the header's
  // z-30 is a real CSS rule (unlike the site's dead z-toast token).
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <div data-testid="fake-sticky-header" style={{ position: 'sticky', zIndex: 30 }}>
          site chrome
        </div>
        <div data-testid="gallery-ancestor" style={{ position: 'relative', zIndex: 1 }}>
          <ListingGallery images={IMAGES} title="Test listing" />
        </div>
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

async function openLightbox() {
  fireEvent.click(screen.getAllByRole('button', { name: /all photos/i })[0])
  return screen.findByRole('dialog', { name: 'Close gallery' })
}

/**
 * Mantine's Modal root Box carries the managed `--mb-z-index` CSS custom property inline
 * (`ModalBase.mjs`: `__vars: { '--mb-z-index': (zIndex || getDefaultZIndex('modal')).toString() }`)
 * — the class-based `z-index: var(--mb-z-index)` rule itself lives in a CSS Modules stylesheet
 * that jsdom's unit-test environment does not load, so `getComputedStyle(...).zIndex` cannot
 * resolve the cascade here (that full-browser proof is the live-page Playwright rendered
 * evidence, AC2). Reading the inline custom property directly proves the DECLARED value Mantine
 * wires up — a real, working number (200 by default), never the "auto" the dead z-toast token
 * produced.
 */
function declaredModalZIndex(dialog: Element): number {
  // Start from the PARENT — the dialog element itself also carries `data-full-screen`, so
  // `closest()` from the dialog would just match itself, not the ancestor root Box.
  let node: Element | null = dialog.parentElement
  while (node) {
    const raw = (node as HTMLElement).style?.getPropertyValue('--mb-z-index')?.trim()
    if (raw) return Number(raw)
    node = node.parentElement
  }
  return NaN
}

describe('ListingGallery lightbox — Mantine Modal root-cause fix (Task 612)', () => {
  it('lightbox dialog is portaled OUTSIDE the gallery ancestor stacking context, with a real (non-auto) resolved z-index greater than the header', async () => {
    renderGallery()
    const dialog = await openLightbox()

    const galleryAncestor = screen.getByTestId('gallery-ancestor')
    expect(galleryAncestor.contains(dialog)).toBe(false)
    // document.body is the portal target (Mantine's default createPortalNode appends to body).
    expect(document.body.contains(dialog)).toBe(true)

    const declaredZIndex = declaredModalZIndex(dialog)
    expect(Number.isNaN(declaredZIndex)).toBe(false)
    expect(declaredZIndex).toBeGreaterThan(30) // header's real, working z-30
  })

  it('closes on the close button and unmounts cleanly', async () => {
    renderGallery()
    const dialog = await openLightbox()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close gallery' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
  })

  it('Arrow-key Next/Previous cycle the counter while the dialog stays open; arrows do nothing once closed', async () => {
    renderGallery()
    const dialog = await openLightbox()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument())

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close gallery' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.queryByText('2 / 2')).not.toBeInTheDocument()
  })

  it('Prev/Next buttons cycle the counter', async () => {
    renderGallery()
    const dialog = await openLightbox()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole('button', { name: 'Previous' }))
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
  })
})
