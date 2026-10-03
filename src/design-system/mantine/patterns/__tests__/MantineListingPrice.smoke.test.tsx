/**
 * MantineListingPrice — canonical price block regression guard (Task 912 R11, AC11/AC12).
 *
 * Top to bottom: struck original price (only when `priceOld` is passed) → current price (+ `trailing`)
 * → price in the owner's currency (plain, never struck, only when `ownerCurrency` is passed).
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineListingPrice, type MantineListingPriceProps } from '../MantineListingPrice'
import { MantineListingDetailPattern } from '../MantineListingDetailPattern'
import { MantineListingContactPattern } from '../MantineListingContactPattern'

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

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING

function isStruck(el: HTMLElement) {
  return /line-through/.test(el.style.textDecoration || getComputedStyle(el).textDecorationLine)
}

function renderPrice(props: MantineListingPriceProps) {
  return render(
    <MantineProvider theme={theme}>
      <MantineListingPrice {...props} />
    </MantineProvider>,
  )
}

describe('MantineListingPrice (Task 912)', () => {
  it('(a) priceOld: struck, and before the current price in DOM order', () => {
    renderPrice({ price: '125,000 EUR', priceOld: '138,000 EUR' })

    const oldPrice = screen.getByText('138,000 EUR')
    const main = screen.getByText('125,000 EUR')

    expect(isStruck(oldPrice)).toBe(true)
    expect(isStruck(main)).toBe(false)
    expect(oldPrice.compareDocumentPosition(main) & FOLLOWING).toBeTruthy()
  })

  it('(b) without priceOld: nothing is struck, even with an owner-currency line', () => {
    const { container } = renderPrice({
      price: '12,500,000 ALL',
      ownerCurrency: { label: "Price in the owner's currency", value: '125,000 EUR' },
    })

    const struck = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(isStruck)
    expect(struck).toHaveLength(0)
  })

  it('(c) ownerCurrency: "{label}: {value}" follows the price and is not struck; absent without it', () => {
    const { unmount } = renderPrice({
      price: '12,500,000 ALL',
      priceOld: '13,800,000 ALL',
      ownerCurrency: { label: "Price in the owner's currency", value: '125,000 EUR' },
    })

    const main = screen.getByText('12,500,000 ALL')
    const owner = screen.getByText("Price in the owner's currency: 125,000 EUR")
    expect(isStruck(owner)).toBe(false)
    expect(main.compareDocumentPosition(owner) & FOLLOWING).toBeTruthy()
    unmount()

    renderPrice({ price: '125,000 EUR' })
    expect(screen.queryByText(/owner's currency/)).not.toBeInTheDocument()
  })

  it('(d) trailing renders on the current price row', () => {
    renderPrice({ price: '125,000 EUR', trailing: <span>1,471 EUR/m²</span> })

    const main = screen.getByText('125,000 EUR')
    const trailing = screen.getByText('1,471 EUR/m²')
    expect(main.compareDocumentPosition(trailing) & FOLLOWING).toBeTruthy()
    expect(main.parentElement).toBe(trailing.parentElement)
  })
})

describe('MantineListingPrice colour (Task 912 R22, D89-7)', () => {
  // jsdom keeps the token as written: a plain hex for the dark price, a CSS variable for the brand price.
  const DARK = /^(#111111|rgb\(17, 17, 17\))$/i

  it('(e) without priceOld the price is the dark token colour', () => {
    renderPrice({ price: '125,000 EUR' })
    expect(screen.getByText('125,000 EUR').style.color).toMatch(DARK)
  })

  it('(f) with priceOld the price is the brand colour, not the dark token', () => {
    renderPrice({ price: '125,000 EUR', priceOld: '138,000 EUR' })
    const color = screen.getByText('125,000 EUR').style.color
    expect(color).toMatch(/var\(--mantine-color-brand-/)
    expect(color).not.toMatch(DARK)
  })

  it('(g) the same through MantineListingDetailPattern and MantineListingContactPattern', () => {
    const labels = {
      verified: 'Verified', call: 'Call', whatsapp: 'WhatsApp', inquiry: 'Send message', report: 'Report',
      loginCta: 'Log in', guestTitle: 'g', guestDesc: 'g', deletedTitle: 'd', deletedDesc: 'd', unavailableDesc: 'u', closedLabel: 'c',
    }
    const detail = (priceOld?: string) => (
      <MantineProvider theme={theme}>
        <MantineListingDetailPattern
          data={{ title: 'Apartment', price: '12,500 EUR', priceOld, views: 1, viewsLabel: 'views', date: 'today', publicId: '1' }}
          images={[]}
          gallerySlot={<div />}
          contactSlot={<div />}
          features={[]}
          descriptionTitle="Description"
          amenitiesTitle="Amenities"
        />
      </MantineProvider>
    )
    const contact = (priceOld?: string) => (
      <MantineProvider theme={theme}>
        <MantineListingContactPattern agent={{ name: 'Elira', initials: 'E' }} price={{ price: '12,500 EUR', priceOld }} labels={labels} />
      </MantineProvider>
    )

    for (const [name, make] of [['detail', detail], ['contact', contact]] as const) {
      const plain = render(make())
      expect(screen.getByText('12,500 EUR').style.color, name).toMatch(DARK)
      plain.unmount()
      const reduced = render(make('13,800 EUR'))
      const color = screen.getByText('12,500 EUR').style.color
      expect(color, name).toMatch(/var\(--mantine-color-brand-/)
      expect(color, name).not.toMatch(DARK)
      reduced.unmount()
    }
  })
})

describe('MantineListingDetailPattern — price block through MantineListingPrice (Task 912 R13, AC12)', () => {
  it('the struck old price comes before the current price, and the owner-currency line follows it', () => {
    render(
      <MantineProvider theme={theme}>
        <MantineListingDetailPattern
          data={{
            title: 'Apartment',
            price: '12,500,000 ALL',
            priceOld: '13,800,000 ALL',
            originalPriceLabel: "Price in the owner's currency",
            originalPrice: '125,000 EUR',
            views: 1,
            viewsLabel: 'views',
            date: 'today',
            publicId: '1',
          }}
          images={[]}
          gallerySlot={<div />}
          contactSlot={<div />}
          features={[]}
          descriptionTitle="Description"
          amenitiesTitle="Amenities"
        />
      </MantineProvider>,
    )

    const oldPrice = screen.getByText('13,800,000 ALL')
    const main = screen.getByText('12,500,000 ALL')
    const owner = screen.getByText("Price in the owner's currency: 125,000 EUR")

    expect(isStruck(oldPrice)).toBe(true)
    expect(isStruck(owner)).toBe(false)
    expect(oldPrice.compareDocumentPosition(main) & FOLLOWING).toBeTruthy()
    expect(main.compareDocumentPosition(owner) & FOLLOWING).toBeTruthy()
  })
})
