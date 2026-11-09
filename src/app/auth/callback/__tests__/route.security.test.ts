// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S5): GET /auth/callback must never redirect off the site, whatever `next` holds.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let exchangeError: unknown = null
const exchanged: string[] = []
let profiles = 0
vi.mock('@/lib/auth/server', () => ({
  exchangeCodeForSession: vi.fn(async (code: string) => { exchanged.push(code); return { error: exchangeError } }),
  ensureUserProfile: vi.fn(async () => { profiles++ }),
}))

import { GET } from '../route'

const ORIGIN = 'https://lero.al'
const BS = String.fromCharCode(92)
const get = (qs: string) => GET(new NextRequest(`${ORIGIN}/auth/callback?${qs}`))
const location = (r: Response) => new URL(r.headers.get('location') ?? '', ORIGIN)

beforeEach(() => { exchangeError = null; exchanged.length = 0; profiles = 0 })

describe('after a good code', () => {
  it('goes to the requested path of this site and makes sure the profile exists', async () => {
    const res = await get('code=abc&next=/en/cabinet')
    expect(location(res).href).toBe(`${ORIGIN}/en/cabinet`)
    expect(exchanged).toEqual(['abc'])
    expect(profiles).toBe(1)
  })

  it('goes to the home page when there is no next', async () => {
    expect(location(await get('code=abc')).href).toBe(`${ORIGIN}/`)
  })

  it.each([
    ['@evil.example'],
    ['.evil.example'],
    ['//evil.example'],
    [`/${BS}evil.example`],
    ['https://evil.example'],
    ['javascript:alert(1)'],
    ['/%09/evil.example'.replaceAll('%09', '\t')],
  ])('never leaves the site for next=%j', async (next) => {
    const res = await get(`code=abc&next=${encodeURIComponent(next)}`)
    expect(location(res).origin).toBe(ORIGIN)
    expect(location(res).host).toBe('lero.al')
  })
})

describe('after a bad or missing code', () => {
  it('goes to the login page of the locale in next, with the error flag', async () => {
    exchangeError = { message: 'bad' }
    const res = await get('code=abc&next=/uk/cabinet')
    expect(location(res).pathname).toBe('/uk/auth/login')
    expect(location(res).searchParams.get('error')).toBe('auth_callback_failed')
    expect(profiles).toBe(0)
  })

  it('without a code it does not call the exchange and goes to the default locale login', async () => {
    const res = await get('next=/it/x')
    expect(exchanged).toEqual([])
    expect(location(res).pathname).toBe('/it/auth/login')
  })

  it.each([['@evil.example'], ['//evil.example/sq/'], ['https://evil.example/en/']])('an attack in next (%s) still ends on the site login page', async (next) => {
    const res = await get(`next=${encodeURIComponent(next)}`)
    expect(location(res).host).toBe('lero.al')
  })
})
