// Redirect to the admin's inquiries/support page (default historic view — preserves external links), under the language slug (Task 988).
// V.3 (Task 252) split the single /admin/inquiries page into /support and /sales.
import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { adminHref } from '@/lib/auth/adminPages'

export default async function AdminInquiriesRedirect() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.inquiries_support' })
  redirect(adminHref(await getAdminLocale(), '/admin/inquiries/support'))
}
