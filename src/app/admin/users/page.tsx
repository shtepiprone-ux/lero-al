import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersTable, type AdminUser, type VerifiedAgent } from '@/components/admin/AdminUsersTable'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const tab = sp.tab ?? 'all'
  const role = sp.role ?? ''
  const q = sp.q?.trim() ?? ''
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
      .select('id, name, last_name, phone, user_type, role, is_verified, company_name, status, location_request, created_at', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (role) query = query.eq('role', role)
    if (locationRequest) query = query.not('location_request', 'is', null)
    if (q) query = query.or(`id.ilike.%${q}%,name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`)

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Користувачі</h1>
          {locationRequest && (
            <p className="text-sm text-status-warning mt-0.5">Фільтр: запити на населені пункти</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tab === 'all' && <span className="text-sm text-muted-foreground">{count} всього</span>}
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Новий користувач
          </Link>
        </div>
      </div>
      <AdminUsersTable
        users={users}
        total={count}
        page={page}
        perPage={PER_PAGE}
        activeRole={role}
        locationRequestFilter={locationRequest}
        searchQuery={q}
        activeTab={tab}
        verifiedAgents={verifiedAgents}
      />
    </div>
  )
}
