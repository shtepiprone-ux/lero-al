/**
 * NotificationBellView — trigger ARIA + focus contract (Task 861 R4b / AC3b, review 1 F2 + F5).
 *
 * The bell wraps its `ActionIcon` in an `Indicator` (a plain `<div>`). `aria-haspopup`/`aria-expanded`
 * are only valid on the real button, never on that role-less wrapper root; `MantinePopover` gets the
 * attributes onto the button through its render-function trigger. Also asserts the desktop
 * `trapFocus` + `returnFocus` the popover now applies to this consumer (F5): opening moves focus into
 * the panel, `Escape` returns it to the bell button.
 * Runs on BOTH paths (desktop popover / `<640` bottom sheet).
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { NotificationBellView } from '../NotificationBellView'
import type { Notification } from '@/types/database'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

const ROWS: Notification[] = [
  {
    id: 'n1',
    user_id: 'u1',
    type: 'marketing',
    title: 'Welcome to Lero.al',
    body: 'Explore the latest listings.',
    link: null,
    is_read: false,
    created_at: '2026-07-30T00:00:00.000Z',
    template_id: null,
    template_params: null,
  },
]

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

function renderBell() {
  const utils = render(
    <MantineProvider theme={theme} env="test">
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <NotificationBellView notifications={ROWS} unreadCount={1} onRead={() => {}} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
  const button = utils.baseElement.querySelector('button[aria-label]') as HTMLButtonElement
  return { ...utils, button }
}

afterEach(() => cleanup())

describe.each([
  { path: 'desktop', mobile: false },
  { path: 'mobile', mobile: true },
])('NotificationBellView — trigger ARIA, $path (Task 861 AC3b)', ({ mobile }) => {
  beforeAll(() => stubMatchMedia(mobile))

  it('the ActionIcon <button> carries aria-haspopup="dialog" and a live aria-expanded; the Indicator wrapper carries neither', () => {
    const { baseElement, button } = renderBell()
    expect(button.tagName).toBe('BUTTON')
    const wrapper = button.parentElement!
    expect(wrapper.tagName).not.toBe('BUTTON')
    // closed
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(wrapper.hasAttribute('aria-haspopup')).toBe(false)
    expect(wrapper.hasAttribute('aria-expanded')).toBe(false)
    // open
    fireEvent.click(button)
    expect(baseElement.querySelector('[data-testid="notification-center"]')).toBeTruthy()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(wrapper.hasAttribute('aria-haspopup')).toBe(false)
    expect(wrapper.hasAttribute('aria-expanded')).toBe(false)
  })
})

describe('NotificationBellView — desktop focus trap + return (Task 861 F5)', () => {
  beforeAll(() => stubMatchMedia(false))

  it('opening moves focus into the panel; Escape closes it and returns focus to the bell button', async () => {
    const { baseElement, button } = renderBell()
    button.focus()
    fireEvent.click(button)
    const panel = () => baseElement.querySelector('[data-testid="notification-center"]')
    await waitFor(() => expect(panel()!.contains(document.activeElement)).toBe(true))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() => expect(panel()).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(button))
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
