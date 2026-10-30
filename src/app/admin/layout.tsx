import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { requireViewer } from '@/lib/auth/requireViewer'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAllSettings } from '@/modules/admin/lib/settings'
const ADMIN_LOCALE_COOKIE = 'admin-locale'
const ADMIN_LOCALE_DEFAULT = 'en'

// Static imports — all message files bundled, only selected one passed to provider.
import messagesSq from '../../../messages/sq.json'
import messagesEn from '../../../messages/en.json'
import messagesUk from '../../../messages/uk.json'
import messagesIt from '../../../messages/it.json'

type Locale = 'sq' | 'en' | 'uk' | 'it'

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  sq: messagesSq as unknown as Record<string, unknown>,
  en: messagesEn as unknown as Record<string, unknown>,
  uk: messagesUk as unknown as Record<string, unknown>,
  it: messagesIt as unknown as Record<string, unknown>,
}

function resolveLocale(raw: string | undefined): Locale {
  const supported: Locale[] = ['sq', 'en', 'uk', 'it']
  return supported.includes(raw as Locale) ? (raw as Locale) : ADMIN_LOCALE_DEFAULT as Locale
}

export const metadata = { title: 'Admin — Lero.al' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Resolve locale before any redirect so the login/forbidden URL is properly prefixed.
  const jar = await cookies()
  const locale = resolveLocale(jar.get(ADMIN_LOCALE_COOKIE)?.value)

  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role is not an administrator or
  // a moderator, and a failed lookup does not open the admin area.
  const viewer = await requireViewer()
  if (!viewer.ok && viewer.reason === 'unauthenticated') redirect(`/${locale}/auth/login?next=${encodeURIComponent('/admin')}&session=lost`)

  const isAuthorized = viewer.ok && (viewer.role === 'admin' || viewer.role === 'moderator')
  if (!isAuthorized) redirect(`/${locale}`)

  const settings = await getAllSettings()
  const siteName = settings['site_name'] ?? 'Lero.al'

  setRequestLocale(locale)
  const messages = MESSAGES[locale]

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminShell siteName={siteName} locale={locale}>{children}</AdminShell>
    </NextIntlClientProvider>
  )
}
