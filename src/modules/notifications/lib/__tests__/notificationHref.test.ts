// @vitest-environment node
/**
 * Task 988 AC1: a notification opens in the reader's language and stays internal.
 *  - the stored link (a path without a language, a path with one, or an absolute address of the site's own origin) becomes `/<reader's locale><path>`;
 *  - SEC-988-NOTIF-LINK-DENY: a link to another origin, a protocol-relative or backslash form, a script URL, a control character or an empty value gives `null`, so no anchor renders.
 * The site origin is `SITE_URL` (`NEXT_PUBLIC_SITE_URL`, default `https://lero.al`); the tests set it before the import.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest'

let notificationHref: (link: string | null | undefined, locale: string) => string | null

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://lero.al')
  vi.resetModules()
  ;({ notificationHref } = await import('../notificationHref'))
})

describe('notificationHref', () => {
  it('[AC1] puts the reader\'s language in front of the stored path', () => {
    expect(notificationHref('/listings/a', 'uk')).toBe('/uk/listings/a')
    expect(notificationHref('/sq/listings/a', 'en')).toBe('/en/listings/a')
    expect(notificationHref('https://lero.al/sq/listings?x=1#h', 'it')).toBe('/it/listings?x=1#h')
    expect(notificationHref('/cabinet?tab=x', 'uk')).toBe('/uk/cabinet?tab=x')
  })

  it('[AC1] a first segment that only starts like a language is kept', () => {
    expect(notificationHref('/sqx/listings', 'uk')).toBe('/uk/sqx/listings')
  })

  it('[SEC-988-NOTIF-LINK-DENY] a foreign, protocol-relative, script, backslash, control-character or empty link gives null', () => {
    for (const link of ['https://evil.com/x', '//evil.com', 'javascript:alert(1)', '/\\evil.com', '/\t/evil.com', '/x\u0000y', 'https://lero.al.evil.com/x', '', null, undefined]) {
      expect(notificationHref(link, 'uk'), String(link)).toBeNull()
    }
  })
})
