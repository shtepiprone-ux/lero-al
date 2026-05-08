import { redirect } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminShell } from '@/components/admin/AdminShell'
import messages from '../../../messages/en.json'

export const metadata = { title: 'Admin — Shtepi.al' }

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

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <AdminShell>{children}</AdminShell>
    </NextIntlClientProvider>
  )
}
