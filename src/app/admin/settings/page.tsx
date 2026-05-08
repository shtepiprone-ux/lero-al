import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { getArchivedNoindexDays } from '@/modules/admin/lib/settings'

export const metadata = { title: 'Налаштування — Admin' }

export default async function AdminSettingsPage() {
  const archivedNoindexDays = await getArchivedNoindexDays()

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <AdminPageHeader
        title="Налаштування сайту"
        subtitle="Загальні налаштування платформи Shtepi.al"
      />
      <AdminSettings initialSettings={{ archived_noindex_days: archivedNoindexDays }} />
    </div>
  )
}
