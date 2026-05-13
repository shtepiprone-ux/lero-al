'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, Loader2, ExternalLink, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { toggleUserVerified } from '@/modules/admin/actions'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = ['user', 'agent', 'moderator', 'admin']

const ROLE_VARIANT: Record<UserRole, any> = {
  user: 'neutral', agent: 'info', moderator: 'warning', admin: 'success',
}

const STATUS_VARIANT: Record<string, any> = {
  active: 'success', blocked: 'destructive', inactive: 'warning',
}

interface Props {
  users: any[]
  total: number
  page: number
  perPage: number
  activeRole: string
  locationRequestFilter?: boolean
}

export function AdminUsersTable({ users: init, total, page, perPage, activeRole, locationRequestFilter }: Props) {
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

  return (
    <div className="admin-users-table flex flex-col gap-4">
      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...ROLES].map(r => (
          <button
            key={r || 'all'}
            onClick={() => navigate({ role: r || null, page: null })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeRole === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {r || 'Всі'}
          </button>
        ))}
        {locationRequestFilter && (
          <button
            onClick={() => navigate({ location_request: null, page: null })}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-status-warning/50 text-status-warning bg-status-warning/10 flex items-center gap-1"
          >
            <MapPin className="h-3 w-3" /> Запити на міста ×
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Користувач</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Телефон</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Користувачів не знайдено</td></tr>
              ) : items.map(u => {
                const isLoading = loadingId === u.id
                const initials = u.name
                  ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '?'

                return (
                  <tr key={u.id} className={`transition-colors ${isLoading ? 'opacity-50' : 'hover:bg-muted/20'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="font-medium truncate max-w-[160px] hover:text-primary transition-colors block"
                          >
                            {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
                          </Link>
                          {u.company_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u.company_name}</p>
                          )}
                          {u.location_request && (
                            <p className="text-xs text-status-warning flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" /> Запит на місто
                            </p>
                          )}
                        </div>
                        {u.is_verified && <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANT[u.role as UserRole] ?? 'neutral'} className="text-[11px] h-5 capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={STATUS_VARIANT[u.status ?? 'active'] ?? 'neutral'} className="text-[11px] h-5">
                        {u.status ?? 'active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      <RelativeTime date={u.created_at} />
                    </td>
                    <td className="px-4 py-3">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                            title="Відкрити профіль"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => withLoading(u.id, () => toggleUserVerified(u.id, !u.is_verified))}
                            title={u.is_verified ? 'Зняти верифікацію' : 'Верифікувати'}
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                              u.is_verified
                                ? 'border-status-success/30 text-status-success hover:bg-status-success/5'
                                : 'border-border text-muted-foreground hover:border-status-success/30 hover:text-status-success'
                            }`}
                          >
                            {u.is_verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => navigate({ page: String(page - 1) })}>Назад</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => navigate({ page: String(page + 1) })}>Далі</Button>
        </div>
      )}
    </div>
  )
}
