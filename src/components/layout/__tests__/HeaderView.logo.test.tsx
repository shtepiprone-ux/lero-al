/**
 * Task 989 AC2: the header shows the saved logo. The site layout hands `HeaderView` a `logoUrl` only after `isBrandImageUrl` accepted it (the layout's own test,
 * `src/app/[locale]/__tests__/layoutBrand.test.ts`); with it the header draws the image through `AppImage` (`brand-logo`) with the site name as its text
 * alternative and no wordmark, without it the fixed wordmark of `main`.
 */
import React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { HeaderView } from '../HeaderView'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => '/en' }))

const MESSAGES = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>
const LOGO = 'https://res.cloudinary.com/lero/image/upload/v1/Lero/logo.svg'
const noop = () => {}

function header(props: { logoUrl?: string | null; siteName?: string }) {
  return render(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <MantineProvider theme={theme} env="test">
        <HeaderView
          isAuthenticated={false}
          user={null}
          locale="en"
          onOpenAuth={noop}
          onSwitchLocale={noop}
          onNavigate={noop}
          onOpenAdmin={noop}
          onLogout={noop}
          mobileOpen={false}
          onOpenMobile={noop}
          onCloseMobile={noop}
          {...props}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeAll(() => setViewport(1280))
afterEach(cleanup)

describe('Task 989 AC2 — the header logo', () => {
  it('with a logo address the header shows the image, named by the site name, inside the home link, and no wordmark', () => {
    header({ logoUrl: LOGO, siteName: 'Lero.al' })
    const image = screen.getByRole('img', { name: 'Lero.al' }) as HTMLImageElement
    // the `brand-logo` variant fits the saved file into the header height on Cloudinary, the file itself unchanged
    expect(image.getAttribute('src')).toBe('https://res.cloudinary.com/lero/image/upload/h_84,c_fit,f_auto,q_auto/v1/Lero/logo.svg')
    expect(image.closest('a')?.getAttribute('href')).toBe('/en')
    expect(screen.queryByText('Lero')).toBeNull()
  })

  it('without a logo address the header keeps the wordmark of main', () => {
    header({ logoUrl: null, siteName: 'Lero.al' })
    expect(screen.queryByRole('img', { name: 'Lero.al' })).toBeNull()
    expect(screen.getByText('Lero')).toBeInTheDocument()
    expect(screen.getByText('.al')).toBeInTheDocument()
  })

  it('no props at all is the wordmark too (every existing caller of HeaderView)', () => {
    header({})
    expect(screen.getByText('Lero')).toBeInTheDocument()
  })
})
