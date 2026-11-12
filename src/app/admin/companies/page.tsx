import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminCompaniesManager } from '@/components/admin/AdminCompaniesManager'
import type { Company } from '@/types/database'

export const metadata = { title: 'Companies — Admin' }

export default async function AdminCompaniesPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  await getAdminLocale()
  const t = await getTranslations('admin.pages')

  const db = createAdminClient()

  const [{ data: companies, count }, { data: agentRows }] = await Promise.all([
    db
      .from('companies')
      .select('id, name, logo_url, created_at', { count: 'exact' })
      .order('name'),
    db
      .from('users')
      .select('company_id')
      .not('company_id', 'is', null)
      .in('status', ['active', 'inactive']),
  ])

  const agentCountMap: Record<string, number> = {}
  for (const row of agentRows ?? []) {
    if (row.company_id) {
      agentCountMap[row.company_id] = (agentCountMap[row.company_id] ?? 0) + 1
    }
  }

  const rows = (companies ?? [] as Company[]).map(c => ({
    ...c,
    agentCount: agentCountMap[c.id] ?? 0,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('companies_title')}
        subtitle={t('companies_subtitle', { count: count ?? 0 })}
      />
      <AdminCompaniesManager companies={rows} now={new Date().toISOString()} />
    </div>
  )
}
