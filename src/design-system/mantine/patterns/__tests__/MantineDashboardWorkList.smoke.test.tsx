/**
 * MantineDashboardWorkList — row single-tab-stop + error-state smoke (Task 844, review G1/G2)
 *
 * Covers:
 *   1. Each row's `<a>` has no descendant matching `[tabindex]:not([tabindex="-1"]), a, button` —
 *      the "no nested competing clickable" rule (spec §17.1) — when the row's meta `RelativeTime`
 *      correctly passes `focusable={false}` (G2's required usage).
 *   2. The error state's Retry `<button>` has `closest('a') === null`.
 *   3. `maxRows=5` with 7 rows renders exactly 5 row links (never a silent truncation beyond
 *      what the caller asked for, never all 7).
 *   4. `state="error"` renders the composed `MantineEmptyLoadingErrorState` alert (`role="alert"`)
 *      — proving G1's fix (the error branch no longer clones `Text`+`Button` locally).
 *
 * Planted-violation (documented, verified once and reverted — hash witness in the task's session
 * log): case 1's own fixture row temporarily omitted `focusable={false}` on its `RelativeTime`
 * meta item (the exact regression G2 found — a `RelativeTime` with `absoluteLabel` defaults to
 * `focusable=true`, adding a second tab stop inside the row's own `<a>`). That plant made case 1
 * FAIL (`querySelector` found the offending `[tabindex]`). Restored; `git hash-object` before the
 * plant and after the restore are identical.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { theme } from '@/design-system/mantine/theme'
import { MantineDashboardWorkList, type DashboardWorkListRow } from '../MantineDashboardWorkList'
import { RelativeTime } from '@/components/shared/RelativeTime'

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

function withProvider(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={{}}>
      <MantineProvider theme={theme} env="test">{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

function rowsWithMeta(count: number, focusable: boolean): DashboardWorkListRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    href: `/admin/listings?row=${i + 1}`,
    primary: `Listing ${i + 1}`,
    meta: [<RelativeTime key="t" date="2026-09-18T08:00:00.000Z" absoluteLabel="18.09.2026 08:00" focusable={focusable} />],
    ctaLabel: 'Review',
  }))
}

describe('MantineDashboardWorkList — no nested competing clickable (G2)', () => {
  it('a row <a> has no descendant [tabindex]/a/button when meta RelativeTime uses focusable={false}', () => {
    render(withProvider(<MantineDashboardWorkList rows={rowsWithMeta(3, false)} state="ready" />))
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    for (const link of links) {
      const offender = link.querySelector('[tabindex]:not([tabindex="-1"]), a, button')
      expect(offender).toBeNull()
    }
  })
})

describe('MantineDashboardWorkList — Tooltip is not tied to focusable (K2, review 2)', () => {
  it('with focusable={false} the row still has no element with tabindex >= 0, and hover still opens the Tooltip', async () => {
    render(withProvider(<MantineDashboardWorkList rows={rowsWithMeta(1, false)} state="ready" />))
    const link = screen.getByRole('link')
    const time = link.querySelector('time')!
    // K2 was: focusable={false} also removed the hover Tooltip. tabIndex must stay suppressed...
    expect(link.querySelector('[tabindex]:not([tabindex="-1"])')).toBeNull()
    // ...but the Tooltip must still open on hover, because focusable only gates the tab stop.
    fireEvent.mouseEnter(time)
    expect(await screen.findByRole('tooltip')).toBeInTheDocument()
  })
})

describe('MantineDashboardWorkList — error state composes MantineEmptyLoadingErrorState (G1)', () => {
  it('Retry button is never nested inside a link', () => {
    const onRetry = vi.fn()
    render(
      withProvider(
        <MantineDashboardWorkList rows={[]} state="error" errorText="Couldn't load these rows" retryLabel="Retry" onRetry={onRetry} />,
      ),
    )
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button.closest('a')).toBeNull()
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders the composed MantineEmptyLoadingErrorState alert', () => {
    render(withProvider(<MantineDashboardWorkList rows={[]} state="error" errorText="Couldn't load these rows" />))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText("Couldn't load these rows")).toBeInTheDocument()
  })
})

describe('MantineDashboardWorkList — maxRows never silently truncates past the caller\'s count', () => {
  it('maxRows=5 with 7 rows renders exactly 5 row links', () => {
    render(withProvider(<MantineDashboardWorkList rows={rowsWithMeta(7, false)} maxRows={5} state="ready" />))
    expect(screen.getAllByRole('link')).toHaveLength(5)
  })
})
