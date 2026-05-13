import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['sq', 'en', 'uk', 'it'],
  defaultLocale: 'sq',
  // Disable auto-detection from Accept-Language header.
  // The site targets the Albanian market — sq is always the default.
  // Users switch manually via the language switcher in the Header.
  localeDetection: false,
})