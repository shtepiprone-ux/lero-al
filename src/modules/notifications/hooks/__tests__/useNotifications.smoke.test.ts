/**
 * useNotifications — hook-level `.select()` column-list regression guard (Task 596 / Sprint 44),
 * extended by Task 882 (Sprint 82) with the live-delivery contract: user-scoped subscription,
 * status-callback recovery, tab-visibility refetch, and fetch-failure resilience.
 *
 * Task 595 fixed a real bug: `useNotifications.ts`'s `.select()` omitted `template_id` /
 * `template_params`, so `notification.template_id` arrived `undefined` at runtime and
 * `NotificationItem` rendered the stored fixed-language string for EVERY template-driven
 * notification. The Task 595 regression test (`NotificationItem.templateLocalization.smoke.test.tsx`)
 * guards the downstream RENDERER with a hard-coded `template_id` fixture — it never exercises this
 * hook, so a future refactor that drops the two columns from `useNotifications`'s `.select()` again
 * would leave that test fully green (the exact fixtures-bypass-the-hook blind spot that shipped the
 * original bug). The first describe block below closes that gap by mounting the REAL
 * `useNotifications` against a mocked Supabase query-builder chain and asserting the `.select()`
 * call itself — unchanged since Task 596.
 *
 * Task 882: the hook previously subscribed unfiltered, user-agnostic, with no status callback and
 * no recovery from a missed connection — a new notification only ever appeared after a manual page
 * reload (D82-7). The blocks below prove: the subscription is scoped to the signed-in user and torn
 * down/recreated when that user changes (R1); a realtime status callback logs non-SUBSCRIBED states
 * and recovers missed events with one refetch on the next SUBSCRIBED (R2); a hidden tab regaining
 * visibility triggers one refetch (R3); and a failed fetch is logged without discarding the
 * previously loaded list (R4).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// ── Supabase query-builder chain spies ──────────────────────────────────────────────
// fetchData/fetchError are read live (not captured at define-time) so a test can flip the
// result of the NEXT .limit() call without re-mocking the chain.
let fetchData: unknown[] = []
let fetchError: { message: string } | null = null

const limitSpy = vi.fn((count: number) => {
  void count
  return Promise.resolve({ data: fetchData, error: fetchError })
})
const orderSpy = vi.fn((column: string, opts: { ascending: boolean }) => { void column; void opts; return { limit: limitSpy } })
const selectSpy = vi.fn((columns: string) => { void columns; return { order: orderSpy } })
const fromSpy = vi.fn((table: string) => { void table; return { select: selectSpy } })

// ── Realtime channel chain spies ────────────────────────────────────────────────────
type StatusCallback = (status: string, err?: Error) => void

let capturedStatusCallback: StatusCallback | undefined
let capturedOnArgs: [string, Record<string, string>, () => void] | undefined

const subscribeSpy = vi.fn((cb?: StatusCallback) => {
  capturedStatusCallback = cb
  // A distinct object per call so removeChannel(handle) can be asserted per-subscription.
  return { __handle: Symbol('channel-handle') }
})
const onSpy = vi.fn((event: string, filterObj: Record<string, string>, handler: () => void) => {
  capturedOnArgs = [event, filterObj, handler]
  return { subscribe: subscribeSpy }
})
const channelSpy = vi.fn((name: string) => { void name; return { on: onSpy } })
const removeChannelSpy = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromSpy,
    channel: channelSpy,
    removeChannel: removeChannelSpy,
  }),
}))

// ── Auth mock — controls the signed-in user id per test ─────────────────────────────
let mockUser: { id: string } | null = { id: 'default-user-id' }
vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { useNotifications } from '../useNotifications'

beforeEach(() => {
  fromSpy.mockClear()
  selectSpy.mockClear()
  orderSpy.mockClear()
  limitSpy.mockClear()
  channelSpy.mockClear()
  onSpy.mockClear()
  subscribeSpy.mockClear()
  removeChannelSpy.mockClear()
  capturedStatusCallback = undefined
  capturedOnArgs = undefined
  fetchData = []
  fetchError = null
  mockUser = { id: 'default-user-id' }
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useNotifications — .select() must fetch the template columns NotificationItem needs to localize', () => {
  it('calls .select() with a column list containing BOTH template_id AND template_params', async () => {
    renderHook(() => useNotifications())

    await waitFor(() => expect(limitSpy).toHaveBeenCalled())

    expect(fromSpy).toHaveBeenCalledWith('notifications')
    expect(selectSpy).toHaveBeenCalledTimes(1)
    const selectArg = selectSpy.mock.calls[0][0] as string
    expect(selectArg).toEqual(expect.stringContaining('template_id'))
    expect(selectArg).toEqual(expect.stringContaining('template_params'))
  })

  it('chain integrity: .order("created_at", desc) and .limit(PAGE_SIZE=30) are still invoked unchanged', async () => {
    renderHook(() => useNotifications())

    await waitFor(() => expect(limitSpy).toHaveBeenCalled())

    expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: false })
    // PAGE_SIZE is a private const in useNotifications.ts (currently 30) — asserted by value
    // since it is not exported; a change to this constant is an intentional product decision,
    // not this guard's concern, but the .limit() call itself must still exist in the chain.
    expect(limitSpy).toHaveBeenCalledWith(30)
  })
})

describe('useNotifications — subscription is scoped to the signed-in user (Task 882 R1)', () => {
  it('no user: channel is never called', async () => {
    mockUser = null
    renderHook(() => useNotifications())

    // Task 883: with no user, there is no read at all, so there is nothing to wait for.
    // Wait a tick instead of for limitSpy — waiting for limitSpy would hang forever now
    // that the guarded hook never calls it.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(fromSpy).not.toHaveBeenCalled()
    expect(channelSpy).not.toHaveBeenCalled()
  })

  it('with a user: channel is called with a name containing the id, and on is called with filter user_id=eq.<id>', async () => {
    mockUser = { id: 'user-abc' }
    renderHook(() => useNotifications())

    await waitFor(() => expect(subscribeSpy).toHaveBeenCalled())

    expect(channelSpy).toHaveBeenCalledTimes(1)
    expect(channelSpy.mock.calls[0][0]).toEqual(expect.stringContaining('user-abc'))
    expect(capturedOnArgs?.[1]).toMatchObject({ filter: 'user_id=eq.user-abc' })
  })

  it('the user changes from A to B: removeChannel is called for A\'s channel and a new one is created for B', async () => {
    mockUser = { id: 'user-a' }
    const { rerender } = renderHook(() => useNotifications())

    await waitFor(() => expect(subscribeSpy).toHaveBeenCalledTimes(1))
    const handleA = subscribeSpy.mock.results[0].value

    mockUser = { id: 'user-b' }
    rerender()

    await waitFor(() => expect(channelSpy).toHaveBeenCalledTimes(2))
    expect(removeChannelSpy).toHaveBeenCalledWith(handleA)
    expect(channelSpy.mock.calls[1][0]).toEqual(expect.stringContaining('user-b'))
    expect(channelSpy.mock.calls[1][0]).not.toEqual(expect.stringContaining('user-a'))
  })
})

describe('useNotifications — realtime status recovery (Task 882 R2)', () => {
  it('status sequence CHANNEL_ERROR -> SUBSCRIBED: console.warn fires once, and fetchAll runs once more after SUBSCRIBED', async () => {
    mockUser = { id: 'user-status' }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    renderHook(() => useNotifications())

    await waitFor(() => expect(subscribeSpy).toHaveBeenCalled())
    await waitFor(() => expect(fromSpy).toHaveBeenCalledTimes(1)) // initial mount fetch only

    capturedStatusCallback?.('CHANNEL_ERROR')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('[notifications] realtime CHANNEL_ERROR', undefined)
    expect(fromSpy).toHaveBeenCalledTimes(1) // an error status alone must not trigger a refetch

    capturedStatusCallback?.('SUBSCRIBED')

    await waitFor(() => expect(fromSpy).toHaveBeenCalledTimes(2))
    expect(warnSpy).toHaveBeenCalledTimes(1) // SUBSCRIBED itself is never warned
  })

  it('the very first SUBSCRIBED (no prior error) does not trigger an extra refetch', async () => {
    mockUser = { id: 'user-first-subscribe' }
    renderHook(() => useNotifications())

    await waitFor(() => expect(subscribeSpy).toHaveBeenCalled())
    await waitFor(() => expect(fromSpy).toHaveBeenCalledTimes(1))

    capturedStatusCallback?.('SUBSCRIBED')

    // Give any (incorrect) refetch a tick to happen, then assert it did not.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(fromSpy).toHaveBeenCalledTimes(1)
  })
})

describe('useNotifications — tab visibility recovery (Task 882 R3)', () => {
  it('visibilitychange to visible triggers one extra fetch; none after unmount', async () => {
    mockUser = { id: 'user-vis' }
    const { unmount } = renderHook(() => useNotifications())

    await waitFor(() => expect(fromSpy).toHaveBeenCalledTimes(1))

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => expect(fromSpy).toHaveBeenCalledTimes(2))

    unmount()
    fromSpy.mockClear()

    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(fromSpy).not.toHaveBeenCalled()
  })
})

describe('useNotifications — a failed fetch keeps the previous list (Task 882 R4)', () => {
  it('a fetch returning { error } logs console.error and keeps the previously loaded rows', async () => {
    mockUser = { id: 'user-err' }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    fetchData = [{ id: '1', is_read: false }] as unknown[]
    fetchError = null

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => expect(result.current.notifications).toHaveLength(1))

    const boom = { message: 'boom' }
    fetchError = boom
    fetchData = []

    await result.current.refetch()

    expect(errorSpy).toHaveBeenCalledWith('[notifications] fetch failed', boom)
    expect(result.current.notifications).toHaveLength(1)
  })
})

describe('useNotifications — no read without a user (Task 883)', () => {
  // (a) is the rewritten "no user: channel is never called" test above, in the Task 882 R1
  // describe block — it already asserts fromSpy/channelSpy are never called at mount with no user.

  it('sign-out: state clears and no extra read is issued (R5 b)', async () => {
    mockUser = { id: 'user-signing-out' }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    fetchData = [{ id: '1', is_read: false }] as unknown[]
    fetchError = null

    const { result, rerender } = renderHook(() => useNotifications())

    await waitFor(() => expect(result.current.notifications).toHaveLength(1))
    const fromCallCountAtSignOut = fromSpy.mock.calls.length

    mockUser = null
    rerender()

    await waitFor(() => expect(result.current.notifications).toHaveLength(0))

    expect(fromSpy.mock.calls.length).toBe(fromCallCountAtSignOut)
    expect(result.current.unreadCount).toBe(0)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('no user: visibility refetch and refetch() both issue no read (R5 c)', async () => {
    mockUser = null
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    fromSpy.mockClear()

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      await result.current.refetch()
    })

    expect(fromSpy).not.toHaveBeenCalled()
  })

  it('a stale response for a signed-out user is dropped (R5 d)', async () => {
    mockUser = { id: 'user-a' }

    let resolveDeferred: (value: { data: unknown[]; error: null }) => void = () => {}
    const deferred = new Promise<{ data: unknown[]; error: null }>(resolve => {
      resolveDeferred = resolve
    })
    limitSpy.mockImplementationOnce(() => deferred)

    const { result, rerender } = renderHook(() => useNotifications())

    await waitFor(() => expect(limitSpy).toHaveBeenCalled())

    mockUser = null
    await act(async () => {
      rerender()
    })

    await act(async () => {
      resolveDeferred({ data: [{ id: 'late-row', is_read: false }], error: null })
      await deferred
    })

    expect(result.current.notifications).toHaveLength(0)
  })
})
