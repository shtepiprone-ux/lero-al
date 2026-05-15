import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice, formatCount } from '@/lib/formatters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { ListChecks, Users, Eye, TrendingUp, Star, Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

async function getStats() {
  const db = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalListings },
    { count: activeListings },
    { count: premiumListings },
    { count: totalUsers },
    { count: newUsers },
    { count: openTickets },
    { data: recentListings },
    { data: locationRequestUsers, count: locationRequestCount },
  ] = await Promise.all([
    db.from('listings').select('*', { count: 'exact', head: true }),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    db.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).is('deleted_at', null),
    db.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('listings')
      .select('id, slug, title, status, is_premium, price, currency, created_at, owner:users!listings_user_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('users')
      .select('id, name, last_name, location_request', { count: 'exact' })
      .not('location_request', 'is', null)
      .is('deleted_at', null)
      .limit(5),
  ])

  return {
    totalListings, activeListings, premiumListings, totalUsers, newUsers, openTickets,
    recentListings: (recentListings ?? []) as unknown as RecentListing[],
    locationRequestUsers: (locationRequestUsers ?? []) as unknown as LocationRequestUser[],
    locationRequestCount: locationRequestCount ?? 0,
  }
}

interface RecentListing {
  id: string
  slug: string
  title: string
  status: string
  is_premium: boolean
  price: number
  currency: string
  created_at: string
  owner: { name: string | null } | null
}

interface LocationRequestUser {
  id: string
  name: string | null
  last_name: string | null
  location_request: { city: string; region?: string } | null
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | null
  sub?: string
  href?: string
  accent?: string
}

function StatCard({ icon: Icon, label, value, sub, href, accent = 'bg-primary/10 text-primary' }: StatCardProps) {
  const content = (
    <div className="bg-card rounded-2xl border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold">{formatCount(value ?? 0, 'sq')}</p>
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-xs text-primary mt-0.5 font-medium">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-status-success/10 text-status-success',
  inactive: 'bg-status-warning/10 text-status-warning',
  sold:     'bg-status-info/10 text-status-info',
  rented:   'bg-status-rented/10 text-status-rented',
  archived: 'bg-muted text-muted-foreground',
}

export default async function AdminDashboard() {
  const {
    totalListings, activeListings, premiumListings, totalUsers, newUsers, openTickets,
    recentListings, locationRequestUsers, locationRequestCount,
  } = await getStats()

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Загальний стан платформи Lero.al"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <StatCard icon={ListChecks} label="Всього оголошень" value={totalListings} href="/admin/listings" accent="bg-primary/10 text-primary" />
        </div>
        <StatCard icon={TrendingUp} label="Активних" value={activeListings} href="/admin/listings?status=active" accent="bg-status-success/10 text-status-success" />
        <StatCard icon={Star} label="Premium" value={premiumListings} href="/admin/listings" accent="bg-badge-premium/10 text-badge-premium" />
        <StatCard icon={Users} label="Користувачів" value={totalUsers} href="/admin/users" accent="bg-info/10 text-info" />
        <StatCard icon={Eye} label="Нових (7 днів)" value={newUsers} sub="користувачів" accent="bg-secondary text-secondary-foreground" />
        <StatCard icon={Clock} label="Відкрито тікетів" value={openTickets} href="/admin/support" accent="bg-status-warning/10 text-status-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── Location requests ── */}
        {locationRequestCount > 0 && (
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-status-warning/5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-status-warning" />
                <h2 className="font-semibold text-sm">Запити на населені пункти</h2>
                <span className="bg-status-warning text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {locationRequestCount}
                </span>
              </div>
              <Link
                href="/admin/users?location_request=1"
                className="text-xs text-primary hover:underline"
              >
                Переглянути всі →
              </Link>
            </div>
            <div className="divide-y">
              {locationRequestUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-status-warning shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
                    </p>
                    {u.location_request && (
                      <p className="text-xs text-muted-foreground truncate">
                        {u.location_request.city}
                        {u.location_request.region ? `, ${u.location_request.region}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-primary shrink-0">Розглянути →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent listings ── */}
        <div className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${locationRequestCount > 0 ? '' : 'lg:col-span-2'}`}>
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Останні оголошення</h2>
            <Link href="/admin/listings" className="text-xs text-primary hover:underline">
              Всі оголошення →
            </Link>
          </div>
          <div className="divide-y">
            {recentListings.map((l) => (
              <div key={l.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l.owner?.name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium" />}
                  <span className="text-sm font-medium">{formatPrice(l.price, l.currency, 'sq')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[l.status] ?? ''}`}>
                    {l.status}
                  </span>
                  <RelativeTime date={l.created_at} className="text-xs text-muted-foreground hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
