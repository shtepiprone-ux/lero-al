import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents } from '@/modules/admin/actions/permissions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'

export const metadata = { title: 'Permissions — Admin' }

export default async function AdminPermissionsPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.permissions')
  const [permissions, events] = await Promise.all([
    getModeratorPermissions(),
    getPermissionEvents(),
  ])
  return (
    <AdminPageFrame width="panel" gutter="xl" centered={false}>
      <AdminPageHeader title={t('title')} subtitle={t('description')} />
      <AdminPermissionsManager permissions={permissions} events={events} />
    </AdminPageFrame>
  )
}
