import { redirect } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAllSettings } from '@/modules/admin/lib/settings'
import messages from '../../../messages/en.json'

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

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <AdminShell siteName={siteName}>{children}</AdminShell>
    </NextIntlClientProvider>
  )
}
