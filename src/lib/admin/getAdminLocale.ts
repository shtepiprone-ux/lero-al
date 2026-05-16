import { cookies } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'

type Locale = 'sq' | 'en' | 'uk' | 'it'
const SUPPORTED: Locale[] = ['sq', 'en', 'uk', 'it']
const ADMIN_LOCALE_COOKIE = 'admin-locale'
const DEFAULT: Locale = 'en'

export async function getAdminLocale(): Promise<Locale> {
  const jar = await cookies()
  const raw = jar.get(ADMIN_LOCALE_COOKIE)?.value
  const locale: Locale = SUPPORTED.includes(raw as Locale) ? (raw as Locale) : DEFAULT
  setRequestLocale(locale)
  return locale
}
