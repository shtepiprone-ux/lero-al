import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents } from '@/modules/admin/actions/permissions'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'

export const metadata = { title: 'Permissions — Admin' }

export default async function AdminPermissionsPage() {
  await getAdminLocale()
  const [permissions, events] = await Promise.all([
    getModeratorPermissions(),
    getPermissionEvents(),
  ])
  return <AdminPermissionsManager permissions={permissions} events={events} />
}
