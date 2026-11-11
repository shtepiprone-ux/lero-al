/**
 * Task 971 — the pending-timer guard of `src/tests/setup.ts` (implemented in `src/tests/pendingTimerGuard.ts`).
 *
 * A timer with a delay above 0 or an animation frame that a test leaves pending fires after Vitest has torn the jsdom environment down and crashes the run with
 * `window is not defined` at random (CI run 42766290854). After Testing Library's cleanup the guard waits on the real clock (never clearing anything) for what the
 * test left to run, up to a budget (3 s by default), and fails the test, by name and with the frame that created it, for what is still pending.
 *
 *   P1 — a planted timer that outlives a short budget is reported by name with this file as its creating frame, and the guard does not clear it.
 *   P2 — a planted animation frame is reported the same way (budget 0) and is not cancelled by the guard.
 *   P3 — zero-delay, cleared, cancelled and already-fired handles are allowed.
 *   P4 — a test under `vi.useFakeTimers()` talks to the fake clock and is not reported.
 *   P5 — the guard's `afterEach` runs after Testing Library's cleanup (the two tests below prove the order).
 *   P6 — a Modal, Menu and Popover opened, closed and unmounted under `MantineProvider env="test"` leave nothing pending.
 *   P7 — a short timer and a short frame that a test leaves are waited for: both have run before the next test starts.
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Menu, MantineProvider, Modal, Popover } from '@mantine/core'
import { assertNoPendingTimers, lastGuardObservation, pendingLeaks } from '../pendingTimerGuard'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('pending-timer guard: planted leaks (AC2)', () => {
  it('P1: a timer still pending after the budget fails the named test with its creating frame and is not cleared', async () => {
    const fired = new Promise<void>((resolve) => {
      setTimeout(resolve, 300)
    })
    let message = ''
    try {
      await assertNoPendingTimers('planted timer leak', 20)
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain('The test "planted timer leak" left 1 timer(s) or animation frame(s) pending after cleanup and a wait of 20 ms')
    expect(message).toMatch(/300 ms timer created at src\/tests\/__tests__\/pendingTimers\.test\.tsx:\d+:\d+/)
    // reported once: the same leak is not blamed on the next check
    await expect(assertNoPendingTimers('planted timer leak, second check', 0)).resolves.toBeUndefined()
    // the guard never cleared it: the timer still runs
    await fired
  })

  it('P2: an animation frame still pending fails the named test with its creating frame and is not cancelled', async () => {
    const ran = new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
    let message = ''
    try {
      await assertNoPendingTimers('planted frame leak', 0)
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain('The test "planted frame leak" left 1 timer(s) or animation frame(s) pending after cleanup and a wait of 0 ms')
    expect(message).toMatch(/animation frame created at src\/tests\/__tests__\/pendingTimers\.test\.tsx:\d+:\d+/)
    await ran
  })

  it('P3: zero-delay, cleared, cancelled and fired handles are allowed', async () => {
    setTimeout(() => {}, 0)
    setTimeout(() => {})
    clearTimeout(setTimeout(() => {}, 5000))
    cancelAnimationFrame(requestAnimationFrame(() => {}))
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(pendingLeaks()).toEqual([])
    await expect(assertNoPendingTimers('allowed handles')).resolves.toBeUndefined()
  })

  it('P4: a test under vi.useFakeTimers() is left to the fake clock', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
    setTimeout(() => {}, 5000)
    requestAnimationFrame(() => {})
    expect(vi.getTimerCount()).toBe(2)
    await expect(assertNoPendingTimers('fake clock test', 0)).resolves.toBeUndefined()
    vi.useRealTimers()
    expect(pendingLeaks()).toEqual([])
  })
})

describe('pending-timer guard: waits for a short timer and frame (AC2)', () => {
  const planted = { timer: false, frame: false }

  it('P7a: leaves a 60 ms timer and an animation frame pending and ends at once', () => {
    setTimeout(() => {
      planted.timer = true
    }, 60)
    requestAnimationFrame(() => {
      planted.frame = true
    })
    expect(planted).toEqual({ timer: false, frame: false })
  })

  it('P7b: both have run before the next test starts, because the guard waited for them', () => {
    expect(planted).toEqual({ timer: true, frame: true })
  })
})


describe('pending-timer guard: runs after Testing Library cleanup (AC2)', () => {
  it('P5a: renders a probe that only Testing Library cleanup removes', () => {
    const { container } = render(<div data-testid="order-probe">probe</div>)
    expect(container.querySelector('[data-testid="order-probe"]')).not.toBeNull()
    expect(document.body.childElementCount).toBe(1)
  })

  it('P5b: the guard saw the document already cleaned by the previous test', () => {
    expect(lastGuardObservation()).toEqual({ testName: 'P5a: renders a probe that only Testing Library cleanup removes', rootChildren: 0 })
  })
})

describe('pending-timer guard: Mantine overlays (AC3)', () => {
  const overlays: Record<string, (opened: boolean) => React.ReactElement> = {
    Modal: (opened) => (
      <MantineProvider env="test">
        <Modal opened={opened} onClose={() => {}} title="Title">
          body
        </Modal>
      </MantineProvider>
    ),
    Menu: (opened) => (
      <MantineProvider env="test">
        <Menu opened={opened}>
          <Menu.Target>
            <button type="button">target</button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>item</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </MantineProvider>
    ),
    Popover: (opened) => (
      <MantineProvider env="test">
        <Popover opened={opened}>
          <Popover.Target>
            <button type="button">target</button>
          </Popover.Target>
          <Popover.Dropdown>dropdown</Popover.Dropdown>
        </Popover>
      </MantineProvider>
    ),
  }

  it.each(Object.keys(overlays))('%s opened, closed and unmounted leaves no timer and no frame', async (name) => {
    const ui = overlays[name]
    const view = render(ui(false))
    view.rerender(ui(true))
    view.rerender(ui(false))
    cleanup()
    expect(pendingLeaks()).toEqual([])
    await expect(assertNoPendingTimers(`${name} opened, closed and unmounted`, 0)).resolves.toBeUndefined()
  })
})
