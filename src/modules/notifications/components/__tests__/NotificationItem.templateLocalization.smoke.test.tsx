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
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NotificationItem } from '../NotificationItem'
import type { Notification } from '@/types/database'

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
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <NotificationItem notification={notification} onRead={() => {}} />
    </NextIntlClientProvider>,
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
