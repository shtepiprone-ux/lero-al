'use client'

import { useState, useTransition } from 'react'
import { Star, StarOff, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { toggleListingPremium, toggleUserVerified } from '@/modules/admin/actions'
import { formatPrice } from '@/lib/formatters'

export interface PremiumListing {
  id: string
  title: string
  price: number | null
  currency: string | null
  created_at: string
  owner: { name: string | null } | null
}

export interface VerifiedUser {
  id: string
  name: string | null
  company_name: string | null
  created_at: string
}

interface Props {
  premiumListings: PremiumListing[]
  verifiedUsers: VerifiedUser[]
}

export function AdminBadgesTable({ premiumListings: initListings, verifiedUsers: initUsers }: Props) {
  const [listings, setListings] = useState(initListings)
  const [users, setUsers] = useState(initUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'premium' | 'verified'>('premium')

  function withLoading(id: string, fn: () => Promise<void>) {
    setLoadingId(id)
    startTransition(async () => { await fn(); setLoadingId(null) })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {(['premium', 'verified'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'premium' ? '⭐ Преміум оголошення' : '✓ Верифіковані агенти'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {tab === 'premium' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Оголошення</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Агент</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Дата</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Немає преміум оголошень</td></tr>
              ) : listings.map(l => (
                <tr key={l.id} className={`hover:bg-muted/20 ${loadingId === l.id ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium truncate max-w-[250px]">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.price != null ? formatPrice(l.price, l.currency ?? '', 'sq') : ''}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{l.owner?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                    <RelativeTime date={l.created_at} />
                  </td>
                  <td className="px-5 py-3.5">
                    {loadingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <button
                        onClick={() => withLoading(l.id, async () => {
                          await toggleListingPremium(l.id, false)
                          setListings(prev => prev.filter(x => x.id !== l.id))
                        })}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-status-warning transition-colors"
                      >
                        <StarOff className="h-4 w-4" /> Зняти преміум
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Агент</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Компанія</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Дата</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Немає верифікованих агентів</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-muted/20 ${loadingId === u.id ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5 font-medium">{u.name ?? '—'}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{u.company_name ?? '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                    <RelativeTime date={u.created_at} />
                  </td>
                  <td className="px-5 py-3.5">
                    {loadingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <button
                        onClick={() => withLoading(u.id, async () => {
                          await toggleUserVerified(u.id, false)
                          setUsers(prev => prev.filter(x => x.id !== u.id))
                        })}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <ShieldOff className="h-4 w-4" /> Зняти верифікацію
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
