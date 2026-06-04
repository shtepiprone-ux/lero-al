import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminUsersTable, type AdminUser, type VerifiedAgent } from '@/components/admin/AdminUsersTable'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
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
      const conditions = words.flatMap(w => [
        `name.ilike.%${w}%`,
        `last_name.ilike.%${w}%`,
        `phone.ilike.%${w}%`,
        `company_name.ilike.%${w}%`,
      ])
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
    <div className="p-6 max-w-10xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('users_title')}</h1>
          {locationRequest && (
            <p className="text-sm text-status-warning mt-0.5">{t('users_location_filter')}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tab === 'all' && <span className="text-sm text-muted-foreground">{t('users_total', { count })}</span>}
          <Link
            href="/admin/users/new"
            className={cn(buttonVariants({ size: 'lg' }), 'max-sm:w-auto')}
          >
            <UserPlus className="h-4 w-4" />
            {t('users_new_btn')}
          </Link>
        </div>
      </div>
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
    </div>
  )
}
