/**
 * NotificationItem — template-driven notifications must render LOCALIZED per the viewer's
 * locale (Task 595 / Sprint 44). Root cause: `useNotifications.ts`'s `.select()` omitted
 * `template_id`/`template_params`, so at runtime `notification.template_id` was always
 * `undefined` — `NotificationItem` always took the non-template `else` branch and rendered
 * the stored (fixed-language) `title`/`body` verbatim, NEVER localizing any template-driven
 * notification. This test mounts the REAL component with `template_id` present (as the fixed
 * hook now returns it) and asserts the SAME notification renders different, locale-correct
 * text under `uk` vs `sq` — the exact guard for this regression class. It must FAIL if
 * `template_id` is stripped from the notification object (simulating the bug), because the
 * component would then fall back to the stored `title` column instead of the localized key.
 */

import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NotificationItem } from '../NotificationItem'
import type { Notification } from '@/types/database'

beforeAll(() => {
  // jsdom has no matchMedia — MantineProvider's color-scheme detection needs it
  // (same stub convention as ListingCard.smoke.test.tsx).
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
})

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    user_id: 'u1',
    type: 'support_reply',
    title: 'stub-stored-title',
    body: 'stub-stored-body',
    link: null,
    is_read: false,
    created_at: '2026-06-15T12:00:00.000Z',
    template_id: 'support_created',
    template_params: {},
    ...overrides,
  }
}

function renderNotification(locale: string, notification: Notification) {
  const messages = loadMessages(locale)
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <NotificationItem notification={notification} onRead={() => {}} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

describe('NotificationItem — template-driven notification renders localized per viewer locale (Task 595)', () => {
  it('uk: title resolves to the Ukrainian template key, not the stored stub title', () => {
    renderNotification('uk', makeNotification())
    expect(screen.getByText('Скарга на ваш акаунт')).toBeInTheDocument()
    expect(screen.queryByText('stub-stored-title')).not.toBeInTheDocument()
  })

  it('sq: the SAME notification object resolves to the Albanian template key', () => {
    renderNotification('sq', makeNotification())
    expect(screen.getByText('Ankesë për llogarinë tuaj')).toBeInTheDocument()
    expect(screen.queryByText('stub-stored-title')).not.toBeInTheDocument()
  })

  it('regression guard: if template_id is stripped (the pre-fix bug), the title falls back to the stored (wrong-language) string instead of localizing', () => {
    const notification = makeNotification({ template_id: null })
    renderNotification('uk', notification)
    // This is the exact bug this task fixes: without template_id, NotificationItem cannot
    // localize and shows the stored title verbatim regardless of viewer locale.
    expect(screen.getByText('stub-stored-title')).toBeInTheDocument()
    expect(screen.queryByText('Скарга на ваш акаунт')).not.toBeInTheDocument()
  })

  it('non-template row (template_id=NULL) still renders stored title/body verbatim — no regression', () => {
    const notification = makeNotification({
      template_id: null,
      title: 'Legacy stored title',
      body: 'Legacy stored body',
      type: 'marketing',
    })
    renderNotification('uk', notification)
    expect(screen.getByText('Legacy stored title')).toBeInTheDocument()
    expect(screen.getByText('Legacy stored body')).toBeInTheDocument()
  })
})

describe('NotificationItem — Task 880 producers (listing_report_filed / listing_inquiry_email_failed)', () => {
  it('uk: listing_report_filed title interpolates {listingName}', () => {
    renderNotification('uk', makeNotification({
      type: 'report_outcome',
      template_id: 'listing_report_filed',
      template_params: { listingName: 'Квартира 2+1 Тирана' },
    }))
    expect(screen.getByText('На ваше оголошення надійшла скарга: Квартира 2+1 Тирана')).toBeInTheDocument()
  })

  it('sq: the SAME listing_report_filed row resolves to the Albanian template key', () => {
    renderNotification('sq', makeNotification({
      type: 'report_outcome',
      template_id: 'listing_report_filed',
      template_params: { listingName: 'Apartament 2+1 Tiranë' },
    }))
    expect(screen.getByText('Njoftimi juaj u raportua: Apartament 2+1 Tiranë')).toBeInTheDocument()
  })

  it('uk: listing_inquiry_email_failed body renders the sender\'s name and email', () => {
    renderNotification('uk', makeNotification({
      type: 'new_message',
      template_id: 'listing_inquiry_email_failed',
      template_params: {
        listingName: 'Квартира 2+1 Тирана',
        senderName: 'Арбен',
        senderEmail: 'arben@example.al',
      },
    }))
    expect(screen.getByText('Повідомлення не доставлено на пошту: Квартира 2+1 Тирана')).toBeInTheDocument()
    expect(screen.getByText(
      'Арбен (arben@example.al) надіслав(ла) вам повідомлення, але лист не вдалося доставити. Ви можете відповісти прямо на цю адресу.',
    )).toBeInTheDocument()
  })

  it('missing senderEmail → body falls back to the stored (sq-fallback) body, not a broken interpolation', () => {
    renderNotification('uk', makeNotification({
      type: 'new_message',
      title: 'stub-stored-title',
      body: 'stub-stored-body',
      template_id: 'listing_inquiry_email_failed',
      template_params: { listingName: 'Квартира 2+1 Тирана', senderName: 'Арбен' },
    }))
    expect(screen.getByText('stub-stored-body')).toBeInTheDocument()
  })
})
