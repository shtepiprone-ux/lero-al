import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAllSettings } from '@/modules/admin/lib/settings'
import { Toaster } from '@/components/ui/sonner'
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
  const user = await getUser()

  if (!user) redirect('/auth/login?next=/admin')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAuthorized = profile?.role === 'admin' || profile?.role === 'moderator'
  if (!isAuthorized) redirect('/')

  const settings = await getAllSettings()
  const siteName = settings['site_name'] ?? 'Lero.al'

  const jar = await cookies()
  const locale = resolveLocale(jar.get(ADMIN_LOCALE_COOKIE)?.value)
  setRequestLocale(locale)
  const messages = MESSAGES[locale]

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminShell siteName={siteName} locale={locale}>{children}</AdminShell>
      <Toaster />
    </NextIntlClientProvider>
  )
}
