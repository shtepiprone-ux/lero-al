import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { adminHref } from '@/lib/auth/adminPages'

export default async function AdminLegalPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.pages' })
  redirect(adminHref(await getAdminLocale(), '/admin/pages'))
}
