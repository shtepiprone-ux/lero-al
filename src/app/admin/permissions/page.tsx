import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions } from '@/modules/admin/actions/permissions'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'

export const metadata = { title: 'Permissions — Admin' }

export default async function AdminPermissionsPage() {
  await getAdminLocale()
  const permissions = await getModeratorPermissions()
  return <AdminPermissionsManager permissions={permissions} />
}
