import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents } from '@/modules/admin/actions/permissions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'

export const metadata = { title: 'Permissions — Admin' }

export default async function AdminPermissionsPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  const { role } = await requireStaffPage()
  // Task 923 R75 (e): only an administrator opens the permissions screen and reads the switches
  if (role !== 'admin') notFound()
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
