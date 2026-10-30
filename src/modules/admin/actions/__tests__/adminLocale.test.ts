// @vitest-environment node
/**
 * The admin interface language (Task 923 Revision 7): the cookie is httpOnly, only one of the four supported codes is ever stored or used, and the
 * language saved on the profile belongs to the signed-in person only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let cookieValue: string | undefined
const setCookie = vi.fn()
const requestLocale = vi.fn()
let dbThrows = false
vi.mock('next/headers', () => ({ cookies: async () => ({ set: setCookie, get: (n: string) => (n === 'admin-locale' && cookieValue !== undefined ? { value: cookieValue } : undefined) }) }))
vi.mock('next-intl/server', () => ({ setRequestLocale: (l: string) => requestLocale(l) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => { if (dbThrows) throw new Error('db down'); return db.client } }))
// `requireViewer()` (Task 923 R44) reads the signed-in person's own `users` row with the service role: the same in-memory database answers it
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => db.client.from(t) }) }))

import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { setAdminLocale } from '../locale'

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'u1', preferred_locale: 'sq', status: 'active' }, { id: 'u2', preferred_locale: 'sq', status: 'active' }] })
  currentUser = { id: 'u1' }
  cookieValue = undefined
  dbThrows = false
  setCookie.mockClear()
  requestLocale.mockClear()
})

describe('getAdminLocale', () => {
  it.each(['sq', 'en', 'uk', 'it'])('uses the cookie value %s and tells next-intl', async (l) => {
    cookieValue = l
    expect(await getAdminLocale()).toBe(l)
    expect(requestLocale).toHaveBeenCalledWith(l)
  })

  it.each([[undefined], [''], ['xx'], ['EN'], ['en '], ['../../etc'], ['__proto__'], ['<script>']])('the cookie value %j falls back to English', async (v) => {
    cookieValue = v
    expect(await getAdminLocale()).toBe('en')
    expect(requestLocale).toHaveBeenCalledWith('en')
  })
})

describe('setAdminLocale', () => {
  it('stores a supported language in an httpOnly, lax, year-long cookie and on the signed-in person\'s profile only', async () => {
    await setAdminLocale('uk')
    expect(setCookie).toHaveBeenCalledWith('admin-locale', 'uk', { httpOnly: true, sameSite: 'lax', maxAge: 31536000, path: '/' })
    expect(db.tables.users.find((u) => u.id === 'u1')?.preferred_locale).toBe('uk')
    expect(db.tables.users.find((u) => u.id === 'u2')?.preferred_locale).toBe('sq')
    expect(db.log.find((l) => l.op === 'update')?.filters).toEqual([['id', 'eq', 'u1']])
  })

  it.each([['xx'], [''], ['EN'], ['sq,en'], ['en; Path=/; Domain=evil.com'], ['__proto__'], [undefined as unknown as string]])('refuses %j: no cookie, no database write', async (v) => {
    await setAdminLocale(v)
    expect(setCookie).not.toHaveBeenCalled()
    expect(db.log).toEqual([])
  })

  it('an anonymous visitor gets the cookie but nothing is written to any profile', async () => {
    currentUser = null
    await setAdminLocale('it')
    expect(setCookie).toHaveBeenCalled()
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
  })

  it('a database failure does not undo the language switch', async () => {
    dbThrows = true
    await expect(setAdminLocale('it')).resolves.toBeUndefined()
    expect(setCookie).toHaveBeenCalled()
  })
})
