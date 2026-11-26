// @vitest-environment node
/**
 * The interface language (Task 923 Revision 7; Task 988 AC5, owner decisions O988-1, O988-3, O988-5).
 *  - `setAccountLocale(locale)` writes the account language (`users.preferred_locale`) of the signed-in caller's OWN row only, and sets the session language cookie
 *    `lero_ui_locale` for every caller, guest or signed in: a session cookie (no Max-Age, no Expires), `Path=/`, `SameSite=Lax`, `HttpOnly`. It returns whether the
 *    account row was written. The `admin-locale` cookie is no longer written.
 *  - SEC-988-ACCOUNT-LOCALE-DENY: only the four exact codes are accepted; any other value (a wrong case, an unknown code, a cookie-attribute injection, an object, a
 *    missing value) writes no row and sets no cookie.
 *  - `getAdminLocale()` is next-intl's request locale (the `[locale]` slug of the address), never a cookie.
 * The cookie jar, next-intl's request locale, the identity and the database are doubles; every id is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let requestLocale = 'uk'
const setCookie = vi.fn()
let dbThrows = false
vi.mock('next/headers', () => ({ cookies: async () => ({ set: setCookie, get: (n: string) => (n === 'admin-locale' ? { value: 'it' } : undefined) }) }))
vi.mock('next-intl/server', () => ({ getLocale: async () => requestLocale, setRequestLocale: () => undefined }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => { if (dbThrows) throw new Error('db down'); return db.client } }))
// `requireViewer()` (Task 923 R44) reads the signed-in person's own `users` row with the service role: the same in-memory database answers it
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => db.client.from(t) }) }))

import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { setAccountLocale } from '../locale'

const SESSION_COOKIE = { path: '/', sameSite: 'lax', httpOnly: true, secure: false }

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'u1', preferred_locale: 'sq', status: 'active' }, { id: 'u2', preferred_locale: 'sq', status: 'active' }] })
  currentUser = { id: 'u1' }
  requestLocale = 'uk'
  dbThrows = false
  setCookie.mockClear()
})

describe('getAdminLocale', () => {
  it.each(['sq', 'en', 'uk', 'it'])('[AC5] is the request locale %s of the address, never the admin-locale cookie', async (l) => {
    requestLocale = l
    expect(await getAdminLocale()).toBe(l)
  })
})

describe('setAccountLocale', () => {
  it('[AC5] writes the signed-in caller\'s own row only, sets the session language cookie, and says it wrote', async () => {
    expect(await setAccountLocale('uk')).toBe(true)
    expect(db.tables.users.find((u) => u.id === 'u1')?.preferred_locale).toBe('uk')
    expect(db.tables.users.find((u) => u.id === 'u2')?.preferred_locale).toBe('sq')
    expect(db.log.filter((l) => l.op === 'update').map((l) => l.filters)).toEqual([[['id', 'eq', 'u1']]])
    expect(setCookie).toHaveBeenCalledTimes(1)
    expect(setCookie).toHaveBeenCalledWith('lero_ui_locale', 'uk', SESSION_COOKIE)
  })

  it('[AC5] the session cookie has no Max-Age and no Expires, and no admin-locale cookie is set', async () => {
    await setAccountLocale('it')
    for (const [name, , options] of setCookie.mock.calls as [string, string, Record<string, unknown>][]) {
      expect(name).not.toBe('admin-locale')
      expect(options).not.toHaveProperty('maxAge')
      expect(options).not.toHaveProperty('expires')
    }
  })

  it('[AC5] the cookie is Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      await setAccountLocale('en')
      expect(setCookie).toHaveBeenCalledWith('lero_ui_locale', 'en', { ...SESSION_COOKIE, secure: true })
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('[AC5] a guest gets the session language cookie and no row is written', async () => {
    currentUser = null
    expect(await setAccountLocale('it')).toBe(false)
    expect(setCookie).toHaveBeenCalledWith('lero_ui_locale', 'it', SESSION_COOKIE)
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
  })

  it('[AC5] a database failure keeps the session language and says nothing was written', async () => {
    dbThrows = true
    expect(await setAccountLocale('it')).toBe(false)
    expect(setCookie).toHaveBeenCalledWith('lero_ui_locale', 'it', SESSION_COOKIE)
  })

  it.each([['UK'], ['xx'], ['uk; x'], [''], ['EN'], ['sq,en'], ['en; Path=/; Domain=evil.com'], ['__proto__'], [{ toString: (): string => 'uk' }], [['uk']], [null], [undefined]])(
    '[SEC-988-ACCOUNT-LOCALE-DENY] refuses %j: no row, no cookie', async (v) => {
      expect(await setAccountLocale(v as unknown as string)).toBe(false)
      expect(setCookie).not.toHaveBeenCalled()
      expect(db.log.filter((l) => l.op === 'update')).toEqual([])
    })
})
