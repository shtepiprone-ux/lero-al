/**
 * Task 989 Revision 3 (Review 4 F12): the admin "Site settings" page checks the viewer first, then hands the form one value per key of `SETTINGS_FORM_KEYS` — the
 * stored value, else the page's default, else empty — and nothing else of the store. The staff guard, `getAdminLocale`, `next-intl/server`, the read and the
 * form's save action are doubles, as in `src/app/[locale]/admin/users/__tests__/adminUsersNotice.security.test.tsx`; the page's element tree is read without
 * rendering it.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { SETTINGS_FORM_KEYS } from '@/modules/admin/lib/settingKeys'
import { ARCHIVED_NOINDEX_DAYS } from '@/modules/listings/constants'
import AdminSettingsPage from '../page'

const calls: string[] = []
let stored: Record<string, string> = {}

vi.mock('@/lib/auth/staff', () => ({
  requireStaffPage: vi.fn(async (options: unknown) => { calls.push(`requireStaffPage ${JSON.stringify(options)}`); return { userId: 'u-admin', role: 'admin' } }),
}))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/admin/lib/settings', () => ({
  getAllSettings: vi.fn(async () => { calls.push('getAllSettings'); return stored }),
}))
vi.mock('@/modules/admin/actions', () => ({ saveSettings: vi.fn() }))

/** the first element of the tree whose type is `type` */
function find(node: unknown, type: unknown): React.ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) { const hit = find(child, type); if (hit) return hit }
    return null
  }
  if (!React.isValidElement(node)) return null
  if (node.type === type) return node as React.ReactElement<Record<string, unknown>>
  return find((node.props as { children?: unknown }).children, type)
}

async function initialSettings(): Promise<Record<string, string>> {
  const form = find(await AdminSettingsPage(), AdminSettings)
  expect(form).not.toBeNull()
  return form!.props.initialSettings as Record<string, string>
}

beforeEach(() => {
  calls.length = 0
  stored = {}
})

describe('AdminSettingsPage', () => {
  it('hands the form exactly the keys of the settings form', async () => {
    const values = await initialSettings()
    expect(Object.keys(values).sort()).toEqual([...SETTINGS_FORM_KEYS].sort())
  })

  it('an empty store gives the page defaults, and empty for every other key', async () => {
    const values = await initialSettings()
    const defaults: Record<string, string> = { site_name: 'Lero.al', archived_noindex_days: String(ARCHIVED_NOINDEX_DAYS), default_locale: 'sq' }
    for (const key of SETTINGS_FORM_KEYS) expect(values[key], key).toBe(defaults[key] ?? '')
  })

  it('a stored value wins over the default, and a removed key in the store does not reach the form', async () => {
    stored = {
      site_name: 'Lero',
      default_locale: 'en',
      meta_title_uk: 'Нерухомість',
      logo_url: 'https://res.cloudinary.com/x/logo.png',
      social_facebook: 'https://www.facebook.com/x',
      about_al: 'support@example.com',
      tagline: 'old tagline',
    }
    const values = await initialSettings()
    expect(values.site_name).toBe('Lero')
    expect(values.default_locale).toBe('en')
    expect(values.meta_title_uk).toBe('Нерухомість')
    expect(values.logo_url).toBe('https://res.cloudinary.com/x/logo.png')
    expect(values.archived_noindex_days).toBe(String(ARCHIVED_NOINDEX_DAYS))
    expect(values.meta_desc_uk).toBe('')
    for (const removed of ['social_facebook', 'about_al', 'tagline']) expect(values, removed).not.toHaveProperty(removed)
  })

  it('checks the viewer with the settings page permission before the read', async () => {
    await AdminSettingsPage()
    expect(calls).toEqual(['requireStaffPage {"page":"page.settings"}', 'getAllSettings'])
  })
})
