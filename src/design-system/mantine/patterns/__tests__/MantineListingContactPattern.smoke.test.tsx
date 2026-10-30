/**
 * MantineListingContactPattern — price block regression guard (Task 912).
 *
 * The price block reads top to bottom: struck old price (only when `priceOld` is passed) →
 * current price → converted-currency disclosure (plain, never struck).
 */

import type { ComponentProps } from 'react'
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

function renderWithSlot(props: Partial<ComponentProps<typeof MantineListingContactPattern>>) {
  return render(
    <MantineProvider theme={theme}>
      <MantineListingContactPattern
        agent={{ name: 'Elira Hoxha', initials: 'EH' }}
        price={{ price: '80,000 EUR' }}
        labels={LABELS}
        humanCheck={<div data-testid="human-check">check</div>}
        inquiryTrigger={<button type="button">Send message</button>}
        {...props}
      />
    </MantineProvider>,
  )
}

describe('MantineListingContactPattern — humanCheck slot (Task 923 R113 (b))', () => {
  it('renders right after the Call and WhatsApp grid and before the message trigger, in the normal state', () => {
    renderWithSlot({})
    const slot = screen.getByTestId('human-check')
    const whatsapp = screen.getByRole('button', { name: 'WhatsApp' })
    const message = screen.getByRole('button', { name: 'Send message' })
    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(whatsapp.compareDocumentPosition(slot) & FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(message) & FOLLOWING).toBeTruthy()
    // a child of the card's own stack: the sibling right before it is the grid that holds both buttons
    expect(slot.previousElementSibling?.contains(whatsapp)).toBe(true)
  })

  it('renders when only one of the two buttons exists', () => {
    renderWithSlot({ hasPhone: false })
    expect(screen.getByTestId('human-check')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Call' })).toBeNull()
  })

  it.each(['guestCta', 'ownerDeleted', 'ownerUnavailable', 'closedListing'] as const)('does not render in the %s state', (state) => {
    renderWithSlot({ state })
    expect(screen.queryByTestId('human-check')).toBeNull()
  })

  it('does not render where the grid does not (neither a phone nor a WhatsApp number)', () => {
    renderWithSlot({ hasPhone: false, hasWhatsapp: false })
    expect(screen.queryByTestId('human-check')).toBeNull()
  })

  it('without the slot nothing extra is rendered', () => {
    const { container } = renderWithSlot({ humanCheck: undefined })
    expect(screen.queryByTestId('human-check')).toBeNull()
    expect(container.querySelector('[data-testid="listing-contact-card"]')).not.toBeNull()
  })
})

describe('MantineListingContactPattern — loading belongs to the pressed channel (Task 923 R116, owner D74)', () => {
  const call = () => screen.getByRole('button', { name: 'Call' })
  const whatsapp = () => screen.getByRole('button', { name: 'WhatsApp' })
  const spinner = (el: HTMLElement) => el.querySelector('.mantine-Loader-root')

  it('loading="call": only Call is disabled and holds the spinner; WhatsApp is enabled with its icon', () => {
    renderWithSlot({ loading: 'call' })
    expect(call()).toBeDisabled()
    expect(spinner(call())).not.toBeNull()
    expect(call().querySelector('.lucide-phone')).toBeNull()
    expect(whatsapp()).toBeEnabled()
    expect(spinner(whatsapp())).toBeNull()
    expect(whatsapp().querySelector('.lucide-message-circle')).not.toBeNull()
  })

  it('loading="whatsapp": only WhatsApp is disabled and holds the spinner; Call is enabled with its icon', () => {
    renderWithSlot({ loading: 'whatsapp' })
    expect(whatsapp()).toBeDisabled()
    expect(spinner(whatsapp())).not.toBeNull()
    expect(whatsapp().querySelector('.lucide-message-circle')).toBeNull()
    expect(call()).toBeEnabled()
    expect(spinner(call())).toBeNull()
    expect(call().querySelector('.lucide-phone')).not.toBeNull()
  })

  it('without loading neither button is disabled and neither shows a spinner', () => {
    renderWithSlot({})
    for (const button of [call(), whatsapp()]) {
      expect(button).toBeEnabled()
      expect(spinner(button)).toBeNull()
    }
  })

  it('contactDisabled still disables both buttons, with no spinner', () => {
    renderWithSlot({ contactDisabled: true })
    for (const button of [call(), whatsapp()]) {
      expect(button).toBeDisabled()
      expect(spinner(button)).toBeNull()
    }
  })
})

describe('MantineListingContactPattern — the revealed number and the WhatsApp fallback (Task 923 R118, owner D75, D78)', () => {
  const FALLBACK = { href: 'https://wa.me/355690000000', label: 'Open WhatsApp', note: 'Could not open WhatsApp at once. Press the button again.' }

  it('revealedPhone renders a link with that href and label, and no Show-number button', () => {
    renderWithSlot({ revealedPhone: { label: '+355 69 000 0000', href: 'tel:355690000000' } })
    const link = screen.getByRole('link', { name: '+355 69 000 0000' })
    expect(link).toHaveAttribute('href', 'tel:355690000000')
    expect(link).not.toHaveAttribute('disabled')
    expect(link).not.toHaveAttribute('data-disabled')
    expect(screen.queryByRole('button', { name: 'Call' })).toBeNull()
    // the other button is untouched
    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeEnabled()
  })

  it('whatsappFallback renders a link with its href, target and rel, and the note as a status after the grid and before the human check', () => {
    renderWithSlot({ whatsappFallback: FALLBACK })
    const link = screen.getByRole('link', { name: 'Open WhatsApp' })
    expect(link).toHaveAttribute('href', FALLBACK.href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('button', { name: 'WhatsApp' })).toBeNull()
    const note = screen.getByRole('status')
    expect(note).toHaveTextContent(FALLBACK.note)
    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(link.compareDocumentPosition(note) & FOLLOWING).toBeTruthy()
    expect(note.compareDocumentPosition(screen.getByTestId('human-check')) & FOLLOWING).toBeTruthy()
    // right after the grid that holds the buttons
    expect(note.previousElementSibling?.contains(link)).toBe(true)
  })

  it('without the two props there is no link and no status', () => {
    renderWithSlot({})
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('with contactDisabled neither link renders and both buttons are disabled', () => {
    renderWithSlot({
      contactDisabled: true,
      revealedPhone: { label: '+355 69 000 0000', href: 'tel:355690000000' },
      whatsappFallback: FALLBACK,
    })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Call' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeDisabled()
  })
})

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
