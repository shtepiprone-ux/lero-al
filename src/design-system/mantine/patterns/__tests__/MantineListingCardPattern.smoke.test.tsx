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

import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineListingCardPattern, type MantineListingCardOverlay } from '../MantineListingCardPattern'

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
    imageActions: undefined as ReactNode | undefined,
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
    expect(cardRoot!.children.length).toBe(2)

    const [imageEl, infoEl] = Array.from(cardRoot!.children)
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

  it('does NOT render the overlay in list mode (badge conveys sold/rented status instead)', () => {
    renderPattern({ ...baseProps('list'), overlay: { label: 'SOLD', className: 'consumer-overlay-hook' } })
    expect(screen.queryByText('SOLD')).not.toBeInTheDocument()
  })
})

describe('MantineListingCardPattern — overlay.className pass-through contract (Task 741)', () => {
  it('forwards an arbitrary consumer-supplied class to the rendered overlay element in layout="grid"', () => {
    renderPattern({ ...baseProps(), overlay: { label: 'SOLD', className: 'consumer-overlay-hook' } })
    const overlayEl = screen.getByText('SOLD')
    expect(overlayEl).toHaveClass('consumer-overlay-hook')
  })
})

describe('MantineListingCardPattern — imageActions slot (Task 764 Revision 1, R13/AC14)', () => {
  it('renders the imageActions node inside the grid Card.Section, after the badges', () => {
    const { container } = renderPattern({
      ...baseProps(),
      badges: [{ label: 'New', color: 'green' }],
      imageActions: <button aria-label="Save to collection">save</button>,
    })

    const sectionEl = container.querySelector('.mantine-Card-section')
    expect(sectionEl).toBeInTheDocument()

    const actionButton = screen.getByLabelText('Save to collection')
    expect(sectionEl).toContainElement(actionButton)

    // Paint-order proof (R16): imageActions must appear AFTER badges in DOM order (both are
    // `position: absolute` at the same top/left offset — later DOM order wins the default
    // stacking order, and the CSS also carries an explicit z-index, §3.4/AC16).
    const badgeEl = screen.getByText('New')
    // eslint-disable-next-line no-bitwise -- DOM position bitmask comparison, not a numeric flag
    expect(badgeEl.compareDocumentPosition(actionButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('does NOT render imageActions in layout="list" (Q2 — list layout has no consumer for this slot)', () => {
    renderPattern({ ...baseProps('list'), imageActions: <button aria-label="Save to collection">save</button> })
    expect(screen.queryByLabelText('Save to collection')).not.toBeInTheDocument()
  })

  it('renders nothing extra when imageActions is omitted (grid, default)', () => {
    renderPattern(baseProps())
    expect(screen.queryByLabelText('Save to collection')).not.toBeInTheDocument()
  })
})
