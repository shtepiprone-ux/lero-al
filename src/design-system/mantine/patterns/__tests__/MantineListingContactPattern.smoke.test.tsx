/**
 * MantineListingContactPattern — price block regression guard (Task 912).
 *
 * The price block reads top to bottom: struck old price (only when `priceOld` is passed) →
 * current price → converted-currency disclosure (plain, never struck).
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import {
  MantineListingContactPattern,
  type MantineListingContactPriceInfo,
  type MantineListingContactLabels,
} from '../MantineListingContactPattern'

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

const LABELS: MantineListingContactLabels = {
  verified: 'Verified',
  call: 'Call',
  whatsapp: 'WhatsApp',
  inquiry: 'Send message',
  report: 'Report',
  loginCta: 'Log in',
  guestTitle: 'Guest title',
  guestDesc: 'Guest desc',
  deletedTitle: 'Deleted title',
  deletedDesc: 'Deleted desc',
  unavailableDesc: 'Unavailable',
  closedLabel: 'Closed',
}

function renderPattern(price: MantineListingContactPriceInfo) {
  return render(
    <MantineProvider theme={theme}>
      <MantineListingContactPattern
        agent={{ name: 'Elira Hoxha', initials: 'EH' }}
        price={price}
        labels={LABELS}
      />
    </MantineProvider>,
  )
}

function isStruck(el: HTMLElement) {
  return /line-through/.test(el.style.textDecoration || getComputedStyle(el).textDecorationLine)
}

describe('MantineListingContactPattern — price block (Task 912)', () => {
  it('(a) priceOld + originalPrice: old price struck, disclosure plain, DOM order old → main → disclosure', () => {
    renderPattern({
      price: '80,000 EUR',
      priceOld: '92,000 EUR',
      originalPrice: '80,000 EUR',
      originalPriceLabel: 'Original price',
    })

    const oldPrice = screen.getByText('92,000 EUR')
    const disclosure = screen.getByText('Original price: 80,000 EUR')
    const main = screen.getAllByText('80,000 EUR').find(el => !el.textContent?.includes('Original'))!

    expect(isStruck(oldPrice)).toBe(true)
    expect(isStruck(disclosure)).toBe(false)
    expect(isStruck(main)).toBe(false)

    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(oldPrice.compareDocumentPosition(main) & FOLLOWING).toBeTruthy()
    expect(main.compareDocumentPosition(disclosure) & FOLLOWING).toBeTruthy()
  })

  it('(b) without priceOld: nothing in the price block is struck, even with a disclosure', () => {
    const { container } = renderPattern({
      price: '80,000 EUR',
      originalPrice: '80,000 EUR',
      originalPriceLabel: 'Original price',
    })

    expect(screen.getByText('Original price: 80,000 EUR')).toBeInTheDocument()
    const struck = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(isStruck)
    expect(struck).toHaveLength(0)
  })

  it('(c) without originalPrice: no disclosure line', () => {
    renderPattern({ price: '80,000 EUR', originalPriceLabel: 'Original price' })

    expect(screen.queryByText(/Original price/)).not.toBeInTheDocument()
  })
})
