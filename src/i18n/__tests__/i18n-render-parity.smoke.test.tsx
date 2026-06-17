/**
 * G2 — i18n render-parity smoke (Task 445 / Epic RS Slice 6).
 *
 * Renders a test-only harness component under NextIntlClientProvider for each
 * locale (sq/en/uk/it). The harness pulls real message keys from multiple
 * critical namespaces through useTranslations(). The test asserts:
 *   1. No MISSING_MESSAGE error logged to console.error.
 *   2. No raw translation key leaks into the rendered text.
 *
 * This is a test artifact (option 3 from the kickoff), not product code.
 * It covers runtime message-provider parity — the static key-set parity
 * check is handled by the existing `check:i18n` gate.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Message loader ───────────────────────────────────────────────────────────

const LOCALES = ['sq', 'en', 'uk', 'it'] as const

function loadMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

// ── Test-only harness component ──────────────────────────────────────────────
// Pulls representative keys from 8 critical namespaces via useTranslations().
// Uses nested namespace paths (e.g. 'admin.sidebar') where the top-level key
// is an object, not a string. This is NOT product code — it exists solely to
// exercise the message provider across all four locales.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useTranslations } = require('next-intl') as { useTranslations: (ns: string) => (key: string) => string }

function I18nHarness() {
  const tNav = useTranslations('nav')
  const tListing = useTranslations('listing')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tCabinet = useTranslations('cabinet')
  const tAdminSidebar = useTranslations('admin.sidebar')
  const tNotifications = useTranslations('notifications')
  const tContact = useTranslations('contact')

  return (
    <div data-testid="i18n-harness">
      <span data-key="nav.home">{tNav('home')}</span>
      <span data-key="nav.listings">{tNav('listings')}</span>
      <span data-key="nav.login">{tNav('login')}</span>
      <span data-key="nav.logout">{tNav('logout')}</span>
      <span data-key="listing.sale">{tListing('sale')}</span>
      <span data-key="listing.rent">{tListing('rent')}</span>
      <span data-key="auth.login">{tAuth('login')}</span>
      <span data-key="auth.register">{tAuth('register')}</span>
      <span data-key="common.search">{tCommon('search')}</span>
      <span data-key="common.filter">{tCommon('filter')}</span>
      <span data-key="common.save">{tCommon('save')}</span>
      <span data-key="cabinet.title">{tCabinet('title')}</span>
      <span data-key="cabinet.profile_tab">{tCabinet('profile_tab')}</span>
      <span data-key="admin.sidebar.group_overview">{tAdminSidebar('group_overview')}</span>
      <span data-key="admin.sidebar.group_management">{tAdminSidebar('group_management')}</span>
      <span data-key="notifications.title">{tNotifications('title')}</span>
      <span data-key="notifications.mark_all_read">{tNotifications('mark_all_read')}</span>
      <span data-key="contact.title">{tContact('title')}</span>
      <span data-key="contact.subtitle">{tContact('subtitle')}</span>
    </div>
  )
}

// Keys that the harness renders — used to check for raw-key leaks.
// Format: 'namespace.key' as rendered by the harness data-key attributes.
const HARNESS_KEYS = [
  'nav.home', 'nav.listings', 'nav.login', 'nav.logout',
  'listing.sale', 'listing.rent',
  'auth.login', 'auth.register',
  'common.search', 'common.filter', 'common.save',
  'cabinet.title', 'cabinet.profile_tab',
  'admin.sidebar.group_overview', 'admin.sidebar.group_management',
  'notifications.title', 'notifications.mark_all_read',
  'contact.title', 'contact.subtitle',
]

// ── Tests ────────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup()
})

describe('G2 — i18n render parity across sq/en/uk/it', () => {
  for (const locale of LOCALES) {
    describe(`locale: ${locale}`, () => {
      it('renders without MISSING_MESSAGE errors', () => {
        const messages = loadMessages(locale)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        render(
          <NextIntlClientProvider locale={locale} messages={messages}>
            <I18nHarness />
          </NextIntlClientProvider>
        )

        const allCalls = [
          ...errorSpy.mock.calls.map(c => c.join(' ')),
          ...warnSpy.mock.calls.map(c => c.join(' ')),
        ]

        const missingMessageErrors = allCalls.filter(
          msg => msg.includes('MISSING_MESSAGE') || msg.includes('Could not resolve')
        )

        expect(missingMessageErrors).toEqual([])

        errorSpy.mockRestore()
        warnSpy.mockRestore()
      })

      it('no raw translation key leaks into rendered text', () => {
        const messages = loadMessages(locale)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const { container } = render(
          <NextIntlClientProvider locale={locale} messages={messages}>
            <I18nHarness />
          </NextIntlClientProvider>
        )

        for (const key of HARNESS_KEYS) {
          const spans = container.querySelectorAll(`[data-key="${key}"]`)
          for (const span of spans) {
            const spanText = span.textContent ?? ''
            // The span text must not be the bare key (last segment).
            const bareKey = key.split('.').pop()!
            expect(spanText).not.toBe(bareKey)
            // Must not be the full dotted key.
            expect(spanText).not.toBe(key)
            // Must have resolved to a non-empty translated string.
            expect(spanText.length).toBeGreaterThan(0)
          }
        }

        errorSpy.mockRestore()
      })
    })
  }
})
