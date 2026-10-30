/**
 * Task 927 Amendment 10 (D25): the Google sign-in button's window. The real `prepareGoogleAttempt` and `openGoogleAttempt` (Amendment 11) run in jsdom; the doubles are `window.open` (it returns a window with `closed` and
 * `close`, or `null`) and, where a test needs it, a recording `BroadcastChannel` (jsdom has none, and the test pins it to absent otherwise). Google's page is not loaded: the test plays the
 * callback page by dispatching the `message` event that page posts, or by delivering a message on the channel.
 * What it protects: only this origin's callback page, and only for THIS attempt's state, can hand an ID token to the opener; an attempt settles once and leaves no listener, channel, timer
 * or window behind; a window the person closed, a refusal and a silence each end the attempt without a credential.
 */
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { openGoogleAttempt, prepareGoogleAttempt } from '../googlePopup'

const CLIENT_ID = 'zz-synthetic-client.apps.googleusercontent.com'
const TYPE = 'lero:google-sign-in'

class ChannelDouble {
  static instances: ChannelDouble[] = []
  onmessage: ((event: { data: unknown }) => void) | null = null
  closed = false
  constructor(public readonly name: string) { ChannelDouble.instances.push(this) }
  postMessage() {}
  close() { this.closed = true }
  /** What the callback page does on the channel. */
  deliver(data: unknown) { this.onmessage?.({ data }) }
}

const popup = { closed: false, close: vi.fn() }
/** What the container does for a click, with the preparation not yet done: prepares an attempt, then opens its window. */
const requestAttempt = async (request: Parameters<typeof prepareGoogleAttempt>[0]) => openGoogleAttempt(await prepareGoogleAttempt(request))
const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

/** `window.open` double. With `fakeTimers` it switches the timers to fake ones as the window opens: the attempt creates its timers right after, so they are the fake ones. */
function installWindow(options: { fakeTimers?: boolean; blocked?: boolean } = {}) {
  return vi.spyOn(window, 'open').mockImplementation(() => {
    if (options.fakeTimers) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    return options.blocked ? null : (popup as unknown as Window)
  })
}
/** Waits, on real macrotasks, until the attempt has opened its window (the nonce is hashed first). */
async function until(check: () => boolean) {
  for (let turn = 0; turn < 500 && !check(); turn++) await new Promise<void>(resolve => setImmediate(resolve))
  expect(check()).toBe(true)
}
const addressOf = (open: ReturnType<typeof installWindow>, call = 0) => new URL(open.mock.calls[call][0] as string)
/** What the callback page's `window.opener.postMessage` is, seen from the opener. */
const send = (data: unknown, origin: string = window.location.origin) => window.dispatchEvent(new MessageEvent('message', { origin, data }))
const outcomeOf = (attempt: Promise<{ credential: string; nonce: string }>) => attempt.then(result => ({ result }), (error: Error) => ({ error: error.message }))
/** Lets the promise machinery run, so a promise that would settle has settled. */
const flush = async () => { for (let turn = 0; turn < 5; turn++) await Promise.resolve() }

beforeEach(() => {
  popup.closed = false
  popup.close.mockReset()
  ChannelDouble.instances = []
  vi.stubGlobal('BroadcastChannel', undefined)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('opens Google\'s window for this attempt: the address carries the hash of a fresh nonce and a fresh state, and a second attempt gets new ones', async () => {
  const open = installWindow()
  const first = requestAttempt({ clientId: CLIENT_ID, locale: 'uk', loginHint: 'person@example.com' })
  await until(() => open.mock.calls.length === 1)
  const [address, name, features] = open.mock.calls[0]
  expect(name).toBe('lero-google-sign-in')
  expect(features).toBe('popup=yes,width=500,height=640')
  const url = addressOf(open)
  expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  expect([...url.searchParams.keys()], 'exactly these keys, in this order').toEqual(['client_id', 'redirect_uri', 'response_type', 'scope', 'nonce', 'state', 'prompt', 'hl', 'login_hint'])
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    client_id: CLIENT_ID, redirect_uri: `${window.location.origin}/auth/google/callback`, response_type: 'id_token', scope: 'openid email profile', prompt: 'select_account', hl: 'uk', login_hint: 'person@example.com',
  })
  expect(url.searchParams.get('nonce')).toMatch(/^[0-9a-f]{64}$/)
  expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/)

  send({ type: TYPE, state: url.searchParams.get('state'), credential: 'zz.synthetic.first' })
  const answered = await first
  expect(answered.credential).toBe('zz.synthetic.first')
  expect(sha256Hex(answered.nonce), 'Google got the SHA-256 hex of the raw nonce the caller gets').toBe(url.searchParams.get('nonce'))
  expect(String(address), 'Google did not get the raw nonce').not.toContain(encodeURIComponent(answered.nonce))

  const second = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
  await until(() => open.mock.calls.length === 2)
  const next = addressOf(open, 1)
  expect([...next.searchParams.keys()], 'no login_hint when none is given').not.toContain('login_hint')
  expect(next.searchParams.get('state')).not.toBe(url.searchParams.get('state'))
  expect(next.searchParams.get('nonce')).not.toBe(url.searchParams.get('nonce'))
  send({ type: TYPE, state: next.searchParams.get('state'), credential: 'zz.synthetic.second' })
  await second
})

