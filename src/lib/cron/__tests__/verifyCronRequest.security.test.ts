// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S18): the cron secret check fails closed and compares in constant time.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { verifyCronRequest } from '../verifyCronRequest'

const saved = process.env.CRON_SECRET
const req = (authorization?: string) => new Request('https://lero.al/api/cron/x', { headers: authorization === undefined ? {} : { authorization } })
beforeEach(() => { process.env.CRON_SECRET = 'correct-horse-battery-staple' })
afterEach(() => { if (saved === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = saved })

describe('verifyCronRequest', () => {
  it('accepts exactly "Bearer <secret>"', () => {
    expect(verifyCronRequest(req('Bearer correct-horse-battery-staple')).ok).toBe(true)
  })

  it.each([
    [undefined],
    [''],
    ['Bearer '],
    ['Bearer'],
    ['correct-horse-battery-staple'],
    ['bearer correct-horse-battery-staple'],
    ['Bearer correct-horse-battery-stapl'],
    ['Bearer correct-horse-battery-staple!'],
    ['Bearer  correct-horse-battery-staple'],
    ['Bearer correct-horse-battery-staplE'],
    ['Basic correct-horse-battery-staple'],
  ])('refuses the header %j with 401', async (header) => {
    const r = verifyCronRequest(req(header))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(401)
      expect(await r.response.json()).toEqual({ error: 'unauthorized' })
    }
  })

  it.each([[undefined], ['']])('fails closed when CRON_SECRET is %j: even an empty bearer is refused', (value) => {
    if (value === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = value
    expect(verifyCronRequest(req('Bearer ')).ok).toBe(false)
    expect(verifyCronRequest(req('Bearer undefined')).ok).toBe(false)
    expect(verifyCronRequest(req(undefined)).ok).toBe(false)
  })

  it('the refusal does not say whether the secret was missing or wrong', async () => {
    const wrong = verifyCronRequest(req('Bearer nope'))
    delete process.env.CRON_SECRET
    const missing = verifyCronRequest(req('Bearer nope'))
    if (!wrong.ok && !missing.ok) expect(await wrong.response.text()).toBe(await missing.response.text())
  })

  it('uses a constant-time comparison (source check)', async () => {
    const { readFileSync } = await import('node:fs')
    // the CALL, not only the import
    expect(readFileSync('src/lib/cron/verifyCronRequest.ts', 'utf8')).toMatch(/timingSafeEqual\(\s*\w+,\s*\w+\s*\)/)
  })
})

// Task 923 R38 (case SEC-S18-SRV-DENY)
it('[SEC-S18-SRV-DENY] A cron request runs only with the exact secret, compared in constant time', async () => {
  for (const header of ['Bearer correct-horse-battery-staplE', undefined] as const) {          // a wrong secret of the same length, and a missing header
    const r = verifyCronRequest(req(header))
    expect(r.ok, String(header)).toBe(false)
    if (!r.ok) expect(r.response.status).toBe(401)
  }
  expect(verifyCronRequest(req('Bearer correct-horse-battery-staple')).ok).toBe(true)           // the control
  const { readFileSync } = await import('node:fs')
  expect(readFileSync('src/lib/cron/verifyCronRequest.ts', 'utf8')).toContain('timingSafeEqual')
})
