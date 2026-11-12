import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { hasPermission } from '@/lib/auth/permissions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminReportsManager, type ReportRow } from '@/components/admin/AdminReportsManager'
import { parseReportStatusParam } from '@/components/admin/reportStatusFilter'

export const metadata = { title: 'Reports — Admin' }

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  const sp = await searchParams
  const initialFilter = parseReportStatusParam(sp.status)
  const locale = await getAdminLocale()
  const t = await getTranslations('admin.pages')

  const [canOverrideReportStatus, canDeleteReports] = await Promise.all([
    hasPermission('reports.status_override'),
    hasPermission('reports.delete'),
  ])

  const db = createAdminClient()

  const { data: reports, count } = await db
    .from('listing_reports')
    .select(
      'id, listing_id, user_id, reason, comment, status, created_at, listing:listings(id, title, slug, owner:users!listings_user_id_fkey(id, name, user_type)), reporter:users!listing_reports_user_id_fkey(id, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <AdminPageFrame width="shell">
      <AdminPageHeader
        title={t('reports_title')}
        subtitle={t('reports_subtitle', { count: count ?? 0 })}
      />
      <AdminReportsManager
        reports={(reports ?? []) as unknown as ReportRow[]}
        locale={locale}
        canOverrideReportStatus={canOverrideReportStatus}
        canDeleteReports={canDeleteReports}
        initialFilter={initialFilter}
        now={new Date().toISOString()}
      />
    </AdminPageFrame>
  )
}
