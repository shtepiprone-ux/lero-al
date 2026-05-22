import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminEmailTemplatesManager } from '@/components/admin/AdminEmailTemplatesManager'
import type { EmailTemplate } from '@/types/database'

export const metadata = { title: 'Email Templates — Admin' }

export default async function AdminEmailTemplatesPage() {
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()

  const { data, count } = await db
    .from('email_templates')
    .select('*', { count: 'exact' })
    .order('key')
    .order('locale')

  const templates = (data ?? []) as EmailTemplate[]

  const me = await getUser()
  const supabase = await createClient()
  const { data: myProfile } = await supabase.from('users').select('role').eq('id', me!.id).single()
  const isAdmin = myProfile?.role === 'admin'

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('email_templates_title')}
        subtitle={t('email_templates_subtitle', { count: count ?? 0 })}
      />
      <AdminEmailTemplatesManager templates={templates} isAdmin={isAdmin} />
    </div>
  )
}
