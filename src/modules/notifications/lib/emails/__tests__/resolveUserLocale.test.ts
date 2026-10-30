// @vitest-environment node
/**
 * resolveUserLocale (deprecated: Task 251 made every outgoing e-mail Albanian, but the function is kept for the day the policy is reversed). It must still return
 * one of the four languages whatever the profile or the request contains, and never throw.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let dbThrows = false
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { if (dbThrows) throw new Error('down'); return db.client } }))

import { resolveUserLocale } from '../resolveUserLocale'

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'u1', preferred_locale: 'it' }, { id: 'u2', preferred_locale: 'xx' }, { id: 'u3', preferred_locale: null }] })
  dbThrows = false
})

describe('resolveUserLocale', () => {
  it('the profile language comes first', async () => {
    expect(await resolveUserLocale('u1', 'en')).toBe('it')
    expect(db.log[0].filters).toEqual([['id', 'eq', 'u1']])
  })

  it.each([['u2'], ['u3'], ['nobody']])('a profile (%s) without a usable language falls back to the request language', async (id) => {
    expect(await resolveUserLocale(id, 'uk')).toBe('uk')
  })

  it.each([[undefined], ['xx'], ['EN'], ['<script>']])('and then to Albanian when the request language is %j', async (requested) => {
    expect(await resolveUserLocale('u3', requested as never)).toBe('sq')
  })

  it('a database failure falls back the same way and does not throw', async () => {
    dbThrows = true
    expect(await resolveUserLocale('u1', 'en')).toBe('en')
    expect(await resolveUserLocale('u1')).toBe('sq')
  })
})
