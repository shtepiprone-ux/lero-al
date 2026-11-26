// @vitest-environment node
/**
 * Task 988 R6-3 (F13): `/` that reaches the root page (the proxy did not send it to an account, session or next-intl language) goes to the site-wide default
 * language of the settings; the `admin-locale` cookie no longer decides it.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) } }))
vi.mock('@/modules/admin/lib/settings', () => ({ getDefaultSiteLocale: async () => 'it' }))

import RootPage from '../page'

describe('RootPage — the default language (Task 988)', () => {
  it('redirects to /<getDefaultSiteLocale()>', async () => {
    await expect(RootPage()).rejects.toThrow(/^NEXT_REDIRECT \/it$/)
  })
})
