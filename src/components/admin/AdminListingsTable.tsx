'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ExternalLink, Pencil, Trash2, Star, Loader2, Copy, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/shared/Combobox'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { updateListingStatus, setListingPremium, deleteListing } from '@/modules/admin/actions'
import { formatPrice } from '@/lib/formatters'
import type { ListingStatus } from '@/types/database'
import { isListingArchived } from '@/modules/listings/domain'

const STATUSES: ListingStatus[] = ['pending', 'active', 'inactive', 'sold', 'rented', 'archived']

const STATUS_LABEL: Record<ListingStatus, string> = {
  pending: 'На розгляді', active: 'Активне', inactive: 'Неактивне',
  sold: 'Продано', rented: 'Орендовано', archived: 'Архів',
}

const STATUS_OPTIONS = STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s] }))
const FILTER_STATUS_OPTIONS = [{ value: '', label: 'Всі' }, ...STATUS_OPTIONS]

const PREMIUM_PRESETS = [
  { label: '1 місяць',  days: 30 },
  { label: '3 місяці', days: 90 },
  { label: '6 місяців', days: 180 },
  { label: '1 рік',    days: 365 },
]

export interface AdminListing {
  id: string
  title: string
  status: ListingStatus
  is_premium: boolean
  listing_type: string
  property_type: string
  price: number
  currency: string
  slug: string
  created_at: string
  owner?: { name: string | null } | null
}

interface Props {
  listings: AdminListing[]; total: number; page: number; perPage: number; activeStatus: string; searchQuery?: string; activeTab?: string
}

