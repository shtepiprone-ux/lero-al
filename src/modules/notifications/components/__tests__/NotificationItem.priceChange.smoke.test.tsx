/**
 * NotificationItem — price_change body hydration-stability guard (Task 564 / Sprint 42).
 *
 * `resolvePriceChangeBody` previously called `new Intl.NumberFormat(locale)` directly — the
 * same Chromium-lacks-`sq`-ICU root cause as Task 563's `PriceBlock` fix. It now routes
 * through `formatCount` (no runtime `Intl.NumberFormat` dependency). This test mounts the
 * REAL component under a REAL `sq` `NextIntlClientProvider` and asserts the rendered body
 * uses the correct Albanian space (NBSP) grouping, then proves `resolvePriceChangeBody`
 * makes ZERO `new Intl.NumberFormat('sq', ...)` calls during render — a spy wrapping the
 * real constructor (delegates to it via `super()`, so `next-intl`'s own internal Intl usage
 * is unaffected), which is the actual mechanism guaranteeing hydration-safety.
 */

import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NotificationItem } from '../NotificationItem'
import type { Notification } from '@/types/database'

const NBSP = String.fromCharCode(160)

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

function renderPriceChangeNotification(locale: string) {
  const messages = loadMessages(locale)
  const notification: Notification = {
    id: 'n1',
    user_id: 'u1',
    type: 'price_change',
    title: 'stub-title',
    body: 'stub-body',
    link: null,
    is_read: false,
    created_at: '2026-06-15T12:00:00.000Z',
    template_id: 'price_change',
    template_params: {
      listingName: 'Test Listing',
      oldPrice: 50000,
      newPrice: 45000,
      currency: 'ALL',
    },
  }
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <NotificationItem notification={notification} onRead={() => {}} />
    </NextIntlClientProvider>,
  )
}

describe('NotificationItem — price_change body renders correct locale grouping', () => {
  it('sq: body shows NBSP space-grouped prices ("45 000 ALL"), not comma-grouped', () => {
    renderPriceChangeNotification('sq')
    expect(
      screen.getByText(`50${NBSP}000 ALL → 45${NBSP}000 ALL`, { normalizer: s => s }),
    ).toBeInTheDocument()
  })

  it('en: body shows comma-grouped prices, unchanged', () => {
    renderPriceChangeNotification('en')
    expect(screen.getByText('50,000 ALL → 45,000 ALL')).toBeInTheDocument()
  })
})

describe('NotificationItem — price_change body does not depend on Intl.NumberFormat', () => {
  const OriginalNumberFormat = Intl.NumberFormat

  afterEach(() => {
    Intl.NumberFormat = OriginalNumberFormat
  })

  it('resolvePriceChangeBody makes zero `new Intl.NumberFormat` calls during sq render, and still renders correctly', () => {
    let callCount = 0
    class SpyNumberFormat extends OriginalNumberFormat {
      constructor(locale?: string | string[], options?: Intl.NumberFormatOptions) {
        callCount++
        super(locale, options)
      }
    }
    // Preserve static methods (supportedLocalesOf, etc.) so next-intl's own internal
    // Intl.NumberFormat usage (unrelated to this component's price formatting) keeps working.
    Object.setPrototypeOf(SpyNumberFormat, OriginalNumberFormat)
    // @ts-expect-error -- test-only global override
    Intl.NumberFormat = SpyNumberFormat

    renderPriceChangeNotification('sq')

    expect(
      screen.getByText(`50${NBSP}000 ALL → 45${NBSP}000 ALL`, { normalizer: s => s }),
    ).toBeInTheDocument()
    expect(callCount).toBe(0)
  })
})
