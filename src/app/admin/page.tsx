import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getAdminDashboardData } from '@/modules/admin/dashboard/queries'
import { AdminDashboardView } from '@/modules/admin/dashboard/components/AdminDashboardView'

export default async function AdminDashboard() {
  const [locale, data] = await Promise.all([getAdminLocale(), getAdminDashboardData()])

  return <AdminDashboardView data={data} locale={locale} />
}
