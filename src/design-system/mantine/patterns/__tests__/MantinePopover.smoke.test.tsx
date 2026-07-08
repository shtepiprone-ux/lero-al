/**
 * MantinePopover — `fullWidthTrigger` + `close()` regression smoke (Task 558)
 *
 * `MantinePopover`'s desktop path switched from an uncontrolled `<Popover>` to a locally
 * `useState`-controlled one so `children` can expose an imperative `close()` (needed by
 * `RangeDatePicker`'s Apply/Cancel/Confirm). Reading the installed `@mantine/core` v8 source
 * (`PopoverTarget.mjs`) showed that `Popover.Target` only auto-wires its click-to-toggle handler
 * when UNCONTROLLED — switching to controlled mode without compensating would have silently
 * broken every desktop trigger (click would do nothing). The fix clones `trigger` to attach its
 * own toggle `onClick` before `Popover.Target` sees it. This test proves the fix and, since
 * `MantinePopover` has exactly one other consumer today (`Popover.stories.tsx` — no production
 * surface used it before this task), also serves as the primitive-level regression baseline.
 *
 * Covers:
 *   1. Desktop click-to-open / click-to-close (byte-identical UX to the pre-Task-558 uncontrolled
 *      behavior, now proven under the controlled implementation).
 *   2. `disabled` — trigger click is a no-op, dropdown never renders.
 *   3. `children` as a render function receives `close()`; calling it closes the popover.
 *   4. `fullWidthTrigger` default `false` → desktop wrapper `alignSelf:'flex-start'` (§20.5
 *      natural-width contract, unchanged); `true` → `alignSelf:'stretch'`.
 *   5. Mobile (`<640` `matchMedia`): click opens the bottom sheet; `children`'s `close()` closes it.
 *
 * Planted-violation (documented, verified once and reverted — same convention as
 * `MantinePagination.smoke.test.tsx`/`MantineCombobox.smoke.test.tsx`): reverting the
 * `clickableTrigger` clone (passing bare `trigger` straight to `Popover.Target` while `opened` is
 * still controlled) makes test 1 FAIL — the dropdown never opens on click, because
 * `Popover.Target` attaches no `onClick` at all in controlled mode.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantinePopover } from '../MantinePopover'

function withProvider(children: React.ReactNode) {
  // env="test" makes Mantine's Transition (Popover.Dropdown/Drawer) render synchronously,
  // skipping its real requestAnimationFrame+150ms timer-driven mount — confirmed via
  // Transition.mjs: `if (transitionDuration === 0 || env === "test") return mounted ? children({}) : ...`.
  // Without it, the dropdown content only mounts after a real timer tick jsdom never fires.
  return (
    <MantineProvider theme={theme} env="test">
      {children}
    </MantineProvider>
  )
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

afterEach(() => cleanup())

describe('MantinePopover — desktop (Task 558)', () => {
  beforeAll(() => stubMatchMedia(false))

  it('click-to-open / click-to-close: dropdown content is absent, then present, then absent', () => {
    const { baseElement } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>}>
          <div data-testid="pop-body">content</div>
        </MantinePopover>,
      ),
    )
    expect(baseElement.querySelector('[data-testid="pop-body"]')).toBeNull()

    const btn = baseElement.querySelector('button')!
    fireEvent.click(btn)
    expect(baseElement.querySelector('[data-testid="pop-body"]')).toBeTruthy()

    fireEvent.click(btn)
    expect(baseElement.querySelector('[data-testid="pop-body"]')).toBeNull()
  })

  it('disabled: trigger click is a no-op, dropdown never renders', () => {
    const { baseElement } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>} disabled>
          <div data-testid="pop-body">content</div>
        </MantinePopover>,
      ),
    )
    fireEvent.click(baseElement.querySelector('button')!)
    expect(baseElement.querySelector('[data-testid="pop-body"]')).toBeNull()
  })

  it('children as a render function receives close(); calling it closes the popover', () => {
    const { baseElement } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>}>
          {(close) => (
            <button type="button" data-testid="close-btn" onClick={close}>
              close
            </button>
          )}
        </MantinePopover>,
      ),
    )
    fireEvent.click(baseElement.querySelector('button')!)
    const closeBtn = baseElement.querySelector('[data-testid="close-btn"]') as HTMLButtonElement
    expect(closeBtn).toBeTruthy()
    fireEvent.click(closeBtn)
    expect(baseElement.querySelector('[data-testid="close-btn"]')).toBeNull()
  })

  it('fullWidthTrigger default false: desktop wrapper alignSelf is flex-start', () => {
    const { container } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>}>
          <div>content</div>
        </MantinePopover>,
      ),
    )
    const wrapper = container.querySelector('div[style*="align-self"]') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.alignSelf).toBe('flex-start')
  })

  it('fullWidthTrigger=true: desktop wrapper alignSelf is stretch', () => {
    const { container } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>} fullWidthTrigger>
          <div>content</div>
        </MantinePopover>,
      ),
    )
    const wrapper = container.querySelector('div[style*="align-self"]') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.alignSelf).toBe('stretch')
  })
})

describe('MantinePopover — mobile (Task 558)', () => {
  beforeAll(() => stubMatchMedia(true))

  it('click opens the bottom sheet; children close() closes it', () => {
    const { baseElement } = render(
      withProvider(
        <MantinePopover trigger={<button type="button">open</button>}>
          {(close) => (
            <button type="button" data-testid="confirm-btn" onClick={close}>
              confirm
            </button>
          )}
        </MantinePopover>,
      ),
    )
    expect(baseElement.querySelector('[data-testid="confirm-btn"]')).toBeNull()
    fireEvent.click(baseElement.querySelector('button')!)
    const confirmBtn = baseElement.querySelector('[data-testid="confirm-btn"]') as HTMLButtonElement
    expect(confirmBtn).toBeTruthy()
    fireEvent.click(confirmBtn)
    expect(baseElement.querySelector('[data-testid="confirm-btn"]')).toBeNull()
  })
})
