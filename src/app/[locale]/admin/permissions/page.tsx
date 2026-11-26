import { getFormatter, getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents, type PermissionData } from '@/modules/admin/actions/permissions'
import type { AccessKey } from '@/lib/auth/adminPages'
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
  // Task 988 R5-1: the dates are formatted here, on the server: a browser without the locale's date data (Chrome has no `sq`) would render other text and fail hydration (React #418)
  const format = await getFormatter()
  const updatedDates: Partial<Record<AccessKey, string>> = {}
  for (const [key, { updated_at }] of Object.entries(permissions) as [AccessKey, PermissionData][]) {
    if (updated_at) updatedDates[key] = format.dateTime(new Date(updated_at), { dateStyle: 'medium' })
  }
  const eventDates: Record<string, string> = Object.fromEntries(
    (events ?? []).map(ev => [ev.id, format.dateTime(new Date(ev.created_at), { dateStyle: 'medium', timeStyle: 'short' })]),
  )
  return (
    <AdminPageFrame>
      <AdminPageHeader title={t('title')} subtitle={t('description')} />
      <AdminPermissionsManager permissions={permissions} events={events} updatedDates={updatedDates} eventDates={eventDates} />
    </AdminPageFrame>
  )
}
