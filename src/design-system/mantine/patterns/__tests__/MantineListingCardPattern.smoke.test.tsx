/**
 * MantineListingCardPattern — `layout: 'grid' | 'list'` regression guard (Task 606).
 *
 * `layout='list'` is a structural port of the legacy `ListingCard.tsx` `variant==='horizontal'`
 * branch: image-left, info-right. This suite asserts:
 *   1. `layout='grid'` (default, unchanged since Task 605) still renders the vertical structure —
 *      image/badges/favorite/photoCount/features/price/footer all present.
 *   2. `layout='list'` renders the image container as the FIRST child and the info column as the
 *      SECOND child of the card root (the "image-left" structural marker — this is a DOM-order
 *      assertion; the actual CSS flex-direction is proven separately via the Storybook Playwright
 *      rendered-evidence script, since jsdom does not execute real CSS cascade-layer resolution).
 *   3. `layout='list'` still renders favorite/photoCount(N/A by design)/features/price/footer.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineListingCardPattern, type MantineListingCardOverlay, type MantineListingCardPatternProps } from '../MantineListingCardPattern'

beforeAll(() => {
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

function baseProps(layout?: 'grid' | 'list') {
  return {
    layout,
    data: { id: 'listing-1', title: 'Modern Apartment', location: 'Tirana, Albania', price: '80,000 EUR' },
    // eslint-disable-next-line @next/next/no-img-element -- test-only mock, not a Next.js page
    image: <img src="https://example.com/photo.jpg" alt="Modern Apartment" />,
    favorite: <button aria-pressed="false" aria-label="Add to favorites">heart</button>,
    typeLabel: 'For sale · Apartment',
    badges: [{ label: 'New', color: 'green' }],
    overlay: undefined as MantineListingCardOverlay | undefined,
    photoCount: 5,
    features: [{ icon: <span data-testid="feature-icon" />, value: '3 rooms' }],
    footerActions: <span>#1234</span>,
  }
}

function renderPattern(props: ReturnType<typeof baseProps>) {
  return render(
    <MantineProvider theme={theme}>
      <MantineListingCardPattern {...props} />
    </MantineProvider>,
  )
}

describe('MantineListingCardPattern — layout="grid" (default, Task 605 unchanged)', () => {
  it('renders the vertical card content set', () => {
    renderPattern(baseProps())

    expect(screen.getByText('Modern Apartment')).toBeInTheDocument()
    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // photoCount
    expect(screen.getByText('3 rooms')).toBeInTheDocument()
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
    expect(screen.getByText('#1234')).toBeInTheDocument()
  })
})

describe('MantineListingCardPattern — layout="list" (Task 606, ported legacy horizontal design)', () => {
  it('renders image container as the first child, info column as the second (image-left structural marker)', () => {
    const { container } = renderPattern(baseProps('list'))

    const cardRoot = container.querySelector('.mantine-Card-root')
    expect(cardRoot).toBeInTheDocument()
    // Task 741 R64: the photo column's responsive width (`theme.other.layout.listingCardListThumb`) makes Mantine add an
    // inline <style> element inside the card root; it is not content, so the structural marker ignores it.
    const content = Array.from(cardRoot!.children).filter(el => el.tagName !== 'STYLE')
    expect(content.length).toBe(2)

    const [imageEl, infoEl] = content
    expect(imageEl.querySelector('img')).toBeInTheDocument()
    expect(infoEl.textContent).toContain('Modern Apartment')
  })

  it('still renders favorite/photoCount/features/price/footer in list mode', () => {
    renderPattern(baseProps('list'))

    expect(screen.getByText('Modern Apartment')).toBeInTheDocument()
    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('3 rooms')).toBeInTheDocument()
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
    expect(screen.getByText('#1234')).toBeInTheDocument()
    // photoCount (Task 656 — bottom-left in list mode, distinct from grid's bottom-right)
    // IS rendered when > 0. Pre-existing test bug fixed under Task 658: this assertion
    // predated Task 656 and was never updated, so it asserted the opposite of shipped,
    // intentional behavior (photoCount=5 is passed in baseProps() and genuinely renders).
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders the overlay in list mode too (Task 741 R63: the overlay is part of the shared photo chrome)', () => {
    renderPattern({ ...baseProps('list'), overlay: { label: 'SOLD', className: 'consumer-overlay-hook' } })
    expect(screen.getByText('SOLD')).toBeInTheDocument()
  })
})

describe('MantineListingCardPattern — closed-listing overlay on theme tokens (Task 741 Revision 3, R31/R32)', () => {
  it('draws the sold label border from theme.other.borderWidth.statusOverlay + the tone colour (inline `bd`)', () => {
    renderPattern({ ...baseProps(), overlay: { label: 'SOLD', tone: 'sold' } })
    expect(screen.getByText('SOLD').getAttribute('style')).toContain('0.125rem solid var(--status-info)')
  })

  it('draws no tone colour on the border when `tone` is omitted (jsdom drops the currentColor keyword; the browser computes it)', () => {
    renderPattern({ ...baseProps(), overlay: { label: 'SOLD' } })
    const style = screen.getByText('SOLD').getAttribute('style')
    expect(style).toContain('border: 0.125rem solid')
    expect(style).not.toContain('--status-')
  })

  it('renders the scrim as a Mantine Overlay with z-index auto (does not rise above badges/favourite)', () => {
    renderPattern({ ...baseProps(), overlay: { label: 'SOLD', tone: 'sold' } })
    const scrim = screen.getByText('SOLD').parentElement!
    expect(scrim).toHaveClass('mantine-Overlay-root')
    expect(scrim.getAttribute('style')).toContain('--overlay-z-index: auto')
  })
})

describe('MantineListingCardPattern — overlay.className pass-through contract (Task 741)', () => {
  it('forwards an arbitrary consumer-supplied class to the rendered overlay element in layout="grid"', () => {
    renderPattern({ ...baseProps(), overlay: { label: 'SOLD', className: 'consumer-overlay-hook' } })
    const overlayEl = screen.getByText('SOLD')
    expect(overlayEl).toHaveClass('consumer-overlay-hook')
  })
})

// Task 741 Revision 3h (R62/R66a, owner D46-9 / GR-10) — one card for grid and list. Every part is built once per
// render and placed by both layouts, so each `data-card-part` node is the same markup in both. The layouts differ only
// in the arrangement and the favourite position, which are outside the parts.
describe('MantineListingCardPattern — one source per part in grid and list (Task 741 R62/R66a)', () => {
  const cases: Array<{ name: string; props: Partial<MantineListingCardPatternProps>; parts: string[] }> = [
    {
      name: 'an open reduced listing',
      props: { data: { id: 'l-1', title: 'Modern Apartment', location: 'Tirana, Albania', price: '70,000 EUR', priceOld: '80,000 EUR' }, pricePerSqmStr: '900 EUR / m²', originalPriceStr: '70,000 ALL' },
      parts: ['badges', 'photo-count', 'head', 'chips', 'footer'],
    },
    {
      name: 'a sold listing',
      props: { overlay: { label: 'SOLD', tone: 'sold' as const }, badges: [{ label: 'Sold', color: 'blueLight' }] },
      parts: ['badges', 'overlay', 'photo-count', 'head', 'chips', 'footer'],
    },
    {
      name: 'a premium listing',
      props: { isPremium: true },
      parts: ['badges', 'photo-count', 'head', 'chips', 'footer'],
    },
  ]
  // Mantine ids are generated per render; strip them so only the markup is compared.
  const normalise = (el: Element) => el.outerHTML.replace(/\s(id|aria-labelledby|aria-describedby|for)="[^"]*"/g, '')
  const partsOf = (container: HTMLElement) =>
    Object.fromEntries([...container.querySelectorAll('[data-card-part]')].map(el => [el.getAttribute('data-card-part') as string, normalise(el)]))

  it.each(cases)('$name: every data-card-part node is identical in grid and list', ({ props, parts }) => {
    const grid = renderPattern({ ...baseProps('grid'), ...props } as ReturnType<typeof baseProps>)
    const gridParts = partsOf(grid.container)
    grid.unmount()
    const list = renderPattern({ ...baseProps('list'), ...props } as ReturnType<typeof baseProps>)
    const listParts = partsOf(list.container)

    expect(Object.keys(gridParts).sort()).toEqual([...parts].sort())
    expect(Object.keys(listParts).sort()).toEqual([...parts].sort())
    for (const part of parts) expect(listParts[part], `part "${part}" differs between list and grid`).toBe(gridParts[part])
  })

  it('renders the sold overlay in list too (R63)', () => {
    renderPattern({ ...baseProps('list'), overlay: { label: 'SOLD', tone: 'sold' } })
    expect(screen.getByText('SOLD')).toBeInTheDocument()
  })
})

// Task 741 Revision 3i (R69/R73a) — the badge stack and the photo count are positioned from the theme's `xs` spacing.
// Mantine's `top`/`left`/`bottom`/`right` style props are size props with an identity resolver, so a bare `top="xs"`
// compiles to the invalid `top: xs`, which the browser drops: the badges then fall to their static position under the
// photo and are clipped (the 3h defect). The offsets must be resolved to `var(--mantine-spacing-xs)` first.
describe('MantineListingCardPattern — badge and photo-count offsets resolve to the xs spacing token (Task 741 R69/R73a)', () => {
  it.each(['grid', 'list'] as const)('layout="%s": the badge stack sits at top/left var(--mantine-spacing-xs), the photo count at bottom/right', layout => {
    const { container } = renderPattern(baseProps(layout))
    const badges = container.querySelector('[data-card-part="badges"]') as HTMLElement
    const count = container.querySelector('[data-card-part="photo-count"]') as HTMLElement
    expect(badges.style.top).toBe('var(--mantine-spacing-xs)')
    expect(badges.style.left).toBe('var(--mantine-spacing-xs)')
    expect(count.style.bottom).toBe('var(--mantine-spacing-xs)')
    expect(count.style.right).toBe('var(--mantine-spacing-xs)')
  })
})
