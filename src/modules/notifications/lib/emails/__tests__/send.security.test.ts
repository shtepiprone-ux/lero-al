// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S34): sendEmail is the one door every outgoing message goes through.
 *  - the recipient and the reply-to are exactly one plain address (no "a@x.com, b@y.com", no line break that adds a header);
 *  - the subject, which carries text a stranger wrote, is one line;
 *  - without a key nothing is sent and nothing throws; the provider's failures are mapped to a code and never rethrown.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sent: Record<string, unknown>[] = []
let providerAnswer: { data?: { id: string }; error?: { statusCode?: number; message?: string } } = { data: { id: 'm1' } }
vi.mock('resend', () => ({ Resend: class { emails = { send: async (p: Record<string, unknown>) => { sent.push(p); return providerAnswer } } } }))
vi.mock('@react-email/components', () => ({ render: async () => '<p>rendered</p>' }))

import { FROM_ADDRESS, sendEmail } from '../send'

const ENV = { ...process.env }
beforeEach(() => {
  sent.length = 0
  providerAnswer = { data: { id: 'm1' } }
  process.env.RESEND_API_KEY = 're_key'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllEnvs() })

const base = { to: 'ana@example.com', subject: 'Hello', html: '<p>x</p>' }

describe('recipients', () => {
  it('sends to one plain address from the default sender', async () => {
    expect(await sendEmail(base)).toEqual({ id: 'm1' })
    expect(sent[0]).toMatchObject({ from: FROM_ADDRESS, to: 'ana@example.com', subject: 'Hello', html: '<p>x</p>' })
    expect('replyTo' in sent[0]).toBe(false)
  })

  it.each([
    ['two addresses', 'a@x.com, b@y.com'],
    ['a semicolon list', 'a@x.com;b@y.com'],
    ['a display name', 'Ana <a@x.com>'],
    ['a line break that adds a header', 'a@x.com\r\nBcc: spy@evil.com'],
    ['a space', 'a@x.com b@y.com'],
    ['no at sign', 'not-an-address'],
    ['an empty string', ''],
    ['a quote', '"a"@x.com'],
  ])('refuses %s as the recipient and sends nothing', async (_l, to) => {
    expect(await sendEmail({ ...base, to })).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it.each([['a@x.com, b@y.com'], ['a@x.com\nBcc: spy@evil.com'], ['Name <a@x.com>']])('refuses %j as the reply-to and sends nothing', async (replyTo) => {
    expect(await sendEmail({ ...base, replyTo })).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it('a plain reply-to is passed on', async () => {
    await sendEmail({ ...base, replyTo: 'support@lero.al' })
    expect(sent[0].replyTo).toBe('support@lero.al')
  })

  it('refuses a sender override that contains a line break', async () => {
    expect(await sendEmail({ ...base, from: 'Lero.al <a@lero.al>\r\nBcc: x@y.z' })).toEqual({ error: 'send_failed' })
    expect(sent).toEqual([])
  })

  it('accepts a normal sender override', async () => {
    await sendEmail({ ...base, from: 'Lero.al <support@lero.al>' })
    expect(sent[0].from).toBe('Lero.al <support@lero.al>')
  })
})

describe('subject', () => {
  it.each([
    ['Hi\r\nBcc: spy@evil.com', 'Hi Bcc: spy@evil.com'],
    ['Hi\nthere', 'Hi there'],
    ['Hi there', 'Hi there'],
    ['  padded  ', 'padded'],
  ])('%j is sent on one line as %j', async (subject, expected) => {
    await sendEmail({ ...base, subject })
    expect(sent[0].subject).toBe(expected)
  })

  it('keeps other languages intact', async () => {
    await sendEmail({ ...base, subject: 'Përgjigje — Відповідь' })
    expect(sent[0].subject).toBe('Përgjigje — Відповідь')
  })
})

describe('content and key', () => {
  it('without a key nothing is sent and nothing throws: development skips quietly, every other environment reports the failure (Task 923 R66 (h))', async () => {
    delete process.env.RESEND_API_KEY
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'development')
    expect(await sendEmail(base)).toEqual({})
    for (const env of ['production', 'test']) {
      vi.stubEnv('NODE_ENV', env)
      expect(await sendEmail(base), env).toEqual({ error: 'send_failed' })
    }
    expect(sent).toEqual([])
  })

  it('without a key it logs only in development, and never the message body', async () => {
    delete process.env.RESEND_API_KEY
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info')
    info.mockClear()   // the spy of beforeEach outlives a test; the previous test's development call must not count here
    vi.stubEnv('NODE_ENV', 'production')
    await sendEmail(base)
    expect(info).not.toHaveBeenCalled()
    vi.stubEnv('NODE_ENV', 'development')
    await sendEmail(base)
    expect(JSON.stringify(info.mock.calls)).not.toContain('<p>x</p>')
    expect(info).toHaveBeenCalledTimes(1)
  })

  it('needs html or a react element', async () => {
    expect(await sendEmail({ to: 'a@x.com', subject: 's' })).toEqual({ error: 'missing_content' })
    expect(sent).toEqual([])
  })

  it('renders a react element when there is no html', async () => {
    await sendEmail({ to: 'a@x.com', subject: 's', react: {} as never })
    expect(sent[0].html).toBe('<p>rendered</p>')
  })
})

describe('provider failures are mapped, never thrown', () => {
  it.each([
    [{ statusCode: 403, message: 'x' }, 'unverified_sender'],
    [{ statusCode: 422, message: 'The domain is not verified' }, 'unverified_sender'],
    [{ statusCode: 422, message: 'Sender must be verified' }, 'unverified_sender'],
    [{ statusCode: 422, message: 'You are not allowed to send' }, 'unverified_sender'],
    [{ statusCode: 500, message: 'oops' }, 'transient'],
    [{ statusCode: 503, message: 'oops' }, 'transient'],
    [{ statusCode: 429, message: 'slow down' }, 'transient'],
    [{ statusCode: 422, message: 'invalid' }, 'send_failed'],
    [{ message: 'unknown' }, 'send_failed'],
    [{}, 'send_failed'],
  ])('%j becomes %s', async (error, code) => {
    providerAnswer = { error }
    expect(await sendEmail(base)).toEqual({ error: code })
  })
})

// Task 923 R38 (case SEC-S34-SRV-DENY)
it('[SEC-S34-SRV-DENY] An e-mail has exactly one plain recipient and reply-to address and a one-line sender and subject', async () => {
  expect(await sendEmail({ ...base, to: 'a@x.com, b@y.com' })).toEqual({ error: 'send_failed' })
  expect(await sendEmail({ ...base, to: 'a@x.com\r\nBcc: spy@evil.com' })).toEqual({ error: 'send_failed' })
  expect(await sendEmail({ ...base, replyTo: 'Name <a@x.com>' })).toEqual({ error: 'send_failed' })
  expect(await sendEmail({ ...base, from: 'Lero.al <a@lero.al>\r\nBcc: x@y.z' })).toEqual({ error: 'send_failed' })
  expect(sent).toEqual([])
  await sendEmail({ ...base, subject: 'Hello\r\nBcc: spy@evil.com' })                  // a line break in the subject never becomes a header
  expect(String(sent[0].subject)).not.toMatch(/[\r\n]/)
  expect(await sendEmail(base)).toEqual({ id: 'm1' })                                  // the control
})