it('a browser that refuses the window ends the attempt with popup_blocked', async () => {
  const open = installWindow({ blocked: true })
  const outcome = await outcomeOf(requestAttempt({ clientId: CLIENT_ID, locale: 'en' }))
  expect(open).toHaveBeenCalledTimes(1)
  expect(outcome).toEqual({ error: 'popup_blocked' })
})

it('[SEC-927-FE-POPUP-DENY-ORIGIN] a credential posted from another origin is ignored', async () => {
  const open = installWindow()
  const attempt = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
  await until(() => open.mock.calls.length === 1)
  const state = addressOf(open).searchParams.get('state')
  let settled = false
  void attempt.then(() => { settled = true }, () => { settled = true })

  send({ type: TYPE, state, credential: 'zz.synthetic.forged' }, 'https://evil.example')
  await flush()
  expect(settled, 'the message of another origin settles nothing').toBe(false)
  expect(popup.close).not.toHaveBeenCalled()

  send({ type: TYPE, state, credential: 'zz.synthetic.idtoken' })
  const answered = await attempt
  expect(answered.credential).toBe('zz.synthetic.idtoken')
  expect(sha256Hex(answered.nonce)).toBe(addressOf(open).searchParams.get('nonce'))
})

it('[SEC-927-FE-POPUP-DENY-STATE] a credential carrying another state is ignored on both channels', async () => {
  const channelOf = () => ChannelDouble.instances[0]
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  const open = installWindow()
  const attempt = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
  await until(() => open.mock.calls.length === 1)
  const state = addressOf(open).searchParams.get('state')
  let settled = false
  void attempt.then(() => { settled = true }, () => { settled = true })

  send({ type: TYPE, state: 'another-state', credential: 'zz.synthetic.stale' })
  send({ type: TYPE, credential: 'zz.synthetic.nostate' })
  send({ type: 'another-type', state, credential: 'zz.synthetic.type' })
  channelOf().deliver({ type: TYPE, state: 'another-state', credential: 'zz.synthetic.stale' })
  channelOf().deliver({ type: TYPE, credential: 'zz.synthetic.nostate' })
  channelOf().deliver('a string')
  channelOf().deliver(null)
  await flush()
  expect(settled, 'nothing of another attempt settles this one').toBe(false)

  send({ type: TYPE, state, credential: 'zz.synthetic.idtoken' })
  await expect(attempt).resolves.toMatchObject({ credential: 'zz.synthetic.idtoken' })
})

it('[SEC-927-FE-POPUP-CHANNEL] the attempt completes through the broadcast channel when no window message arrives', async () => {
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  const sinks = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined))
  const open = installWindow()
  const attempt = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
  await until(() => open.mock.calls.length === 1)
  expect(ChannelDouble.instances).toHaveLength(1)
  expect(ChannelDouble.instances[0].name).toBe('lero-google-sign-in')

  ChannelDouble.instances[0].deliver({ type: TYPE, state: addressOf(open).searchParams.get('state'), credential: 'zz.synthetic.idtoken.channel' })
  const answered = await attempt
  expect(answered.credential).toBe('zz.synthetic.idtoken.channel')
  expect(sha256Hex(answered.nonce)).toBe(addressOf(open).searchParams.get('nonce'))
  expect(ChannelDouble.instances[0].closed, 'the channel is closed once the attempt settled').toBe(true)
  expect(popup.close, 'and so is the window').toHaveBeenCalledTimes(1)

  const everything = JSON.stringify([sinks.flatMap(sink => sink.mock.calls.map(call => call.map(String))), Object.entries({ ...sessionStorage }), Object.entries({ ...localStorage }), window.location.href, document.cookie])
  expect(everything).not.toContain('zz.synthetic.idtoken.channel')
  expect(everything).not.toContain(answered.nonce)
})

