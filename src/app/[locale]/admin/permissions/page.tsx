import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents } from '@/modules/admin/actions/permissions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ adminOnly: true })
  await getAdminLocale()
  const t = await getTranslations('admin.permissions')
  return { title: `${t('title')} — Admin` }
}

export default async function AdminPermissionsPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  // Task 923 R75 (e): only an administrator opens the permissions screen and reads the switches (Task 1007: `adminOnly`, a moderator gets notFound() from the guard)
  await requireStaffPage({ adminOnly: true })
  await getAdminLocale()
  const t = await getTranslations('admin.permissions')
  const [permissions, events] = await Promise.all([
    getModeratorPermissions(),
    getPermissionEvents(),
  ])
  return (
    <AdminPageFrame>
      <AdminPageHeader title={t('title')} subtitle={t('description')} />
      <AdminPermissionsManager permissions={permissions} events={events} />
    </AdminPageFrame>
  )
}
