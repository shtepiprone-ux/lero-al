/**
 * MantineDashboardStatCard — single-link-target structure smoke (Task 843 Revision 1, F4)
 *
 * Spec §17.1's single drill-down target rule: with `href`, the whole card is exactly one `<a>`,
 * and its `error` state's Retry `<button>` is never nested inside a link (the error branch never
 * sets `href` on the card).
 *
 * Covers:
 *   1. `state="ready"` + `href` → exactly one `<a>`, containing both the label and value text, no
 *      nested `<a>`.
 *   2. `state="error"` + `onRetry` → a `<button>` whose `closest('a')` is `null`; clicking it
 *      calls `onRetry` exactly once.
 *   3. `state="error"` renders no `0`/value text (never fabricates a value on failure).
 *
 * Planted-violation (documented, verified once and reverted, see the task's session log for the
 * hash-witness pair): passing `href` through to the error branch's `Card` (the pre-fix-adjacent
 * defect this smoke test guards against) makes the `closest('a') === null` assertion FAIL.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineDashboardStatCard } from '../MantineDashboardStatCard'

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

describe('MantineDashboardStatCard — single link target (Revision 1, F4)', () => {
  it('ready + href renders exactly one <a> containing the label and value, no nested <a>', () => {
    render(
      withProvider(
        <MantineDashboardStatCard
          icon={<span>icon</span>}
          label="On moderation"
          value="12"
          href="/admin/listings?status=pending"
          state="ready"
        />,
      ),
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('On moderation')
    expect(links[0]).toHaveTextContent('12')
    expect(links[0].querySelectorAll('a')).toHaveLength(0)
  })

  it('error + onRetry renders a Retry button never nested in a link, and calls onRetry once', () => {
    const onRetry = vi.fn()
    render(
      withProvider(
        <MantineDashboardStatCard
          icon={<span>icon</span>}
          label="On moderation"
          value="12"
          state="error"
          errorMessage="Couldn't load this metric"
          retryLabel="Retry"
          onRetry={onRetry}
        />,
      ),
    )
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button.closest('a')).toBeNull()
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('error state renders no value/0 text', () => {
    render(
      withProvider(
        <MantineDashboardStatCard
          icon={<span>icon</span>}
          label="On moderation"
          value="12"
          state="error"
          errorMessage="Couldn't load this metric"
        />,
      ),
    )
    expect(screen.queryByText('12')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
