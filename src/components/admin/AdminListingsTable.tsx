'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { ExternalLink, Pencil, Trash2, Star, Loader2, Copy, Check } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { AdminInput } from '@/components/admin/AdminInput'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Combobox } from '@/components/shared/Combobox'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { AdminSearchInput } from '@/components/admin/AdminSearchInput'
import { setListingPremium, deleteListing, updateListingStatus } from '@/modules/admin/actions'
import { formatPrice } from '@/lib/formatters'
import { toast } from 'sonner'
import type { ListingStatus } from '@/types/database'
import { isListingArchived } from '@/modules/listings/domain'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'

// Status transitions available to admin per current status.
// Matches ALLOWED_LISTING_TRANSITIONS in listingTransitionEngine.ts.
type StatusActionDef = { toStatus: ListingStatus; labelKey: string; className?: string }
const STATUS_ACTIONS: Record<ListingStatus, StatusActionDef[]> = {
  pending:  [
    { toStatus: 'active',   labelKey: 'btn_approve',     className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
    { toStatus: 'inactive', labelKey: 'btn_reject',      className: 'text-status-warning border-status-warning/30 hover:bg-status-warning/10' },
    { toStatus: 'archived', labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  ],
  active:   [
    { toStatus: 'inactive', labelKey: 'btn_deactivate' },
    { toStatus: 'sold',     labelKey: 'btn_mark_sold',   className: 'text-status-info border-status-info/30 hover:bg-status-info/10' },
    { toStatus: 'rented',   labelKey: 'btn_mark_rented', className: 'text-status-rented border-status-rented/30 hover:bg-status-rented/10' },
    { toStatus: 'archived', labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  ],
  inactive: [
    { toStatus: 'active',   labelKey: 'btn_activate',    className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
    { toStatus: 'pending',  labelKey: 'btn_send_review' },
    { toStatus: 'archived', labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  ],
  sold:     [
    { toStatus: 'archived', labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  ],
  rented:   [
    { toStatus: 'archived', labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  ],
  archived: [
    { toStatus: 'inactive', labelKey: 'btn_restore',     className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
  ],
}

const STATUS_BADGE: Record<ListingStatus, string> = {
  pending:  'bg-status-warning/15 text-status-warning border-status-warning/30',
  active:   'bg-status-success/15 text-status-success border-status-success/30',
  inactive: 'bg-muted text-muted-foreground border-border',
  sold:     'bg-status-info/15 text-status-info border-status-info/30',
  rented:   'bg-status-rented/15 text-status-rented border-status-rented/30',
  archived: 'bg-muted text-muted-foreground/60 border-border',
}

export interface AdminListing {
  id: string
  public_id?: number | null
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

// ── Premium Dialog (canonical Dialog wrapper) ─────────────────────────────────

function PremiumDialog({ listing, onClose, onDone }: {
  listing: AdminListing; onClose: () => void; onDone: () => void
}) {
  const t = useTranslations('admin.listings')
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)

  const PREMIUM_PRESETS = [
    { label: t('preset_1m'), days: 30 },
    { label: t('preset_3m'), days: 90 },
    { label: t('preset_6m'), days: 180 },
    { label: t('preset_1y'), days: 365 },
  ]

  function premiumErrToastKey(error: string) {
    if (error === 'db_missing_column') return 'premium_error_db_schema'
    return `premium_error_${error}`
  }

  async function apply(days?: number) {
    setSaving(true)
    let until: string | null = null
    if (days) {
      until = new Date(Date.now() + days * 86400000).toISOString()
    } else if (customDate) {
      try {
        until = new Date(customDate).toISOString()
      } catch {
        toast.error(t('premium_error_date_invalid'))
        setSaving(false)
        return
      }
    }
    const result = await setListingPremium(listing.id, true, until)
    setSaving(false)
    if ('error' in result) {
      toast.error(t(premiumErrToastKey(result.error) as Parameters<typeof t>[0]))
      return
    }
    toast.success(t('premium_success'))
    onDone()
  }

  async function remove() {
    setSaving(true)
    const result = await setListingPremium(listing.id, false, null)
    setSaving(false)
    if ('error' in result) {
      toast.error(t(premiumErrToastKey(result.error) as Parameters<typeof t>[0]))
      return
    }
    toast.success(t('premium_removed_success'))
    onDone()
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('premium_dialog_title')}</DialogTitle>
          <DialogDescription className="line-clamp-2">{listing.title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('premium_quick_label')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PREMIUM_PRESETS.map(p => (
                <Button
                  key={p.days}
                  type="button"
                  variant="outline"
                  onClick={() => apply(p.days)}
                  disabled={saving}
                  className="border-badge-premium/40 hover:bg-badge-premium/10 hover:border-badge-premium"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('premium_custom_date')}
            </Label>
            <div className="flex gap-2">
              <AdminInput
                id="custom-date"
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1"
              />
              <Button
                onClick={() => apply()}
                disabled={!customDate || saving}
                className="h-10 rounded-xl px-4 shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
              </Button>
            </div>
          </div>

          {listing.is_premium && (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={saving}
              className="text-destructive hover:text-destructive hover:bg-destructive/5"
            >
              {t('premium_remove')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Listing Preview Dialog (canonical K.1 pattern) ────────────────────────────

function ListingPreviewDialog({
  listing,
  statusLabel,
  typeLabel,
  onClose,
  onDeleted,
  onPremium,
  onStatusChanged,
  locale,
}: {
  listing: AdminListing
  statusLabel: string
  typeLabel: string
  onClose: () => void
  onDeleted: (id: string) => void
  onPremium: () => void
  onStatusChanged: (id: string, newStatus: ListingStatus) => void
  locale: string
}) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('common')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingStatus, setChangingStatus] = useState<ListingStatus | null>(null)

  async function handleDelete() {
    setDeleting(true)
    await deleteListing(listing.id)
    setDeleting(false)
    toast.success(t('delete_success'))
    onDeleted(listing.id)
  }

  async function handleStatusChange(toStatus: ListingStatus) {
    setChangingStatus(toStatus)
    const result = await updateListingStatus(listing.id, toStatus)
    setChangingStatus(null)
    if (result.error) {
      toast.error(t('status_update_error'))
      return
    }
    toast.success(t('status_update_success'))
    onStatusChanged(listing.id, toStatus)
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {listing.is_premium && <Star className="h-4 w-4 text-badge-premium shrink-0" />}
            <span className="line-clamp-2">{listing.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Key details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm py-2">
          <div>
            <span className="text-muted-foreground text-xs">{t('col_status')}</span>
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BADGE[listing.status]}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">{t('col_type')}</span>
            <p className="font-medium">{typeLabel}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">{t('col_price')}</span>
            <p className="font-medium">{formatPrice(listing.price, listing.currency, locale)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">{t('col_agent')}</span>
            <p className="font-medium">{listing.owner?.name ?? '—'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">{t('col_date')}</span>
            <p className="font-medium"><RelativeTime date={listing.created_at} /></p>
          </div>
        </div>

        {/* Status actions */}
        {!showDeleteConfirm && STATUS_ACTIONS[listing.status].length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('status_section_label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS[listing.status].map(({ toStatus, labelKey, className }) => (
                <Button
                  key={toStatus}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(toStatus)}
                  disabled={changingStatus !== null}
                  className={`gap-1.5 ${className ?? ''}`}
                >
                  {changingStatus === toStatus && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                  {t(labelKey as Parameters<typeof t>[0])}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Delete confirmation (inline — replaces actions) */}
        {showDeleteConfirm ? (
          <div className="flex flex-col gap-3 pt-2 border-t">
            <p className="text-sm font-semibold">{t('delete_confirm')}</p>
            <p className="text-sm text-muted-foreground">{t('delete_dialog_body')}</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                {tc('cancel')}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                {tc('delete')}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="flex-wrap gap-2 sm:flex-row">
            <Link
              href={`/${locale}/listings/${listing.slug}`}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {t('btn_view')}
            </Link>
            <Link
              href={`/${locale}/listings/${listing.slug}/edit`}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              {tc('edit')}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onPremium}
              className="gap-1.5 border-badge-premium/40 text-badge-premium hover:bg-badge-premium/10"
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              {listing.is_premium ? t('premium_change') : t('premium_set')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              {tc('delete')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────

export function AdminListingsTable({ listings: init, total, page, perPage, activeStatus, searchQuery = '', activeTab = 'all' }: Props) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const locale = useLocale()
  const { propertyTypes } = usePropertyTypes()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [premiumDialog, setPremiumDialog] = useState<AdminListing | null>(null)
  const [previewListing, setPreviewListing] = useState<AdminListing | null>(null)
  const [items, setItems] = useState(init)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const totalPages = Math.ceil(total / perPage)

  const statusLabel = (s: string) => getListingStatusLabel(s, k => tc(k as Parameters<typeof tc>[0]))

  const STATUS_LABEL: Record<ListingStatus, string> = Object.fromEntries(
    LISTING_STATUS_CODES.map(s => [s, statusLabel(s)])
  ) as Record<ListingStatus, string>

  const FILTER_STATUS_OPTIONS = [
    { value: '', label: tc('filter_ALL') },
    ...LISTING_STATUS_CODES.map(s => ({ value: s, label: STATUS_LABEL[s] })),
  ]

  useEffect(() => { setItems(init) }, [init])

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v === null ? params.delete(k) : params.set(k, v))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      {/* Premium Dialog */}
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

      {/* Listing Preview Dialog (K.1 canonical pattern) */}
      {previewListing && !premiumDialog && (
        <ListingPreviewDialog
          listing={previewListing}
          statusLabel={STATUS_LABEL[previewListing.status]}
          typeLabel={`${(tl as (k: string) => string)(previewListing.listing_type)} · ${propertyTypes.find(pt => pt.value === previewListing.property_type)?.label ?? previewListing.property_type}`}
          locale={locale}
          onClose={() => setPreviewListing(null)}
          onDeleted={id => {
            setItems(prev => prev.filter(x => x.id !== id))
            setPreviewListing(null)
            router.refresh()
          }}
          onPremium={() => {
            setPremiumDialog(previewListing)
            setPreviewListing(null)
          }}
          onStatusChanged={(id, newStatus) => {
            setItems(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x))
            setPreviewListing(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
            router.refresh()
          }}
        />
      )}

      <div className="admin-listings-table flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          {([['all', t('tab_all')], ['premium', t('tab_premium')]] as const).map(([tab, label]) => (
            <Button
              key={tab}
              type="button"
              variant="ghost"
              onClick={() => navigate({ tab: tab === 'all' ? null : tab, page: null, status: null })}
              size="tab"
              className={activeTab === tab ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground'}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Search + Status filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <AdminSearchInput
            value={searchQuery}
            placeholder={t('search_placeholder')}
            className="flex-1 max-w-sm"
          />
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('col_listing')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('col_type')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('col_price')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('col_status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('col_agent')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">{t('col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">{t('empty')}</td></tr>
                ) : items.map(l => (
                    <tr
                      key={l.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        isListingArchived(l.status as ListingStatus) ? 'grayscale opacity-70' : ''
                      }`}
                    >
                      {/* ID — copy button */}
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
                          #{l.public_id ?? l.id.slice(0, 8)}
                        </button>
                      </td>

                      {/* Title — primary click affordance (K.1 canonical) */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setPreviewListing(l)}
                          className="flex items-center gap-2 text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        >
                          {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium shrink-0" />}
                          <span className="font-medium truncate max-w-[200px]">{l.title}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {(tl as (k: string) => string)(l.listing_type)} · {propertyTypes.find(pt => pt.value === l.property_type)?.label ?? l.property_type}
                      </td>
                      <td className="px-4 py-3 font-medium text-sm">
                        {formatPrice(l.price, l.currency, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BADGE[l.status]}`}>
                          {STATUS_LABEL[l.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {l.owner?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                        <RelativeTime date={l.created_at} />
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => navigate({ page: String(page - 1) })}>
              {t('prev_page')}
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => navigate({ page: String(page + 1) })}>
              {t('next_page')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
