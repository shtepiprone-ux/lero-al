import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminListingsTable } from '@/components/admin/AdminListingsTable'

export const metadata = { title: 'Listings — Admin' }

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const sp = await searchParams
  const tab = sp.tab ?? 'all'
  const status = sp.status ?? ''
  // Keep raw value (with spaces) so the client input re-sync works correctly.
  // Trimmed value is used only for DB queries below.
  const q = sp.q ?? ''
  const qTrimmed = q.trim()
  const page = Math.max(1, Number(sp.page ?? 1))
  const PER_PAGE = 25
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = createAdminClient()

  // Resolve owner IDs for agent name / email search (two-step lookup)
  let ownerIds: string[] = []
  if (qTrimmed) {
    const { data: nameMatches } = await supabase
      .from('users')
      .select('id')
      .or(`name.ilike.%${qTrimmed}%,last_name.ilike.%${qTrimmed}%`)
      .limit(100)
    ownerIds = (nameMatches ?? []).map(u => u.id)

    // Email lives in auth.users — requires the admin_search_users_by_email RPC
    try {
      const { data: emailMatches } = await supabase
        .rpc('admin_search_users_by_email', { q: qTrimmed })
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
      id, public_id, slug, title, price, currency, listing_type, property_type,
      status, is_premium, views_count, created_at,
      owner:users!listings_user_id_fkey(id, name, user_type)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Premium tab: filter to premium only
  if (tab === 'premium') query = query.eq('is_premium', true)

  if (status) query = query.eq('status', status)
  if (qTrimmed) {
    const words = qTrimmed.split(/\s+/).filter(Boolean)

    // Each word must appear in title (AND). Multiple words use nested and() inside or().
    // id.ilike on UUID causes a DB type error → use only text columns in or().
    const wordConds = words.map(w => `title.ilike.%${w}%`).join(',')
    const titleFilter = words.length > 1 ? `and(${wordConds})` : wordConds

    const orParts: string[] = [titleFilter]
    if (ownerIds.length > 0) orParts.push(`user_id.in.(${ownerIds.join(',')})`)

    // Exact UUID match when q is a full UUID
    const FULL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (FULL_UUID.test(qTrimmed)) orParts.push(`id.eq.${qTrimmed}`)

    query = query.or(orParts.join(','))
  }

  const { data: listings, count } = await query

  return (
    <AdminListingsTable
      pageTitle={t('listings_title')}
      listings={(listings ?? []) as unknown as import('@/components/admin/AdminListingsTable').AdminListing[]}
      total={count ?? 0}
      page={page}
      perPage={PER_PAGE}
      activeStatus={status}
      searchQuery={q}
      activeTab={tab}
    />
  )
}
