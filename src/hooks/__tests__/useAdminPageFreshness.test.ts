/**
 * useAdminPageFreshness — regression test (Task 452 / Epic KK Slice KK.1).
 *
 * Covers: focus fires router.refresh once; visibilitychange→visible fires once,
 * hidden→none; burst within min-interval → 1 call; no trailing refresh after
 * burst; listeners cleaned on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

import { useAdminPageFreshness } from '../useAdminPageFreshness'

beforeEach(() => {
  mockRefresh.mockClear()
  vi.useFakeTimers()
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAdminPageFreshness', () => {
  it('calls router.refresh on window focus', () => {
    renderHook(() => useAdminPageFreshness(0))

    act(() => { window.dispatchEvent(new Event('focus')) })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('calls router.refresh on visibilitychange → visible', () => {
    renderHook(() => useAdminPageFreshness(0))

    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('does NOT call router.refresh when tab is hidden', () => {
    renderHook(() => useAdminPageFreshness(0))

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(mockRefresh).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('throttles: burst of focus+visibilitychange within min-interval produces exactly 1 refresh', () => {
    const MIN_INTERVAL = 5000
    renderHook(() => useAdminPageFreshness(MIN_INTERVAL))

    act(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)

    // Second event within interval is dropped
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(mockRefresh).toHaveBeenCalledTimes(1)

    // After interval elapses, a NEW event fires the 2nd refresh
    act(() => { vi.advanceTimersByTime(MIN_INTERVAL + 100) })
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(mockRefresh).toHaveBeenCalledTimes(2)
  })

  it('does not fire a trailing refresh after a focus+visibility burst', () => {
    renderHook(() => useAdminPageFreshness(5000))

    act(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(mockRefresh).toHaveBeenCalledTimes(1)

    // Advance past the min-interval with NO new event — no trailing refresh
    act(() => { vi.advanceTimersByTime(5000) })
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useAdminPageFreshness(0))

    unmount()
    mockRefresh.mockClear()

    act(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
