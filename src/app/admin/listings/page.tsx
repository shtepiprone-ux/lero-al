import { createAdminClient } from '@/lib/supabase/admin'
import { AdminListingsTable } from '@/components/admin/AdminListingsTable'

export const metadata = { title: 'Listings — Admin' }

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const status = sp.status ?? ''
  const page = Math.max(1, Number(sp.page ?? 1))
  const PER_PAGE = 25
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = createAdminClient()
  let query = supabase
    .from('listings')
    .select(`
      id, slug, title, price, currency, listing_type, property_type,
      status, is_premium, views_count, created_at,
      owner:users!listings_user_id_fkey(id, name, user_type)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status as any)

  const { data: listings, count } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
        <span className="text-sm text-muted-foreground">{count ?? 0} total</span>
      </div>
      <AdminListingsTable
        listings={listings ?? []}
        total={count ?? 0}
        page={page}
        perPage={PER_PAGE}
        activeStatus={status}
      />
    </div>
  )
}
