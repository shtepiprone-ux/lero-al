/**
 * MantineDashboardStatRows — allZeroState gate smoke (Task 843 Revision 1, F1)
 *
 * Review 1 found that `allZeroState` replaced the rows whenever the caller PASSED it, regardless
 * of whether any row's count was actually non-zero — a consumer that always passes the empty
 * state (the natural AGT-01 call in 854) would hide real non-zero action counts. The fix
 * evaluates `rows.every((r) => r.count === 0)` itself; `count` became `number` (was `ReactNode`,
 * which made that evaluation impossible), with an optional `displayCount` for caller formatting.
 *
 * Covers:
 *   (a) mixed counts [3, 0, 1] + allZeroState passed → 3 row links render, no empty-state text.
 *   (b) all-zero counts [0, 0, 0] + allZeroState passed → the empty-state text renders, 0 links.
 *   (c) all-zero counts [0, 0, 0] with NO allZeroState → the 3 rows still render as links.
 *   (d) `displayCount` renders in place of the raw `count`.
 *
 * Planted-violation (documented, verified once and reverted, see the task's session log for the
 * hash-witness pair): reverting the render condition to `if (allZeroState)` (the pre-fix defect)
 * makes case (a) FAIL — the empty state wrongly replaces the 3 real rows.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineDashboardStatRows, type DashboardStatRow } from '../MantineDashboardStatRows'

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
  return <MantineProvider theme={theme} env="test">{children}</MantineProvider>
}

const ALL_ZERO_STATE = { icon: <span data-testid="empty-icon">icon</span>, text: 'Nothing needs your attention' }

describe('MantineDashboardStatRows — allZeroState gate (Revision 1, F1)', () => {
  it('(a) mixed counts + allZeroState passed → rows render, not the empty state', () => {
    const rows: DashboardStatRow[] = [
      { label: 'Pending', count: 3, href: '/a', tone: 'warning' },
      { label: 'In review', count: 0, href: '/b', tone: 'neutral' },
      { label: 'Rejected', count: 1, href: '/c', tone: 'danger' },
    ]
    render(withProvider(<MantineDashboardStatRows rows={rows} allZeroState={ALL_ZERO_STATE} state="ready" />))
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.queryByText(ALL_ZERO_STATE.text)).not.toBeInTheDocument()
  })

  it('(b) all-zero counts + allZeroState passed → the empty state renders, no row links', () => {
    const rows: DashboardStatRow[] = [
      { label: 'Pending', count: 0, href: '/a', tone: 'warning' },
      { label: 'In review', count: 0, href: '/b', tone: 'neutral' },
      { label: 'Rejected', count: 0, href: '/c', tone: 'danger' },
    ]
    render(withProvider(<MantineDashboardStatRows rows={rows} allZeroState={ALL_ZERO_STATE} state="ready" />))
    expect(screen.getByText(ALL_ZERO_STATE.text)).toBeInTheDocument()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('(c) all-zero counts with NO allZeroState → the 3 rows still render as links', () => {
    const rows: DashboardStatRow[] = [
      { label: 'Pending', count: 0, href: '/a', tone: 'warning' },
      { label: 'In review', count: 0, href: '/b', tone: 'neutral' },
      { label: 'Rejected', count: 0, href: '/c', tone: 'danger' },
    ]
    render(withProvider(<MantineDashboardStatRows rows={rows} state="ready" />))
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('(d) displayCount renders in place of the raw count', () => {
    const rows: DashboardStatRow[] = [
      { label: 'Pending', count: 1234, displayCount: '1 234', href: '/a', tone: 'warning' },
    ]
    render(withProvider(<MantineDashboardStatRows rows={rows} state="ready" />))
    expect(screen.getByText('1 234')).toBeInTheDocument()
    expect(screen.queryByText('1234')).not.toBeInTheDocument()
  })
})
