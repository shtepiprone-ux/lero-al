import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const role = sp.role ?? ''
  const locationRequest = sp.location_request === '1'
  const page = Math.max(1, Number(sp.page ?? 1))
  const PER_PAGE = 25
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = createAdminClient()
  let query = supabase
    .from('users')
    .select('id, name, last_name, phone, user_type, role, is_verified, company_name, status, location_request, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (role) query = query.eq('role', role as any)
  if (locationRequest) query = query.not('location_request', 'is', null)

  const { data: users, count } = await query

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
          <span className="text-sm text-muted-foreground">{count ?? 0} всього</span>
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
        users={users ?? []}
        total={count ?? 0}
        page={page}
        perPage={PER_PAGE}
        activeRole={role}
        locationRequestFilter={locationRequest}
      />
    </div>
  )
}
