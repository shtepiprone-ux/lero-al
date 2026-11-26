import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['sq', 'en', 'uk', 'it'],
  defaultLocale: 'sq',
  // Disable auto-detection from Accept-Language header.
  // The site targets the Albanian market — sq is always the default.
  // Users switch manually via the language switcher in the Header.
  localeDetection: false,
  // Task 988, owner decision O988-1 (2026-11-26): the language cookie next-intl writes lives 10 days from its last write, so the choice outlives the browser session
  localeCookie: { maxAge: 60 * 60 * 24 * 10 },
})