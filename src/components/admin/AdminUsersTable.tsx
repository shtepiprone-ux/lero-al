'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, Loader2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AdminSearchInput } from '@/components/admin/AdminSearchInput'
import { formatDate } from '@/lib/formatters'
import { toggleUserVerified } from '@/modules/admin/actions'
import type { UserRole } from '@/types/database'
import { toast } from 'sonner'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

export interface VerifiedAgent {
  id: string
  name: string | null
  company_name: string | null
  created_at: string
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'

const ROLES: UserRole[] = ['user', 'agent', 'moderator', 'admin']

const ROLE_VARIANT: Record<UserRole, BadgeVariant> = {
  user: 'neutral', agent: 'info', moderator: 'warning', admin: 'success',
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success', blocked: 'destructive', inactive: 'warning',
}

export interface AdminUser {
  id: string
  public_id?: number | null
  name: string | null
  last_name: string | null
  phone: string | null
  role: UserRole
  user_type: string
  is_verified: boolean
  company_name: string | null
  status: string | null
  location_request: { city: string; region?: string } | null
  created_at: string
  last_seen_at?: string | null
  avatar_url?: string | null
}

const STATUS_FILTERS = ['', 'active', 'inactive', 'blocked'] as const

interface Props {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
  activeRole: string
  activeStatus?: string
  locationRequestFilter?: boolean
  searchQuery?: string
  activeTab?: string
  verifiedAgents?: VerifiedAgent[]
}

export function AdminUsersTable({ users: init, total, page, perPage, activeRole, activeStatus = '', locationRequestFilter, searchQuery = '', activeTab = 'all', verifiedAgents = [] }: Props) {
  const t = useTranslations('admin.users')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [items] = useState(init)
  const totalPages = Math.ceil(total / perPage)

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v === null ? params.delete(k) : params.set(k, v))
    router.push(`${pathname}?${params.toString()}`)
  }

  function withLoading(id: string, fn: () => Promise<void>) {
    setLoadingId(id)
    startTransition(async () => { await fn(); setLoadingId(null) })
  }

  function verifyToggle(u: AdminUser, isLoading: boolean) {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
    return (
      <button
        type="button"
        onClick={() => withLoading(u.id, async () => { await toggleUserVerified(u.id, !u.is_verified); toast.success(t(u.is_verified ? 'revoke_success' : 'verify_success')) })}
        title={u.is_verified ? t('revoke_verify') : t('verify')}
        className={`h-6 w-6 rounded flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          u.is_verified
            ? 'text-status-success hover:text-destructive'
            : 'text-muted-foreground/40 hover:text-status-success'
        }`}
      >
        {u.is_verified
          ? <ShieldCheck className="h-4 w-4" />
          : <ShieldOff className="h-3.5 w-3.5" />}
      </button>
    )
  }

  const userColumns: AdminTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: t('col_user'),
      cell: u => {
        const isLoading = loadingId === u.id
        const initials = u.name
          ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : '?'
        return (
          <div className={`flex items-center gap-3 ${isLoading ? 'opacity-50' : ''}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/admin/users/${u.id}`}
                className="font-medium truncate max-w-40 hover:text-primary transition-colors block"
              >
                {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
              </Link>
              {u.company_name && (
                <p className="text-xs text-muted-foreground truncate max-w-40">{u.company_name}</p>
              )}
              {u.location_request && (
                <p className="text-xs text-status-warning flex items-center gap-1 mt-0.5">
                  <MapPin className="h-2.5 w-2.5" /> {t('location_request_badge')}
                </p>
              )}
              {u.public_id != null && (
                <p className="text-xs text-muted-foreground/50 font-mono leading-none mt-0.5">#{u.public_id}</p>
              )}
            </div>
            {verifyToggle(u, isLoading)}
          </div>
        )
      },
    },
    {
      key: 'role',
      header: t('col_role'),
      cell: u => (
        <Badge variant={ROLE_VARIANT[u.role as UserRole] ?? 'neutral'} className="text-xs h-5">
          {t(`role_${u.role}` as `role_admin`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('col_status'),
      visibility: 'sm',
      cell: u => (
        <Badge variant={STATUS_VARIANT[u.status ?? 'active'] ?? 'neutral'} className="text-xs h-5">
          {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: t('col_phone'),
      visibility: 'md',
      cell: u => <span className="text-muted-foreground text-xs">{u.phone ?? '—'}</span>,
    },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'lg',
      cell: u => (
        <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
          <span>{formatDate(u.created_at, locale)}</span>
          {u.last_seen_at && (
            <span className="opacity-70">{t('last_seen_short')}: {formatDate(u.last_seen_at, locale)}</span>
          )}
        </div>
      ),
    },
  ]

  const verifiedColumns: AdminTableColumn<VerifiedAgent>[] = [
    {
      key: 'agent',
      header: t('col_agent'),
      cell: u => {
        const isLoading = loadingId === u.id
        return (
          <div className={`flex items-center gap-2 ${isLoading ? 'opacity-50' : ''}`}>
            <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary transition-colors">
              {u.name ?? '—'}
            </Link>
            {/* Revoke verification — inline action (no separate Actions column) */}
            {isLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
              : (
                <button
                  type="button"
                  onClick={() => withLoading(u.id, async () => { await toggleUserVerified(u.id, false); toast.success(t('revoke_success')) })}
                  title={t('revoke_verify')}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                </button>
              )
            }
          </div>
        )
      },
    },
    {
      key: 'company',
      header: t('col_company'),
      visibility: 'md',
      cell: u => <span className="text-muted-foreground">{u.company_name ?? '—'}</span>,
    },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'lg',
      cell: u => <span className="text-muted-foreground text-xs">{formatDate(u.created_at, locale)}</span>,
    },
  ]

  return (
    <div className="admin-users-table flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit">
        {([['all', t('tab_all')], ['verified', t('tab_verified')]] as const).map(([tab, label]) => (
          <Button
            key={tab}
            type="button"
            variant="ghost"
            onClick={() => navigate({ tab: tab === 'all' ? null : tab, page: null, role: null, q: null })}
            size="tab"
            className={activeTab === tab ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground'}
          >
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'verified' ? (
        <AdminTable
          rows={verifiedAgents}
          columns={verifiedColumns}
          rowKey={u => u.id}
          emptyState={t('empty_verified')}
          ariaLabel={t('col_agent')}
          rowClassName={u => loadingId === u.id ? 'opacity-50' : ''}
          cardRow={u => ({
            title: (
              <div className={`flex items-center gap-2 ${loadingId === u.id ? 'opacity-50' : ''}`}>
                <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary transition-colors">
                  {u.name ?? '—'}
                </Link>
              </div>
            ),
            subtitle: u.company_name ? (
              <span className="text-sm text-muted-foreground">{u.company_name}</span>
            ) : undefined,
            meta: (
              <span className="text-xs text-muted-foreground">{formatDate(u.created_at, locale)}</span>
            ),
            trailing: loadingId === u.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
              : (
                <button
                  type="button"
                  onClick={() => withLoading(u.id, async () => { await toggleUserVerified(u.id, false); toast.success(t('revoke_success')) })}
                  title={t('revoke_verify')}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                </button>
              ),
          })}
        />
      ) : (
      <>
      {/* Search */}
      <AdminSearchInput
        value={searchQuery}
        placeholder={t('search_placeholder')}
        className="max-w-sm"
      />
      {/* Role filter */}
      <div className="flex gap-2 flex-wrap [&>*]:max-sm:w-full">
        {(['', ...ROLES]).map(r => (
          <button
            key={r || 'all'}
            onClick={() => navigate({ role: r || null, page: null })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeRole === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {r || t('filter_all')}
          </button>
        ))}
        {locationRequestFilter && (
          <button
            onClick={() => navigate({ location_request: null, page: null })}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-status-warning/50 text-status-warning bg-status-warning/10 flex items-center gap-1"
          >
            <MapPin className="h-3 w-3" /> {t('location_request_badge')} ×
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap [&>*]:max-sm:w-full">
        {STATUS_FILTERS.map(s => (
          <button
            key={s || 'all-status'}
            onClick={() => navigate({ status: s || null, page: null })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeStatus === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {s ? t(`filter_status_${s}` as Parameters<typeof t>[0]) : t('filter_status_all')}
          </button>
        ))}
      </div>

      <AdminTable
        rows={items}
        columns={userColumns}
        rowKey={u => u.id}
        emptyState={t('empty')}
        ariaLabel={t('col_user')}
        rowClassName={u => loadingId === u.id ? 'opacity-50' : ''}
        cardRow={u => {
          const isLoading = loadingId === u.id
          const initials = u.name
            ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : '?'
          return {
            title: (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-medium truncate hover:text-primary transition-colors block"
                  >
                    {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
                  </Link>
                  {u.company_name && (
                    <p className="text-xs text-muted-foreground truncate">{u.company_name}</p>
                  )}
                </div>
              </div>
            ),
            subtitle: (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant={ROLE_VARIANT[u.role as UserRole] ?? 'neutral'} className="text-xs h-5">
                  {t(`role_${u.role}` as `role_admin`)}
                </Badge>
                <Badge variant={STATUS_VARIANT[u.status ?? 'active'] ?? 'neutral'} className="text-xs h-5">
                  {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
                </Badge>
                {u.location_request && (
                  <Badge variant="warning" className="text-xs h-5 gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {t('location_request_badge')}
                  </Badge>
                )}
              </div>
            ),
            meta: (
              <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                {u.public_id != null && <span className="font-mono opacity-70">#{u.public_id}</span>}
                {u.phone && <span>{u.phone}</span>}
                <span>{formatDate(u.created_at, locale)}</span>
                {u.last_seen_at && (
                  <span className="opacity-70">{t('last_seen_short')}: {formatDate(u.last_seen_at, locale)}</span>
                )}
              </div>
            ),
            trailing: verifyToggle(u, isLoading),
          }
        }}
      />

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => navigate({ page: String(page - 1) })}>{t('prev_page')}</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => navigate({ page: String(page + 1) })}>{t('next_page')}</Button>
        </div>
      )}
      </>
      )}
    </div>
  )
}
