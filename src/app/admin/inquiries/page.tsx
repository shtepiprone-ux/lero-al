// Redirect to /admin/inquiries/support (default historic view — preserves external links).
// V.3 (Task 252) split the single /admin/inquiries page into /support and /sales.
import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/auth/staff'

export default async function AdminInquiriesRedirect() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  redirect('/admin/inquiries/support')
}
