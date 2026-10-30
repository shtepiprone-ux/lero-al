/**
 * Task 927 Amendment 10 (D25): the page Google returns the sign-in window to. The real `GoogleCallbackRelay` renders; the doubles are `window.opener`, `window.close` (jsdom would close
 * its own window) and a recording `BroadcastChannel` (jsdom has none). The test plays Google by setting the address fragment the page is opened with.
 * What it protects: Google's ID token goes to the opening window of THIS origin and on the channel only when the answer carries a state, never to `*`; it is removed from the address; it
 * reaches no console and no storage; a refusal at Google is relayed as an error without a credential; the window always closes.
 */
import { cleanup, render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { GoogleCallbackRelay } from '../GoogleCallbackRelay'

const PATH = '/auth/google/callback'
const TOKEN = 'zz.synthetic.idtoken'
const TYPE = 'lero:google-sign-in'

class ChannelDouble {
  static instances: ChannelDouble[] = []
  readonly posted: unknown[] = []
  closed = false
  constructor(public readonly name: string) { ChannelDouble.instances.push(this) }
  postMessage(data: unknown) { this.posted.push(data) }
  close() { this.closed = true }
}

const opener = { postMessage: vi.fn() }
let close: ReturnType<typeof vi.spyOn>

/** What Google does: returns the window to the callback address with its answer in the fragment. */
function arriveWith(fragment: string) {
  window.history.replaceState(null, '', `${PATH}${fragment}`)
}
const renderRelay = () => render(<MantineProvider theme={theme} env="test"><GoogleCallbackRelay /></MantineProvider>)

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  opener.postMessage.mockReset()
  ChannelDouble.instances = []
  Object.defineProperty(window, 'opener', { value: opener, configurable: true, writable: true })
  close = vi.spyOn(window, 'close').mockImplementation(() => undefined)
  vi.stubGlobal('BroadcastChannel', ChannelDouble)
  sessionStorage.clear(); localStorage.clear()
})
afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'opener', { value: null, configurable: true, writable: true })
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

it('[SEC-927-FE-CALLBACK-RELAY] the callback page posts Google\'s ID token to this origin only, clears it from the address and closes the window', () => {
  arriveWith(`#id_token=${TOKEN}&state=s1`)
  const replaceState = vi.spyOn(window.history, 'replaceState')
  renderRelay()

  const message = { type: TYPE, state: 's1', credential: TOKEN }
  expect(opener.postMessage).toHaveBeenCalledTimes(1)
  expect(opener.postMessage).toHaveBeenCalledWith(message, window.location.origin)
  expect(opener.postMessage.mock.calls[0][1], 'never the target origin *').not.toBe('*')
  expect(ChannelDouble.instances).toHaveLength(1)
  expect(ChannelDouble.instances[0].name).toBe('lero-google-sign-in')
  expect(ChannelDouble.instances[0].posted).toEqual([message])
  expect(ChannelDouble.instances[0].closed, 'the channel is closed after it posted').toBe(true)
  expect(replaceState).toHaveBeenCalledWith(null, '', PATH)
  expect(window.location.hash, 'the token is gone from the address').toBe('')
  expect(window.location.href).not.toContain(TOKEN)
  expect(close).toHaveBeenCalledTimes(1)
})

it('[SEC-927-FE-CALLBACK-DENY-NOSTATE] a callback without a state relays nothing', () => {
  arriveWith(`#id_token=${TOKEN}`)
  renderRelay()

  expect(opener.postMessage).not.toHaveBeenCalled()
  expect(ChannelDouble.instances.flatMap(channel => channel.posted), 'nothing on the channel either').toEqual([])
  expect(window.location.hash, 'the address is cleared all the same').toBe('')
  expect(window.location.href).not.toContain(TOKEN)
  expect(close).toHaveBeenCalledTimes(1)
})

it('[SEC-927-FE-CALLBACK-ERR] a refusal at Google is relayed as an error without a credential', () => {
  arriveWith('#error=access_denied&state=s1')
  renderRelay()

  expect(opener.postMessage).toHaveBeenCalledTimes(1)
  expect(opener.postMessage).toHaveBeenCalledWith({ type: TYPE, state: 's1', error: 'access_denied' }, window.location.origin)
  expect(Object.keys(opener.postMessage.mock.calls[0][0]), 'no credential field').not.toContain('credential')
  expect(ChannelDouble.instances[0].posted).toEqual([{ type: TYPE, state: 's1', error: 'access_denied' }])
  expect(close).toHaveBeenCalledTimes(1)
})

it('[SEC-927-FE-CALLBACK-NOLEAK] the callback page writes the ID token to no console, storage or address', () => {
  const sinks = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined))
  arriveWith(`#id_token=${TOKEN}&state=s1`)
  renderRelay()

  const everything = JSON.stringify([
    sinks.flatMap(sink => sink.mock.calls.map(call => call.map(String))),
    Object.entries({ ...sessionStorage }), Object.entries({ ...localStorage }), window.location.href, document.cookie,
  ])
  expect(everything).not.toContain(TOKEN)
  expect(opener.postMessage, 'the token did reach the opener, so this test proves the sinks and not an empty run').toHaveBeenCalledTimes(1)
})
