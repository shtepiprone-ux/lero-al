/**
 * Agent statistics drill-down hrefs — Task 848. Every target must land on an EXISTING cabinet filter.
 */
import { describe, it, expect } from 'vitest'
import { VALID_VISIBILITY_GROUPS } from '@/modules/cabinet/lib/queries'
import { agentCardHref, cabinetListingsHref, type AgentCardTarget } from '../hrefs'

const TARGETS: AgentCardTarget[] = ['pending', 'hidden', 'expiring', 'visible', 'inactive', 'sold', 'rented', 'all']

describe('agent statistics hrefs', () => {
  it('builds the cabinet listings landing through URLSearchParams', () => {
    expect(cabinetListingsHref('sq', 'HIDDEN')).toBe('/sq/cabinet?tab=listings&filter=HIDDEN')
  })

  it.each(TARGETS)('%s lands on an existing cabinet visibility group', (target) => {
    const url = new URL(agentCardHref('en', target), 'https://lero.test')
    expect(url.pathname).toBe('/en/cabinet')
    expect(url.searchParams.get('tab')).toBe('listings')
    expect(VALID_VISIBILITY_GROUPS as readonly string[]).toContain(url.searchParams.get('filter'))
  })

  it('maps each card onto the group that contains it', () => {
    const filterOf = (t: AgentCardTarget) => new URL(agentCardHref('uk', t), 'https://lero.test').searchParams.get('filter')
    expect(filterOf('pending')).toBe('HIDDEN')
    expect(filterOf('inactive')).toBe('HIDDEN')
    expect(filterOf('hidden')).toBe('VISIBLE')
    expect(filterOf('expiring')).toBe('VISIBLE')
    expect(filterOf('visible')).toBe('VISIBLE')
    expect(filterOf('sold')).toBe('CLOSED')
    expect(filterOf('rented')).toBe('CLOSED')
    expect(filterOf('all')).toBe('ALL')
  })
})
