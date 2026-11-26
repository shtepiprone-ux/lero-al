import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffPage } from '@/lib/auth/staff'
import { requireViewer } from '@/lib/auth/requireViewer'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminUserProfile } from '@/components/admin/AdminUserProfile'
import { hasPermission } from '@/lib/auth/permissions'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.users' })
  await getAdminLocale()
  const t = await getTranslations('admin.user_profile')
  return { title: `${t('header.new_user_title')} — Admin` }
}

export default async function AdminUserNewPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.users' })
  const db = createAdminClient()
  const [
    { data: cities },
    { data: regions },
  ] = await Promise.all([
    db.from('locations').select('id, name_al, region_id').in('type', ['city', 'village']).order('name_al'),
    db.from('locations').select('id, name_al').eq('type', 'region').order('name_al'),
  ])

  // The role comes from requireViewer() (Task 923 R44).
  const viewer = await requireViewer()
  const isAdmin = viewer.ok && viewer.role === 'admin'
  const canClearHistory = await hasPermission('audit.clear_history').catch(() => false)

  return (
    <AdminPageFrame>
      <AdminUserProfile
        user={null}
        email=""
        cities={cities ?? []}
        regions={regions ?? []}
        changeLog={[]}
        statusHistory={[]}
        isAdmin={isAdmin}
        canClearHistory={canClearHistory}
      />
    </AdminPageFrame>
  )
}
