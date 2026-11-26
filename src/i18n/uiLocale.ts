/**
 * Task 988 (owner decisions O988-1, O988-5): the language of this browser session. A guest keeps the language of the first page of the session, or the one the
 * switcher chose, in the cookie `lero_ui_locale`; the request proxy sends every page in another language (or none) to it. A signed-in person's account language
 * wins over it, and the proxy keeps the cookie equal to the account language, so a person who signs out keeps it for the rest of the session.
 * A session cookie (no Max-Age, no Expires: it ends with the browser session), `Path=/`, `SameSite=Lax` (it reaches a link followed from another site), `HttpOnly`,
 * `Secure` in production. Only the four exact codes are ever written or read; any other value is ignored. This file imports nothing at run time.
 */
export const APP_LOCALES = ['sq', 'en', 'uk', 'it'] as const
export type AppLocale = typeof APP_LOCALES[number]

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value)
}

export const UI_LOCALE_COOKIE = 'lero_ui_locale'

export function uiLocaleCookieOptions(): { path: '/'; sameSite: 'lax'; httpOnly: true; secure: boolean } {
  return { path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}
