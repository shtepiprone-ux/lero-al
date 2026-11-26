/**
 * Task 988 AC5: the admin language switcher writes the account language first, then opens the same admin page under the new language slug (the proxy sends every
 * page in another language back to the account language, so the order matters). The query string of the admin page is kept, as the refresh of `main` kept it.
 * The action, the router and the shared menu (`LocaleSwitcher`, whose `onSwitch` it calls) are doubles; the switcher is real.
 */
import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'

const push = vi.fn()
const refresh = vi.fn()
const state = vi.hoisted(() => ({ release: null as null | (() => void), calls: [] as string[], onSwitch: null as null | ((l: string) => void) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }), usePathname: () => window.location.pathname }))
vi.mock('@/components/shared/LocaleSwitcher', () => ({ LocaleSwitcher: ({ onSwitch }: { onSwitch: (l: string) => void }) => { state.onSwitch = onSwitch; return null } }))
vi.mock('@/modules/admin/actions/locale', () => ({
  setAccountLocale: (locale: string) => {
    state.calls.push(locale)
    return new Promise<boolean>((resolve) => { state.release = () => resolve(true) })
  },
}))

import { AdminLocaleSwitcher } from '../AdminLocaleSwitcher'

beforeEach(() => {
  // jsdom has no matchMedia; Mantine's colour-scheme effect asks it once
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
  }
  push.mockReset()
  refresh.mockReset()
  state.release = null
  state.calls = []
  state.onSwitch = null
  window.history.pushState(null, '', '/en/admin/users?page=2')
})
afterEach(() => cleanup())

describe('AdminLocaleSwitcher', () => {
  it('[AC5] writes the account language, then opens the same admin page under the new slug', async () => {
    render(
      <MantineProvider theme={theme} env="test">
        <NextIntlClientProvider locale="en" messages={messages}>
          <AdminLocaleSwitcher />
        </NextIntlClientProvider>
      </MantineProvider>,
    )
    await act(async () => { state.onSwitch!('uk') })
    expect(state.calls).toEqual(['uk'])
    expect(push, 'no navigation before the action resolved').not.toHaveBeenCalled()
    await act(async () => { state.release!() })
    expect(push).toHaveBeenCalledWith('/uk/admin/users?page=2')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('[AC5] the current language does nothing', async () => {
    render(
      <MantineProvider theme={theme} env="test">
        <NextIntlClientProvider locale="en" messages={messages}>
          <AdminLocaleSwitcher />
        </NextIntlClientProvider>
      </MantineProvider>,
    )
    await act(async () => { state.onSwitch!('en') })
    expect(state.calls).toEqual([])
    expect(push).not.toHaveBeenCalled()
  })
})
