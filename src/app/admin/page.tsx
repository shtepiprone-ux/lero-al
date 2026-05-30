import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { formatCount } from '@/lib/formatters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminDashboardRecentListings, type DashboardListing } from '@/components/admin/AdminDashboardRecentListings'
import { ListChecks, Users, Eye, TrendingUp, Clock, MapPin, Flag } from 'lucide-react'
import Link from 'next/link'

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getStats() {
  const db = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: activeListings },
    { count: newListings7d },
    { count: totalUsers },
    { count: newUsers7d },
    { count: openTickets },
    { count: pendingReports },
    { count: soldListings },
    { count: rentedListings },
    { count: inactiveListings },
    { count: archivedListings },
    { data: recentListings },
    { data: pendingReportsList },
    { data: locationRequestUsers, count: locationRequestCount },
  ] = await Promise.all([
    // Stat cards (P0)
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    db.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).is('deleted_at', null),
    db.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('listing_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

    // Status breakdown (P0)
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'rented'),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'archived'),

    // Recent listings (last 8, Epic K clickable)
    db.from('listings')
      .select('id, slug, title, status, is_premium, price, currency, created_at, owner:users!listings_user_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(8),

    // Pending reports list (5, always-visible panel)
    db.from('listing_reports')
      .select('id, reason, status, created_at, listing:listings!listing_reports_listing_id_fkey(title, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),

    // Location requests (conditional panel)
    db.from('users')
      .select('id, name, last_name, location_request', { count: 'exact' })
      .not('location_request', 'is', null)
      .is('deleted_at', null)
      .limit(5),
  ])

  return {
    activeListings, newListings7d, totalUsers, newUsers7d, openTickets, pendingReports,
    soldListings, rentedListings, inactiveListings, archivedListings,
    recentListings: (recentListings ?? []) as unknown as DashboardListing[],
    pendingReportsList: (pendingReportsList ?? []) as unknown as PendingReport[],
    locationRequestUsers: (locationRequestUsers ?? []) as LocationRequestUser[],
    locationRequestCount: locationRequestCount ?? 0,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingReport {
  id: string
  reason: string
  status: string
  created_at: string
  listing: { title: string; slug: string } | null
}

interface LocationRequestUser {
  id: string
  name: string | null
  last_name: string | null
  location_request: { city: string; region?: string } | null
}

// ── Sub-components (Server) ───────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, href, accent = 'bg-primary/10 text-primary',
}: {
  icon: React.ElementType
  label: string
  value: number | null
  sub?: string
  href?: string
  accent?: string
}) {
  const content = (
    <div className="bg-card rounded-2xl border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold">{formatCount(value ?? 0, 'sq')}</p>
        <p className="text-sm text-muted-foreground break-words min-w-0">{label}</p>
        {sub && <p className="text-xs text-primary mt-0.5 font-medium">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function StatusBar({ label, count, total, colorClass }: {
  label: string; count: number; total: number; colorClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 shrink-0 break-words">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="text-sm font-semibold tabular-nums w-14 text-right shrink-0">
        {formatCount(count, 'sq')}
      </span>
      <span className="text-xs text-muted-foreground w-9 text-right shrink-0">{pct}%</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const locale = await getAdminLocale()
  const [t, tl] = await Promise.all([
    getTranslations('admin.dashboard'),
    getTranslations('listing'),
  ])

  const {
    activeListings, newListings7d, totalUsers, newUsers7d, openTickets, pendingReports,
    soldListings, rentedListings, inactiveListings, archivedListings,
    recentListings, pendingReportsList, locationRequestUsers, locationRequestCount,
  } = await getStats()

  const totalListings =
    (activeListings ?? 0) + (soldListings ?? 0) + (rentedListings ?? 0) +
    (inactiveListings ?? 0) + (archivedListings ?? 0)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <AdminPageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* ── 6 KPI stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={TrendingUp} label={t('stat_active')} value={activeListings}
          href="/admin/listings?status=active" accent="bg-status-success/10 text-status-success"
        />
        <StatCard
          icon={ListChecks} label={t('stat_new_listings_7d')} value={newListings7d}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Users} label={t('stat_users')} value={totalUsers}
          href="/admin/users" accent="bg-secondary text-secondary-foreground"
        />
        <StatCard
          icon={Eye} label={t('stat_new_7d')} value={newUsers7d}
          sub={t('stat_new_7d_sub')} accent="bg-secondary text-secondary-foreground"
        />
        <StatCard
          icon={Clock} label={t('stat_open_tickets')} value={openTickets}
          href="/admin/support" accent="bg-status-warning/10 text-status-warning"
        />
        <StatCard
          icon={Flag} label={t('stat_pending_reports')} value={pendingReports}
          href="/admin/reports" accent="bg-destructive/10 text-destructive"
        />
      </div>

      {/* ── Main content grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Recent listings — Epic K §11 canonical (clickable title) ──── */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">{t('recent_listings_title')}</h2>
            <Link href="/admin/listings" className="text-xs text-primary hover:underline">
              {t('recent_listings_all')}
            </Link>
          </div>
          <AdminDashboardRecentListings listings={recentListings} locale={locale} />
        </div>

        {/* ── Right column: reports + location requests ──────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Pending Reports — always visible (Trust & Safety health indicator) */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-destructive shrink-0" />
                <h2 className="font-semibold text-sm">{t('pending_reports_title')}</h2>
                {(pendingReports ?? 0) > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingReports}
                  </span>
                )}
              </div>
              <Link href="/admin/reports" className="text-xs text-primary hover:underline">
                {t('pending_reports_view_all')}
              </Link>
            </div>
            {(pendingReports ?? 0) === 0 ? (
              <p className="text-sm text-status-success px-5 py-4 flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 shrink-0" />
                {t('pending_reports_empty')}
              </p>
            ) : (
              <div className="divide-y">
                {pendingReportsList.map(r => (
                  <Link
                    key={r.id}
                    href="/admin/reports"
                    className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tl(`report_reason_${r.reason}` as Parameters<typeof tl>[0])}
                      </p>
                      {r.listing && (
                        <p className="text-xs text-muted-foreground truncate">{r.listing.title}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Location Requests — conditional (only when > 0) */}
          {locationRequestCount > 0 && (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between bg-status-warning/5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-status-warning shrink-0" />
                  <h2 className="font-semibold text-sm">{t('location_requests_title')}</h2>
                  <span className="bg-status-warning text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {locationRequestCount}
                  </span>
                </div>
                <Link href="/admin/users?location_request=1" className="text-xs text-primary hover:underline">
                  {t('location_requests_view_all')}
                </Link>
              </div>
              <div className="divide-y">
                {locationRequestUsers.map(u => (
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
                    <span className="text-xs text-primary shrink-0">{t('location_requests_review')}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Listing status breakdown ─────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <h2 className="font-semibold mb-4">{t('status_breakdown_title')}</h2>
        <div className="flex flex-col gap-3 max-w-lg">
          <StatusBar label={tl('status_active')}   count={activeListings ?? 0}   total={totalListings} colorClass="bg-status-success" />
          <StatusBar label={tl('status_sold')}     count={soldListings ?? 0}     total={totalListings} colorClass="bg-status-info" />
          <StatusBar label={tl('status_rented')}   count={rentedListings ?? 0}   total={totalListings} colorClass="bg-status-rented" />
          <StatusBar label={tl('status_inactive')} count={inactiveListings ?? 0} total={totalListings} colorClass="bg-status-warning" />
          <StatusBar label={tl('status_archived')} count={archivedListings ?? 0} total={totalListings} colorClass="bg-muted-foreground/40" />
        </div>
      </div>
    </div>
  )
}
