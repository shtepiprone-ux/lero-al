import { createAdminClient } from '@/lib/supabase/admin'
import { AdminListingsTable } from '@/components/admin/AdminListingsTable'

export const metadata = { title: 'Listings — Admin' }

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const tab = sp.tab ?? 'all'
  const status = sp.status ?? ''
  const q = sp.q?.trim() ?? ''
  const page = Math.max(1, Number(sp.page ?? 1))
  const PER_PAGE = 25
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = createAdminClient()

  // Resolve owner IDs for agent name / email search (two-step lookup)
  let ownerIds: string[] = []
  if (q) {
    const { data: nameMatches } = await supabase
      .from('users')
      .select('id')
      .or(`name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(100)
    ownerIds = (nameMatches ?? []).map(u => u.id)

    // Email lives in auth.users — requires the admin_search_users_by_email RPC
    try {
      const { data: emailMatches } = await supabase
        .rpc('admin_search_users_by_email', { q })
      if (emailMatches) {
        const emailIds = (emailMatches as { id: string }[]).map(r => r.id)
        ownerIds = [...new Set([...ownerIds, ...emailIds])]
      }
    } catch {
      // RPC not yet applied — email search silently skipped
    }
  }

  let query = supabase
    .from('listings')
    .select(`
      id, slug, title, price, currency, listing_type, property_type,
      status, is_premium, views_count, created_at,
      owner:users!listings_user_id_fkey(id, name, user_type)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Premium tab: filter to premium only
  if (tab === 'premium') query = query.eq('is_premium', true)

  if (status) query = query.eq('status', status)
  if (q) {
    const conditions = [`id.ilike.%${q}%`, `title.ilike.%${q}%`]
    if (ownerIds.length > 0) conditions.push(`user_id.in.(${ownerIds.join(',')})`)
    query = query.or(conditions.join(','))
  }

  const { data: listings, count } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Оголошення</h1>
        <span className="text-sm text-muted-foreground">{count ?? 0} всього</span>
      </div>
      <AdminListingsTable
        listings={(listings ?? []) as unknown as import('@/components/admin/AdminListingsTable').AdminListing[]}
        total={count ?? 0}
        page={page}
        perPage={PER_PAGE}
        activeStatus={status}
        searchQuery={q}
        activeTab={tab}
      />
    </div>
  )
}
