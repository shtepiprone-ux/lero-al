// @vitest-environment node
/**
 * Task 988 AC3: `refreshSession` gives the proxy the account language of the signed-in person.
 *  - It reads `preferred_locale` of the caller's OWN row (`.eq('id', <the session's user id>)`), with the same session client (RLS `users_self_read`), and only
 *    after `getUser()`: nothing runs between `createServerClient` and `getUser()`, which refreshes the session.
 *  - Only one of the four codes is an account language; anything else, no row, a failed read or no user is `null`, and no read runs without a user.
 *  - A refused account (`user_banned`, `user_not_found`) is signed out as before and has no account language.
 * The Supabase SDK is the double; every value is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  order: [] as string[],
  user: { id: 'u-synth-1' } as { id: string } | null,
  error: null as null | { code: string },
  row: { preferred_locale: 'uk' } as unknown,
  readError: null as unknown,
  throws: false,
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => {
    state.order.push('create')
    return {
      auth: {
        getUser: async () => { state.order.push('getUser'); return { data: { user: state.user }, error: state.error } },
        signOut: async () => { state.order.push('signOut'); return { error: null } },
      },
      from: (table: string) => {
        state.order.push(`from:${table}`)
        const chain = {
          select: (columns: string) => { state.order.push(`select:${columns}`); return chain },
          eq: (column: string, value: unknown) => { state.order.push(`eq:${column}:${String(value)}`); return chain },
          maybeSingle: async () => {
            state.order.push('maybeSingle')
            if (state.throws) throw new Error('network')
            return { data: state.row, error: state.readError }
          },
        }
        return chain
      },
    }
  },
}))

import { refreshSession } from '../middleware'

const request = () => new NextRequest('https://lero.al/sq/x')

beforeEach(() => {
  state.order = []
  state.user = { id: 'u-synth-1' }
  state.error = null
  state.row = { preferred_locale: 'uk' }
  state.readError = null
  state.throws = false
})

describe('refreshSession account language', () => {
  it('[AC3] reads only the caller\'s own row, after getUser(), and returns the account language with the response', async () => {
    const result = await refreshSession(request())
    expect(result.accountLocale).toBe('uk')
    expect(result.response.headers.get('x-middleware-next')).toBe('1')
    expect(state.order).toEqual(['create', 'getUser', 'from:users', 'select:preferred_locale', 'eq:id:u-synth-1', 'maybeSingle'])
  })

  it.each(['sq', 'en', 'uk', 'it'])('[AC3] the code %s is an account language', async (code) => {
    state.row = { preferred_locale: code }
    expect((await refreshSession(request())).accountLocale).toBe(code)
  })

  it.each([[null], [{ preferred_locale: null }], [{ preferred_locale: 'UK' }], [{ preferred_locale: 'xx' }], [{ preferred_locale: '' }], [{ preferred_locale: 'uk ' }], [{ preferred_locale: ['uk'] }], [{ preferred_locale: '//evil.com' }]])(
    '[SEC-988-PROXY-LOCALE-DENY] the row %j gives no account language', async (row) => {
      state.row = row
      expect((await refreshSession(request())).accountLocale).toBeNull()
    })

  it('[AC3] a failed read gives no account language and never fails the request', async () => {
    state.readError = { code: '500' }
    expect((await refreshSession(request())).accountLocale).toBeNull()
    state.readError = null
    state.throws = true
    expect((await refreshSession(request())).accountLocale).toBeNull()
  })

  it('[AC3] a guest has no account language and no row is read', async () => {
    state.user = null
    const result = await refreshSession(request())
    expect(result.accountLocale).toBeNull()
    expect(state.order).toEqual(['create', 'getUser'])
  })

  it.each(['user_banned', 'user_not_found'])('[AC3] a refused account (%s) is signed out and has no account language', async (code) => {
    state.user = null
    state.error = { code }
    const result = await refreshSession(request())
    expect(result.accountLocale).toBeNull()
    expect(state.order).toEqual(['create', 'getUser', 'signOut'])
  })
})
