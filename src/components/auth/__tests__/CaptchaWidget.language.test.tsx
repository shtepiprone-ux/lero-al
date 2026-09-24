/**
 * CaptchaWidget — Turnstile language follows the app locale (Task 875, R1/R2, D81-6).
 *
 * Covers:
 *   1. The `options` object passed to the mocked `Turnstile` equals
 *      `{ theme: 'auto', size: 'flexible', language: <expected> }` for each app locale —
 *      en/it/uk get their own Turnstile code, sq keeps 'auto' (D81-6, Cloudflare has no sq).
 *      Asserting the whole object also proves `theme`/`size` are unchanged.
 *   2. The dev fallback (no site key) is unaffected: `Turnstile` is never rendered, `onSuccess`
 *      fires once with `'dev-noop-token'`, and the localized "not configured" note renders.
 *
 * Mocking approach: `@marsidev/react-turnstile`'s `Turnstile` is replaced with a `forwardRef`
 * stub that records its props and renders nothing — no real Cloudflare script/network involved.
 *
 * Planted-violation proofs (session log has the transcripts):
 * P1 — remove `language` from `options` in `CaptchaWidget.tsx` → all four locale cases fail
 *      (`sq` fails too: `undefined` is not `'auto'`).
 * P2 — map `sq -> 'sq'` in `TURNSTILE_LANGUAGE_BY_LOCALE` → only the `sq` case fails.
 *
 * Command: npx vitest run src/components/auth/__tests__/CaptchaWidget.language.test.tsx
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { CaptchaWidget } from '../CaptchaWidget'

const { mockTurnstile } = vi.hoisted(() => ({ mockTurnstile: vi.fn() }))

vi.mock('@marsidev/react-turnstile', () => {
  const MockTurnstile = React.forwardRef((props: Record<string, unknown>, _ref: unknown) => {
    mockTurnstile(props)
    return null
  })
  MockTurnstile.displayName = 'Turnstile'
  return { Turnstile: MockTurnstile }
})

function loadMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

const noop = () => {}

function stubMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
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

function renderCaptcha(locale: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      <MantineProvider theme={theme} env="test">
        <CaptchaWidget onSuccess={noop} onError={noop} onExpire={noop} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  stubMatchMedia()
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  mockTurnstile.mockClear()
})

describe('CaptchaWidget — Turnstile language follows the app locale (Task 875)', () => {
  it.each([
    ['sq', 'auto'],
    ['en', 'en'],
    ['uk', 'uk'],
    ['it', 'it'],
  ])('locale=%s -> Turnstile options.language=%s', (locale, expectedLanguage) => {
    renderCaptcha(locale)

    expect(mockTurnstile).toHaveBeenCalled()
    const lastCall = mockTurnstile.mock.calls[mockTurnstile.mock.calls.length - 1][0] as {
      options: unknown
    }
    expect(lastCall.options).toEqual({ theme: 'auto', size: 'flexible', language: expectedLanguage })
  })

  it('dev fallback is preserved when no site key is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    const onSuccess = vi.fn()

    render(
      <NextIntlClientProvider locale="en" messages={loadMessages('en')}>
        <MantineProvider theme={theme} env="test">
          <CaptchaWidget onSuccess={onSuccess} onError={noop} onExpire={noop} />
        </MantineProvider>
      </NextIntlClientProvider>,
    )

    expect(mockTurnstile).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('dev-noop-token')
    expect(screen.getByText('(Captcha disabled — development environment)')).toBeInTheDocument()
  })
})
