// @vitest-environment node
/**
 * Task 988 R6-3 (F13): the root layout takes the page language from next-intl's request header only (the admin is under the slug, the `admin-locale` cookie is
 * gone); an address without one, which never renders a page of the site, falls back to `sq`. The layout's element tree is read, nothing is rendered.
 */
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => ({ locale: null as string | null }))
vi.mock('next/font/google', () => ({ Open_Sans: () => ({ variable: 'font-open-sans' }) }))
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => (name === 'X-NEXT-INTL-LOCALE' ? request.locale : null) }),
}))

import RootLayout from '../layout'

describe('RootLayout — the page language (Task 988)', () => {
  it('takes `lang` from the X-NEXT-INTL-LOCALE header', async () => {
    request.locale = 'uk'
    const html = await RootLayout({ children: <p>child</p> })
    expect(html.props.lang).toBe('uk')
  })

  it('falls back to `sq` without the header', async () => {
    request.locale = null
    const html = await RootLayout({ children: <p>child</p> })
    expect(html.props.lang).toBe('sq')
  })
})
