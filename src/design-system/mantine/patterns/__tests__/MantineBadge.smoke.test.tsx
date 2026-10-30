/**
 * MantineBadge (Task 859 R25): a status badge takes its colour from the registry (and, since D78-29, never an icon), a tone badge from the
 * semantic tone, a count badge renders its number; `onImage` is the solid fill.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '../../theme'
import { MantineBadge } from '../MantineBadge'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

function renderBadge(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>)
}

describe('MantineBadge', () => {
  it('a status badge carries the registry colour and its label', () => {
    renderBadge(<MantineBadge variant="status" entity="user" value="blocked" data-testid="b">Blocked</MantineBadge>)
    const badge = screen.getByTestId('b')
    expect(badge.textContent).toContain('Blocked')
    expect(badge.getAttribute('style') ?? '').toContain('--badge-bg')
  })

  it('no badge renders an icon: status, tone and count are text only (D78-29)', () => {
    const { container } = renderBadge(
      <>
        <MantineBadge variant="status" entity="ticket" value="open">Open</MantineBadge>
        <MantineBadge variant="status" entity="agentVerification" value="verified">Verified</MantineBadge>
        <MantineBadge variant="tone" tone="warning">Stale</MantineBadge>
        <MantineBadge variant="count">3</MantineBadge>
      </>,
    )
    expect(container.querySelectorAll('.mantine-Badge-root').length).toBe(4)
    expect(container.querySelector('.mantine-Badge-root svg')).toBeNull()
    expect(container.querySelector('[data-position="left"]')).toBeNull()
  })

  it('status and tone badges are the one solid look (D78-26), whatever the meaning', () => {
    const { container } = renderBadge(
      <>
        <MantineBadge variant="tone" tone="success">A</MantineBadge>
        <MantineBadge variant="tone" tone="neutral">B</MantineBadge>
        <MantineBadge variant="status" entity="listing" value="archived">C</MantineBadge>
        <MantineBadge variant="status" entity="report" value="reviewed">D</MantineBadge>
      </>,
    )
    expect(container.querySelectorAll('[data-variant="filled"]').length).toBe(4)
    expect(container.querySelector('[data-variant="light"]')).toBeNull()
  })

  it('every badge is a pill: the component takes no shape prop and the theme radius is pill', () => {
    const { container } = renderBadge(<MantineBadge variant="tone" tone="brand" size="xs">A</MantineBadge>)
    expect(container.querySelector('.mantine-Badge-root')?.getAttribute('style') ?? '').toContain('--badge-radius: var(--mantine-radius-pill)')
  })

  it('a count badge renders its number, round when asked', () => {
    const { container } = renderBadge(<MantineBadge variant="count" circle>3</MantineBadge>)
    expect(screen.getByText('3')).toBeTruthy()
    expect(container.querySelector('[data-circle]')).not.toBeNull()
  })

  it('count emphasis comes from the registry: brand is filled, onBrand is white, neutral is the light count chip (R59)', () => {
    const { container } = renderBadge(
      <>
        <MantineBadge variant="count">1</MantineBadge>
        <MantineBadge variant="count" emphasis="onBrand">2</MantineBadge>
        <MantineBadge variant="count" emphasis="neutral">3</MantineBadge>
      </>,
    )
    const variantOf = (text: string) => screen.getByText(text).closest('.mantine-Badge-root')?.getAttribute('data-variant')
    expect(variantOf('1')).toBe('filled')
    expect(variantOf('2')).toBe('white')
    expect(variantOf('3')).toBe('light')
    expect(container.querySelectorAll('.mantine-Badge-root').length).toBe(3)
  })
})
