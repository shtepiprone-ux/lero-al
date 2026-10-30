import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/auth/staff'
import { getLocale } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { AdminUserProfile } from '@/components/admin/AdminUserProfile'
import { hasPermission } from '@/lib/auth/permissions'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { UserChangeLog, UserStatusHistory } from '@/types/database'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { userLocation } from '@/modules/admin/lib/userLocation'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('users').select('name, last_name').eq('id', id).single()
  const name = [data?.name, data?.last_name].filter(Boolean).join(' ') || 'Профіль'
  return { title: `${name} — Admin` }
}

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  const { id } = await params
  const db = createAdminClient()

  // Simple select — no FK-name joins that break when constraints have different names
  const [
    { data: user, error: userError },
    { data: cities },
    { data: regions },
  ] = await Promise.all([
    db.from('users').select('*').eq('id', id).maybeSingle(),
    db.from('locations').select('id, name_al, region_id').in('type', ['city', 'village']).order('name_al'),
    db.from('locations').select('id, name_al').eq('type', 'region').order('name_al'),
  ])

  if (userError) console.error('AdminUserProfilePage: user query failed', { error: userError, id })
  // Task 923 R139 (D85, D86): a missing or deleted account opens the Users list, which says why
  if (!user) redirect('/admin/users?notice=user_gone')

  // Soft-delete check
  if (user.deleted_at) redirect('/admin/users?notice=user_gone')

  // Change log — table may not exist yet; degrade gracefully
  let changeLog: UserChangeLog[] = []
  try {
    const { data: log } = await db
      .from('user_change_log')
      .select('*')
      .eq('user_id', id)
      .order('changed_at', { ascending: false })
      .limit(20)
    changeLog = log ?? []
  } catch {}

  // Status history — new table; degrade gracefully if migration not yet applied
  let statusHistory: UserStatusHistory[] = []
  try {
    const { data: hist } = await db
      .from('user_status_history')
      .select('*')
      .eq('user_id', id)
      .order('changed_at', { ascending: false })
      .limit(10)
    statusHistory = hist ?? []
  } catch {}

  // Email + confirmation status from auth
  let email = ''
  let emailConfirmedAt: string | null = null
  try {
    const { data: authUser } = await db.auth.admin.getUserById(id)
    email = authUser?.user?.email ?? ''
    emailConfirmedAt = authUser?.user?.email_confirmed_at ?? null
  } catch {}

  // Current viewer's role
  // The role comes from requireViewer() (Task 923 R44).
  const viewer = await requireViewer()
  const isAdmin = viewer.ok && viewer.role === 'admin'
  const canClearHistory = await hasPermission('audit.clear_history').catch(() => false)

  // Pre-format timestamps on the server so the client renders verbatim strings.
  // Prevents SSR/CSR Intl locale-data divergence (sq ICU differs between Node.js and Chromium).
  const locale = await getLocale()
  const changeLogDates = Object.fromEntries(changeLog.map(e => [e.id, formatDateTime(e.changed_at, locale)]))
  const statusHistoryDates = Object.fromEntries(statusHistory.map(e => [e.id, formatDateTime(e.changed_at, locale)]))
  const suspendedUntilFormatted = user.status === 'blocked' && user.suspended_until
    ? formatDate(user.suspended_until, locale)
    : null

  return (
    <AdminPageFrame width="page">
      <AdminUserProfile
        user={{ ...user, location: userLocation(user.location_id, cities ?? [], regions ?? []) }}
        email={email}
        emailConfirmedAt={emailConfirmedAt}
        cities={cities ?? []}
        regions={regions ?? []}
        changeLog={changeLog}
        statusHistory={statusHistory}
        isAdmin={isAdmin}
        canClearHistory={canClearHistory}
        changeLogDates={changeLogDates}
        statusHistoryDates={statusHistoryDates}
        suspendedUntilFormatted={suspendedUntilFormatted}
      />
    </AdminPageFrame>
  )
}
