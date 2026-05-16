'use server'

import { cookies } from 'next/headers'

const SUPPORTED: readonly string[] = ['sq', 'en', 'uk', 'it']

export async function setAdminLocale(locale: string): Promise<void> {
  if (!SUPPORTED.includes(locale)) return
  const jar = await cookies()
  jar.set('admin-locale', locale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}
