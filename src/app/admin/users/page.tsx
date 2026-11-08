import { ClientLink } from '@/lib/navigation/ClientLink'
import { requireStaffPage } from '@/lib/auth/staff'
import { Button, Group, Text } from '@mantine/core'
import { UserPlus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminUsersTable, type AdminUser, type VerifiedAgent } from '@/components/admin/AdminUsersTable'
import { theme } from '@/design-system/mantine/theme'
import { orContains } from '@/lib/postgrest/escape'

export const metadata = { title: 'Users — Admin' }

// Server Component: tokens are read straight from the theme object (precedent `src/app/admin/reports/page.tsx`);
// `!` because `createTheme()`'s return type is deep-partial.
const iconSize = theme.other!.iconSize!

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const sp = await searchParams
  const tab = sp.tab ?? 'all'
  const role = sp.role ?? ''
  const status = sp.status ?? ''
  const q = sp.q ?? ''
  const qTrimmed = q.trim()
  const locationRequest = sp.location_request === '1'
  const page = Math.max(1, Number(sp.page ?? 1))
  const PER_PAGE = 25
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = createAdminClient()

  // Fetch main users list (only when tab=all)
  let users: AdminUser[] = []
  let count = 0
  if (tab === 'all') {
    let query = supabase
      .from('users')
      .select('id, public_id, name, last_name, phone, user_type, role, is_verified, company_name, status, location_request, created_at, last_seen_at', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (role) query = query.eq('role', role)
    if (status) query = query.eq('status', status)
    if (locationRequest) query = query.not('location_request', 'is', null)
    if (qTrimmed) {
      const words = qTrimmed.split(/\s+/).filter(Boolean)
      // OR across all words and all text fields (no UUID ilike — causes DB type error).
      // Searching "John Doe" finds users where any field contains "John" or "Doe".
      // search text is a VALUE: quoted and escaped, never part of the filter (Task 923 Revision 7, S8)
      const conditions = words.map(w => orContains(['name', 'last_name', 'phone', 'company_name'], w))
      const FULL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (FULL_UUID.test(qTrimmed)) conditions.push(`id.eq.${qTrimmed}`)
      query = query.or(conditions.join(','))
    }

    const { data, count: total } = await query
    users = (data ?? []) as unknown as AdminUser[]
    count = total ?? 0
  }

  // Fetch verified agents (only when tab=verified)
  let verifiedAgents: VerifiedAgent[] = []
  if (tab === 'verified') {
    const { data } = await supabase
      .from('users')
      .select('id, name, company_name, created_at')
      .eq('is_verified', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100)
    verifiedAgents = (data ?? []) as VerifiedAgent[]
  }

  return (
    <AdminPageFrame width="shell">
      <AdminPageHeader
        title={t('users_title')}
        subtitle={locationRequest ? t('users_location_filter') : undefined}
        notice={sp.notice === 'user_gone' ? t('users_gone_notice') : undefined}
        action={
          <Group gap="sm" wrap="nowrap">
            {tab === 'all' && (
              <Text size="sm" c="dimmed">
                {t('users_total', { count })}
              </Text>
            )}
            <Button component={ClientLink} href="/admin/users/new" leftSection={<UserPlus size={iconSize.standard} />}>
              {t('users_new_btn')}
            </Button>
          </Group>
        }
      />
      <AdminUsersTable
        users={users}
        total={count}
        page={page}
        perPage={PER_PAGE}
        activeRole={role}
        activeStatus={status}
        locationRequestFilter={locationRequest}
        searchQuery={q}
        activeTab={tab}
        verifiedAgents={verifiedAgents}
      />
    </AdminPageFrame>
  )
}