it('[SEC-927-FE-POPUP-CANCEL] a closed window, a refusal, an error and a timeout each end the attempt without a credential', async () => {
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)   // jsdom has no focused element, so it says the page has no focus; a person who closed the window is back on this page
  const removed = vi.spyOn(window, 'removeEventListener')
  const scenarios: { label: string; expected: string; play: (state: string | null) => Promise<void> }[] = [
    { label: 'the window is closed', expected: 'cancelled', play: async () => { popup.closed = true; await vi.advanceTimersByTimeAsync(500) } },
    { label: 'Google refuses (access_denied)', expected: 'cancelled', play: async state => { send({ type: TYPE, state, error: 'access_denied' }) } },
    { label: 'Google reports an error (server_error)', expected: 'google_error', play: async state => { send({ type: TYPE, state, error: 'server_error' }) } },
    { label: 'nobody answers for 5 minutes', expected: 'timeout', play: async () => { await vi.advanceTimersByTimeAsync(5 * 60 * 1000) } },
  ]
  for (const scenario of scenarios) {
    popup.closed = false; popup.close.mockReset(); removed.mockClear(); ChannelDouble.instances = []
    const open = installWindow({ fakeTimers: true })
    const attempt = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
    const outcome = outcomeOf(attempt)
    await until(() => open.mock.calls.length === 1)
    await scenario.play(addressOf(open).searchParams.get('state'))

    expect(await outcome, scenario.label).toEqual({ error: scenario.expected })
    expect(popup.close, `${scenario.label}: the window is closed`).toHaveBeenCalled()
    expect(removed.mock.calls.some(([type]) => type === 'message'), `${scenario.label}: the listener is removed`).toBe(true)
    expect(ChannelDouble.instances[0].closed, `${scenario.label}: the channel is closed`).toBe(true)
    expect(vi.getTimerCount(), `${scenario.label}: no timer is left`).toBe(0)
    vi.useRealTimers()
    open.mockRestore()
  }
})

it('[SEC-927-FE-POPUP-FOCUS] a closed window ends the attempt only once this page has focus again', async () => {
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
  const open = installWindow({ fakeTimers: true })
  const outcome = outcomeOf(requestAttempt({ clientId: CLIENT_ID, locale: 'en' }))
  await until(() => open.mock.calls.length === 1)
  let settled = false
  void outcome.then(() => { settled = true })

  popup.closed = true   // the window reads as closed while the person may still be on Google's page
  await vi.advanceTimersByTimeAsync(2000)   // four polls, the page has no focus
  expect(settled, 'a closed window ends nothing while this page has no focus').toBe(false)
  expect(popup.close, 'and nothing is closed or cleaned up yet').not.toHaveBeenCalled()
  expect(vi.getTimerCount(), 'the attempt is still waiting').toBeGreaterThan(0)

  focus.mockReturnValue(true)   // the person is back on this page
  await vi.advanceTimersByTimeAsync(500)
  expect(await outcome).toEqual({ error: 'cancelled' })
  expect(popup.close, 'the window is closed once the attempt ended').toHaveBeenCalled()
  expect(vi.getTimerCount(), 'no timer is left').toBe(0)
})

it('[SEC-927-FE-POPUP-ONCE] an attempt settles once and ignores the same credential again', async () => {
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  const removed = vi.spyOn(window, 'removeEventListener')
  const open = installWindow()
  const attempt = requestAttempt({ clientId: CLIENT_ID, locale: 'en' })
  await until(() => open.mock.calls.length === 1)
  const message = { type: TYPE, state: addressOf(open).searchParams.get('state'), credential: 'zz.synthetic.idtoken' }

  send(message)
  const answered = await attempt
  expect(answered.credential).toBe('zz.synthetic.idtoken')
  expect(removed.mock.calls.filter(([type]) => type === 'message'), 'the listener is removed once the attempt settled').toHaveLength(1)
  expect(ChannelDouble.instances[0].onmessage, 'and so is the channel\'s').toBeNull()

  send(message)
  send({ ...message, credential: 'zz.synthetic.second' })
  ChannelDouble.instances[0].deliver(message)
  await flush()
  expect(popup.close, 'the window was closed once').toHaveBeenCalledTimes(1)
  expect(removed.mock.calls.filter(([type]) => type === 'message'), 'nothing was removed or added again').toHaveLength(1)
  await expect(attempt, 'the settled promise still holds its first answer').resolves.toBe(answered)
})
