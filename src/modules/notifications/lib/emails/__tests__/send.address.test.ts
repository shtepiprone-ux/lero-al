// @vitest-environment node
/**
 * Task 951 AC4 (CodeQL js/polynomial-redos): the recipient check runs on an address a stranger can type. It must stay linear, allow exactly one "@" and refuse an
 * oversized value before any pattern runs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sent: Record<string, unknown>[] = []
vi.mock('resend', () => ({ Resend: class { emails = { send: async (p: Record<string, unknown>) => { sent.push(p); return { data: { id: 'm1' } } } } } }))
vi.mock('@react-email/components', () => ({ render: async () => '<p>rendered</p>' }))

import { sendEmail } from '../send'

const ENV = { ...process.env }
beforeEach(() => {
  sent.length = 0
  process.env.RESEND_API_KEY = 're_key'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { process.env = { ...ENV }; vi.restoreAllMocks() })

const base = { subject: 'Hello', html: '<p>x</p>' }

describe('the recipient address check is linear and allows exactly one "@"', () => {
  it('"!@" repeated 50,000 times is refused as send_failed in under 100 ms', async () => {
    const hostile = '!@'.repeat(50000)
    const started = performance.now()
    const result = await sendEmail({ ...base, to: hostile })
    expect(performance.now() - started).toBeLessThan(100)
    expect(result).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it('the same input as reply-to is refused just as fast', async () => {
    const started = performance.now()
    const result = await sendEmail({ ...base, to: 'ana@example.com', replyTo: '!@'.repeat(50000) })
    expect(performance.now() - started).toBeLessThan(100)
    expect(result).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it('an address over 254 characters is refused even when it is well formed', async () => {
    const result = await sendEmail({ ...base, to: `${'a'.repeat(250)}@example.com` })
    expect(result).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it.each([['a@b@c'], ['a@b, c@d'], ['@'], ['a@'], ['@b']])('%j is refused', async (to) => {
    expect(await sendEmail({ ...base, to })).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it('name@example.com passes', async () => {
    expect(await sendEmail({ ...base, to: 'name@example.com' })).toEqual({ id: 'm1' })
    expect(sent[0].to).toBe('name@example.com')
  })
})
