import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/auth/staff'

export default async function AdminLegalPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  redirect('/admin/pages')
}
