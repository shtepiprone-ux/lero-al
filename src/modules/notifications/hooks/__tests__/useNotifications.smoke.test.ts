/**
 * useNotifications — hook-level `.select()` column-list regression guard (Task 596 / Sprint 44).
 *
 * Task 595 fixed a real bug: `useNotifications.ts`'s `.select()` omitted `template_id` /
 * `template_params`, so `notification.template_id` arrived `undefined` at runtime and
 * `NotificationItem` rendered the stored fixed-language string for EVERY template-driven
 * notification. The Task 595 regression test (`NotificationItem.templateLocalization.smoke.test.tsx`)
 * guards the downstream RENDERER with a hard-coded `template_id` fixture — it never exercises this
 * hook, so a future refactor that drops the two columns from `useNotifications`'s `.select()` again
 * would leave that test fully green (the exact fixtures-bypass-the-hook blind spot that shipped the
 * original bug). This test closes that gap by mounting the REAL `useNotifications` against a mocked
 * Supabase query-builder chain and asserting the `.select()` call itself.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Typed no-op implementations (args intentionally unused — only call-args capture matters here).
const limitSpy = vi.fn((count: number) => { void count; return Promise.resolve({ data: [] }) })
const orderSpy = vi.fn((column: string, opts: { ascending: boolean }) => { void column; void opts; return { limit: limitSpy } })
const selectSpy = vi.fn((columns: string) => { void columns; return { order: orderSpy } })
const fromSpy = vi.fn((table: string) => { void table; return { select: selectSpy } })

const subscribeSpy = vi.fn()
const onSpy = vi.fn(() => ({ subscribe: subscribeSpy }))
const channelSpy = vi.fn(() => ({ on: onSpy }))
const removeChannelSpy = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromSpy,
    channel: channelSpy,
    removeChannel: removeChannelSpy,
  }),
}))

import { useNotifications } from '../useNotifications'

beforeEach(() => {
  fromSpy.mockClear()
  selectSpy.mockClear()
  orderSpy.mockClear()
  limitSpy.mockClear()
  channelSpy.mockClear()
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
