/**
 * A matchMedia that evaluates the `(max-width: ...)` / `(min-width: ...)` queries Mantine and the project helper `belowMobileGateQuery` build, against a
 * chosen viewport width (Task 923 Revision 7). jsdom has no layout, so the compact (< 640px) presentation is selected by this, exactly as the browser does.
 */
import React from 'react'
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'

const toPx = (n: number, unit: string) => (unit === 'em' || unit === 'rem' ? n * 16 : n)

export function matchesQuery(query: string, width: number): boolean {
  const m = /\((max|min)-width:\s*([\d.]+)(px|em|rem)\)/.exec(query)
  if (!m) return false
  const limit = toPx(Number(m[2]), m[3])
  return m[1] === 'max' ? width <= limit : width >= limit
}

export function setViewport(width: number) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: matchesQuery(query, width), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
}

export function renderApp(node: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} env="test">{node}</MantineProvider>
    </NextIntlClientProvider>,
  )
}
