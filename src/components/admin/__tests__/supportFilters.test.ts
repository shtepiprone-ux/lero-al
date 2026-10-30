/**
 * supportFilters — unit tests (Task 859, T1/T2). The ADM-06 query is read from `unassignedSupportHref()` at
 * test time and never retyped.
 */
import { describe, it, expect } from 'vitest'
import { unassignedSupportHref } from '@/modules/admin/dashboard/hrefs'
import {
  parseSupportFilters,
  serializeSupportFilters,
  matchesSupportFilters,
} from '../supportFilters'

function adm06Query(): string {
  return unassignedSupportHref().split('?')[1]
}

function toRecord(query: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(query).entries())
}

describe('parseSupportFilters (T1)', () => {
  it('the ADM-06 query yields unassigned + the active preset', () => {
    expect(parseSupportFilters(toRecord(adm06Query()))).toEqual({
      type: 'all',
      status: 'active',
      assigned: 'unassigned',
    })
  })

  it('drops unknown statuses and de-duplicates', () => {
    expect(parseSupportFilters({ status: 'bogus,open,open' }).status).toBe('open')
    expect(parseSupportFilters({ status: 'bogus' }).status).toBe('all')
  })

  it('open + in_progress in any order is the active preset', () => {
    expect(parseSupportFilters({ status: 'in_progress,open' }).status).toBe('active')
  })

  it('another combination is all', () => {
    expect(parseSupportFilters({ status: 'resolved,closed' }).status).toBe('all')
    expect(parseSupportFilters({ status: 'open,in_progress,resolved' }).status).toBe('all')
  })

  it('one known status is that status', () => {
    expect(parseSupportFilters({ status: 'closed' }).status).toBe('closed')
  })

  it('missing params give the defaults', () => {
    expect(parseSupportFilters({})).toEqual({ type: 'all', status: 'all', assigned: 'all' })
  })

  it('an unknown type or assigned value falls back to all', () => {
    const f = parseSupportFilters({ type: 'other', assigned: 'someone' })
    expect(f.type).toBe('all')
    expect(f.assigned).toBe('all')
  })

  it('handles array values (first one wins)', () => {
    const f = parseSupportFilters({ type: ['user_complaint', 'support'], status: ['resolved', 'open'], assigned: ['unassigned'] })
    expect(f).toEqual({ type: 'user_complaint', status: 'resolved', assigned: 'unassigned' })
  })
})

describe('serializeSupportFilters (T2)', () => {
  it('round-trips the ADM-06 query exactly', () => {
    const query = adm06Query()
    expect(serializeSupportFilters(parseSupportFilters(toRecord(query)))).toBe(query)
  })

  it('omits defaults', () => {
    expect(serializeSupportFilters({ type: 'all', status: 'all', assigned: 'all' })).toBe('')
  })

  it('writes the active preset as open,in_progress', () => {
    expect(toRecord(serializeSupportFilters({ type: 'all', status: 'active', assigned: 'all' }))).toEqual({ status: 'open,in_progress' })
  })

  it('writes type, status and assigned', () => {
    const query = serializeSupportFilters({ type: 'support', status: 'open', assigned: 'unassigned' })
    expect(toRecord(query)).toEqual({ type: 'support', status: 'open', assigned: 'unassigned' })
  })
})

describe('matchesSupportFilters', () => {
  const ticket = { ticket_type: 'support', status: 'open', assigned_to: null as string | null }
  it('applies type, status and assignment together', () => {
    expect(matchesSupportFilters(ticket, { type: 'all', status: 'open', assigned: 'unassigned' })).toBe(true)
    expect(matchesSupportFilters(ticket, { type: 'user_complaint', status: 'all', assigned: 'all' })).toBe(false)
    expect(matchesSupportFilters(ticket, { type: 'all', status: 'closed', assigned: 'all' })).toBe(false)
    expect(matchesSupportFilters({ ...ticket, assigned_to: 'u1' }, { type: 'all', status: 'all', assigned: 'unassigned' })).toBe(false)
  })

  it('the active preset covers open and in_progress only', () => {
    const f = { type: 'all', status: 'active', assigned: 'all' } as const
    expect(matchesSupportFilters({ ...ticket, status: 'in_progress' }, f)).toBe(true)
    expect(matchesSupportFilters({ ...ticket, status: 'resolved' }, f)).toBe(false)
  })
})
