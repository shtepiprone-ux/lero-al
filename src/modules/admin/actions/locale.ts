'use server'

import { cookies } from 'next/headers'

const SUPPORTED: readonly string[] = ['sq', 'en', 'uk', 'it']
export const ADMIN_LOCALE_COOKIE = 'admin-locale'
export const ADMIN_LOCALE_DEFAULT = 'en'

export async function setAdminLocale(locale: string): Promise<void> {
  if (!SUPPORTED.includes(locale)) return
  const jar = await cookies()
  jar.set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}
