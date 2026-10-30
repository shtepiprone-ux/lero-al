/**
 * MantineDashboardCard / MantineDashboardGrid (+ TopRow, Split, Full) / MantineDashboardHeader (Task 923 Revision 7: no unit test).
 * Card: the heading and the period caption under it (the month is stated ONCE there, not on every axis tick), the loading / error / stale / ready states, a retry that
 * is reachable, `fill`. Grid: the top row has as many columns as it has children up to its maximum, none for no children, and the columns at the layout switches.
 * Header: title, optional subtitle, status line, period control and actions; the stale badge.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MantineDashboardCard } from '../MantineDashboardCard'
import { MantineDashboardGrid, MantineDashboardGridTopRow, MantineDashboardGridSplit, MantineDashboardGridFull } from '../MantineDashboardGrid'
import { MantineDashboardHeader } from '../MantineDashboardHeader'
import { renderApp, setViewport } from './viewportKit'

beforeEach(() => { setViewport(1024) })

describe('MantineDashboardCard', () => {
  it('is a level-2 heading with the period caption under it, and the content', () => {
    renderApp(<MantineDashboardCard title="New listings" scopeLabel="Aug 19 – Sep 17" state="ready"><p>content</p></MantineDashboardCard>)
    expect(screen.getByRole('heading', { level: 2, name: 'New listings' })).toBeInTheDocument()
    expect(screen.getByText('Aug 19 – Sep 17')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('without a caption there is none, and a header action is rendered beside the title', () => {
    renderApp(<MantineDashboardCard title="T" headerAction={<button type="button">Export</button>} state="ready" />)
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(document.querySelectorAll('.mantine-Text-root').length).toBe(0)
  })

  it('loading is busy and named, shows skeletons and not the content', () => {
    renderApp(<MantineDashboardCard title="T" state="loading" loadingAriaLabel="Loading card"><p>content</p></MantineDashboardCard>)
    const busy = screen.getByLabelText('Loading card')
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(3)
    expect(screen.queryByText('content')).toBeNull()
  })

  it('a ready card is not busy', () => {
    renderApp(<MantineDashboardCard title="T" state="ready" loadingAriaLabel="Loading card"><p>content</p></MantineDashboardCard>)
    expect(document.querySelector('[aria-busy]')).toBeNull()
    expect(screen.queryByLabelText('Loading card')).toBeNull()
  })

  it('error shows its message and the retry, which runs once; no content', () => {
    const onRetry = vi.fn()
    renderApp(<MantineDashboardCard title="T" state="error" errorMessage="Could not load" retryLabel="Try again" onRetry={onRetry}><p>content</p></MantineDashboardCard>)
    expect(screen.getByText('Could not load')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('content')).toBeNull()
  })

  it('error without a retry label has no button', () => {
    renderApp(<MantineDashboardCard title="T" state="error" errorMessage="Could not load" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stale keeps the content and adds a warning badge with the age', () => {
    renderApp(<MantineDashboardCard title="T" state="stale" staleLabel="Updated" staleTime="2 h ago"><p>content</p></MantineDashboardCard>)
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.getByText(/Updated/)).toHaveTextContent('Updated 2 h ago')
  })

  it('stale without a label has no badge', () => {
    renderApp(<MantineDashboardCard title="T" state="stale"><p>content</p></MantineDashboardCard>)
    expect(screen.queryByText(/ago/)).toBeNull()
  })

  it('fill makes the card as tall as its cell', () => {
    const { unmount } = renderApp(<MantineDashboardCard title="T" state="ready" fill />)
    expect((document.querySelector('.mantine-Card-root') as HTMLElement).style.height).toBe('100%')
    unmount()
    renderApp(<MantineDashboardCard title="T" state="ready" />)
    expect((document.querySelector('.mantine-Card-root') as HTMLElement).style.height).toBe('')
  })
})

describe('MantineDashboardGrid', () => {
  const cell = (n: number) => Array.from({ length: n }, (_, i) => <div key={i} data-testid={`cell-${i}`}>c{i}</div>)
  const cssOf = () => Array.from(document.querySelectorAll('style')).map((s) => s.textContent ?? '').join('\n')

  it('the page frame centres its content and stacks it in a column', () => {
    renderApp(<MantineDashboardGrid><p>a</p><p>b</p></MantineDashboardGrid>)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b').parentElement).toHaveStyle({ flexDirection: 'column' })
  })

  it('the top row renders nothing for no children', () => {
    const { container } = renderApp(<MantineDashboardGridTopRow />)
    expect(container.querySelector('.mantine-SimpleGrid-root')).toBeNull()
  })

  const widest = () => Math.max(...[...cssOf().matchAll(/--sg-cols:(\d+);/g)].map((m) => Number(m[1])))
  // the CSS Mantine writes for a responsive value inside the media query that starts at `min`
  const inMedia = (min: string, declaration: RegExp) => new RegExp(`min-width: ${min}\\)\\{[^}]*${declaration.source}`).test(cssOf())

  it('the top row has one column for one child and as many as it has up to its maximum (4)', () => {
    for (const [count, expected] of [[1, 1], [2, 2], [3, 3], [4, 4], [6, 4]] as const) {
      const { unmount } = renderApp(<MantineDashboardGridTopRow>{cell(count)}</MantineDashboardGridTopRow>)
      expect(widest(), `${count} children`).toBe(expected)
      unmount()
    }
  })

  it('one column on a phone, at most two from md (768px), the widest from lg (1024px)', () => {
    renderApp(<MantineDashboardGridTopRow>{cell(4)}</MantineDashboardGridTopRow>)
    expect(cssOf()).toMatch(/--sg-cols:1;/)
    expect(inMedia('48em', /--sg-cols:2;/)).toBe(true)
    expect(inMedia('64em', /--sg-cols:4;/)).toBe(true)
  })

  it('maxColumns caps it, and wideFrom="xl" keeps two columns at lg and goes wide only from xl', () => {
    const { unmount } = renderApp(<MantineDashboardGridTopRow maxColumns={2}>{cell(4)}</MantineDashboardGridTopRow>)
    expect(widest()).toBe(2)
    unmount()
    renderApp(<MantineDashboardGridTopRow wideFrom="xl">{cell(4)}</MantineDashboardGridTopRow>)
    expect(inMedia('80em', /--sg-cols:4;/)).toBe(true)
    expect(inMedia('64em', /--sg-cols:2;/)).toBe(true)
  })

  it('the split puts the main content in 8 of 12 columns and the side in 4 from lg, full width below', () => {
    renderApp(<MantineDashboardGridSplit main={<p>main</p>} side={<p>side</p>} />)
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('side')).toBeInTheDocument()
    expect(cssOf()).toMatch(/--col-flex-basis:100%;/)
    expect(inMedia('64em', /--col-flex-basis:66\.6/)).toBe(true)
    expect(inMedia('64em', /--col-flex-basis:33\.3/)).toBe(true)
  })

  it('a full-width block just holds its children', () => {
    renderApp(<MantineDashboardGridFull><p>wide</p></MantineDashboardGridFull>)
    expect(screen.getByText('wide').parentElement).toHaveStyle({ width: '100%' })
  })
})

describe('MantineDashboardHeader', () => {
  it('is the page heading with its subtitle', () => {
    renderApp(<MantineDashboardHeader title="Dashboard" subtitle="Operational state" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Operational state')).toBeInTheDocument()
  })

  it('with nothing but a title there is no status line, period control or actions block', () => {
    const { container } = renderApp(<MantineDashboardHeader title="Dashboard" />)
    expect(screen.queryByText('Operational state')).toBeNull()
    expect(container.querySelectorAll('.mantine-Flex-root')).toHaveLength(1)
  })

  it('shows the update time, the stale badge, the period control and the actions, in that order', () => {
    renderApp(<MantineDashboardHeader title="D" updatedAtLabel="Updated 10:00" stale={{ label: 'Stale' }} periodControl={<span>period</span>} actions={<button type="button">New</button>} />)
    const order = ['Updated 10:00', 'Stale', 'period', 'New'].map((t) => screen.getByText(t))
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING, `${i}`).toBeTruthy()
  })

  it('a period control alone is enough to show the right-hand block, without a status line', () => {
    renderApp(<MantineDashboardHeader title="D" periodControl={<span>period</span>} />)
    expect(screen.getByText('period')).toBeInTheDocument()
    expect(screen.queryByText(/Updated/)).toBeNull()
  })

  it('a stale flag alone shows the status line with only the badge', () => {
    renderApp(<MantineDashboardHeader title="D" stale={{ label: 'Stale' }} />)
    expect(screen.getByText('Stale')).toBeInTheDocument()
  })
})
