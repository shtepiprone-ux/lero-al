// Redirect to /admin/inquiries/support (default historic view — preserves external links).
// V.3 (Task 252) split the single /admin/inquiries page into /support and /sales.
import { redirect } from 'next/navigation'

export default function AdminInquiriesRedirect() {
  redirect('/admin/inquiries/support')
}
