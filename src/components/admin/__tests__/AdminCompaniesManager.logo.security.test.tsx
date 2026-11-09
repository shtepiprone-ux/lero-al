/**
 * Task 951 AC7 (CodeQL js/xss-through-dom): the logo preview in the company form is an <img src> that takes a string from props (the stored logo address). Only
 * https:, blob:, data:image/ and root-relative sources reach it; any other scheme shows the placeholder icon and renders no <img>.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { AdminCompaniesManager } from '../AdminCompaniesManager'

vi.mock('@/modules/companies/actions', () => ({
  createCompanyAction: vi.fn(),
  updateCompanyAction: vi.fn(),
  deleteCompanyAction: vi.fn(),
}))
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub
  // the Radix dialog measures with a ResizeObserver, which jsdom does not have
  vi.stubGlobal('ResizeObserver', IntersectionObserverStub)
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

const company = (logo_url: string | null) => ({ id: 'co-1', name: 'Tirana Group', logo_url, created_at: '2026-01-01T00:00:00.000Z', agentCount: 2 })

function openFormFor(logoUrl: string | null) {
  render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <AdminCompaniesManager companies={[company(logoUrl)]} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
  // the name button of the row opens the edit form
  fireEvent.click(screen.getByRole('button', { name: 'Tirana Group' }))
}

const logoPreview = () => document.body.querySelector('img[alt="logo"]')

describe('the logo preview of the company form', () => {
  it('shows an https logo', () => {
    openFormFor('https://res.cloudinary.com/demo/image/upload/v1/companies/a.png')
    expect(logoPreview()?.getAttribute('src')).toBe('https://res.cloudinary.com/demo/image/upload/v1/companies/a.png')
  })

  it.each([
    ['javascript:'],
    ['data:text/html,<script>alert(1)</script>'],
    ['//evil.example/logo.png'],
    ['http://example.com/logo.png'],
  ])('renders no <img> for the stored address %j', (stored) => {
    openFormFor(stored)
    expect(logoPreview()).toBeNull()
    expect(document.body.innerHTML).not.toMatch(/src="javascript:/i)
  })

  it('shows the placeholder, and no <img>, when there is no logo', () => {
    openFormFor(null)
    expect(logoPreview()).toBeNull()
  })
})