function PremiumDialog({ listing, onClose, onDone }: {
  listing: AdminListing; onClose: () => void; onDone: () => void
}) {
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function apply(days?: number) {
    setSaving(true)
    const until = days
      ? new Date(Date.now() + days * 86400000).toISOString()
      : customDate ? new Date(customDate).toISOString() : null
    await setListingPremium(listing.id, true, until)
    setSaving(false)
    onDone()
  }

  async function remove() {
    setSaving(true)
    await setListingPremium(listing.id, false, null)
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-2xl p-6 w-full max-w-sm flex flex-col gap-5">
        <div>
          <h3 className="font-bold text-base">Premium статус</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.title}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Швидкий вибір</Label>
          <div className="grid grid-cols-2 gap-2">
            {PREMIUM_PRESETS.map(p => (
              <button
                key={p.days}
                onClick={() => apply(p.days)}
                disabled={saving}
                className="h-10 rounded-xl border border-badge-premium/40 text-sm font-medium hover:bg-badge-premium/10 hover:border-badge-premium transition-colors disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="custom-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Власна дата закінчення
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-date"
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-10 rounded-xl flex-1"
            />
            <Button
              onClick={() => apply()}
              disabled={!customDate || saving}
              className="h-10 rounded-xl px-4"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
            </Button>
          </div>
        </div>

        {listing.is_premium && (
          <button
            onClick={remove}
            disabled={saving}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
          >
            Зняти Premium статус
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminListingsTable({ listings: init, total, page, perPage, activeStatus, searchQuery = '', activeTab = 'all' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [premiumDialog, setPremiumDialog] = useState<AdminListing | null>(null)
  const [items, setItems] = useState(init)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.ceil(total / perPage)

  useEffect(() => { setLocalSearch(searchQuery) }, [searchQuery])

  // Re-sync items when RSC delivers fresh props (e.g. after router.refresh() from
  // PremiumDialog.onDone). useState(init) ignores prop changes after first mount,
  // so an explicit effect is required — same pattern used above for localSearch.
  useEffect(() => { setItems(init) }, [init])

  // Clear the debounce timer on unmount to prevent router.push from firing
  // after the component has navigated away (uncontrolled side-effect).
  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      navigate({ q: value || null, page: null })
    }, 300)
  }

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
    <>
      {premiumDialog && (
        <PremiumDialog
          listing={premiumDialog}
          onClose={() => setPremiumDialog(null)}
          onDone={() => {
            setPremiumDialog(null)
            router.refresh()
          }}
        />
      )}

      <div className="admin-listings-table flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          {([['all', 'Всі оголошення'], ['premium', '⭐ Преміум оголошення']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => navigate({ tab: t === 'all' ? null : t, page: null, status: null })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + Status filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={localSearch}
              placeholder="Пошук по ID, назві, агенту, email..."
              className="h-9 pl-9 rounded-xl"
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <Combobox
            options={FILTER_STATUS_OPTIONS}
            value={activeStatus}
            onChange={s => navigate({ status: s || null, page: null })}
            variant="button"
            size="sm"
            className="w-40"
          />
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell w-24">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Оголошення</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Тип</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ціна</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Агент</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Дата</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Оголошень не знайдено</td></tr>
                ) : items.map(l => {
                  const isLoading = loadingId === l.id
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-muted/20 transition-colors ${isLoading ? 'opacity-50' : ''} ${
                        isListingArchived(l.status as ListingStatus) ? 'grayscale opacity-70' : ''
                      }`}
                    >
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(l.id).catch(() => {})
                            setCopiedId(l.id)
                            setTimeout(() => setCopiedId(prev => prev === l.id ? null : prev), 1500)
                          }}
                          title={l.id}
                          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        >
                          {copiedId === l.id
                            ? <Check className="h-3 w-3 text-status-success" />
                            : <Copy className="h-3 w-3 opacity-50" />
                          }
                          #{l.id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium shrink-0" />}
                          <span className="font-medium truncate max-w-[200px]">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize text-xs">
                        {l.listing_type} · {l.property_type}
                      </td>
                      <td className="px-4 py-3 font-medium text-sm">
                        {formatPrice(l.price, l.currency, 'sq')}
                      </td>
                      <td className="px-4 py-3">
                        <Combobox
                          options={STATUS_OPTIONS}
                          value={l.status}
                          portal
                          onChange={newStatus => {
                            if (!newStatus || newStatus === l.status) return
                            withLoading(l.id, async () => {
                              await updateListingStatus(l.id, newStatus as ListingStatus)
                              setItems(prev => prev.map(item =>
                                item.id === l.id ? { ...item, status: newStatus as ListingStatus } : item
                              ))
                            })
                          }}
                          variant="button"
                          size="xs"
                          disabled={loadingId === l.id}
                          className="w-32"
                        />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {l.owner?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                        <RelativeTime date={l.created_at} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                              {/* Premium */}
                              <button
                                onClick={() => setPremiumDialog(l)}
                                title={l.is_premium ? 'Змінити premium' : 'Встановити premium'}
                                className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                                  l.is_premium
                                    ? 'border-badge-premium/40 text-badge-premium hover:bg-badge-premium/10'
                                    : 'border-border text-muted-foreground hover:border-badge-premium/40 hover:text-badge-premium'
                                }`}
                              >
                                {l.is_premium ? <Star className="h-3.5 w-3.5 fill-current" /> : <Star className="h-3.5 w-3.5" />}
                              </button>

                              {/* Edit */}
                              <Link href={`/sq/listings/${l.slug}/edit`} target="_blank">
                                <button className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors" title="Edit listing">
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </Link>

                              {/* View */}
                              <Link href={`/sq/listings/${l.slug}`} target="_blank">
                                <button className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </Link>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (!confirm('Видалити оголошення?')) return
                                  withLoading(l.id, async () => {
                                    await deleteListing(l.id)
                                    setItems(prev => prev.filter(x => x.id !== l.id))
                                    // router.refresh() delivers fresh RSC props so the
                                    // SSR-derived `total` count in the page header updates.
                                    router.refresh()
                                  })
                                }}
                                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>
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
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => navigate({ page: String(page - 1) })}>
              Назад
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => navigate({ page: String(page + 1) })}>
              Далі
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
