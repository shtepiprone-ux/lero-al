'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { ExternalLink, Eye, Pencil, Trash2, Star, Loader2, Copy, Check, ChevronRight } from 'lucide-react'
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
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { formatPrice } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ListingStatus } from '@/types/database'
import {
  isListingArchived,
  isListingHidden,
  getPrivilegedTargetStatuses,
  getTransitionActionForStatus,
  type ListingTransitionAction,
} from '@/modules/listings/domain'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import { formatVisibility } from '@/modules/listings/lib/visibility'

// Status-action button styling/label per transition ACTION (engine vocabulary,
// not per from/to status pair — Note 14: no divergent hardcoded status matrix).
type StatusActionDef = { toStatus: ListingStatus; labelKey: string; className?: string }
const ACTION_LABELS: Record<ListingTransitionAction, { labelKey: string; className?: string }> = {
  APPROVE:        { labelKey: 'btn_approve',     className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
  REJECT:         { labelKey: 'btn_reject',      className: 'text-status-warning border-status-warning/30 hover:bg-status-warning/10' },
  PUBLISH:        { labelKey: 'btn_activate',    className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
  UNPUBLISH:      { labelKey: 'btn_deactivate' },
  SEND_TO_REVIEW: { labelKey: 'btn_send_review' },
  MARK_AS_SOLD:   { labelKey: 'btn_mark_sold',   className: 'text-status-info border-status-info/30 hover:bg-status-info/10' },
  MARK_AS_RENTED: { labelKey: 'btn_mark_rented', className: 'text-status-rented border-status-rented/30 hover:bg-status-rented/10' },
  ARCHIVE:        { labelKey: 'btn_archive',     className: 'text-muted-foreground' },
  RESTORE:        { labelKey: 'btn_restore',     className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
  EXPIRE:         { labelKey: 'btn_expire',      className: 'text-status-warning border-status-warning/30 hover:bg-status-warning/10' },
  RENEW:          { labelKey: 'btn_renew',        className: 'text-status-success border-status-success/30 hover:bg-status-success/10' },
}

// Admin/moderator (and owner, via the same privileged gateway) may move a
// listing directly to ANY other status — derived from the transition engine's
// privileged any-status resolver (Task 427). Transitions covered by the base
// matrix keep their specific action label; all other targets fall back to the
// generic 'btn_set_status' label (i18n key takes a `{status}` param).
function getStatusActionsForStatus(status: ListingStatus): StatusActionDef[] {
  return getPrivilegedTargetStatuses(status).map(toStatus => {
    const action = getTransitionActionForStatus(status, toStatus)
    if (action) {
      const { labelKey, className } = ACTION_LABELS[action]
      return { toStatus, labelKey, className }
    }
    return { toStatus, labelKey: 'btn_set_status', className: 'text-muted-foreground' }
  })
}

const STATUS_BADGE: Record<ListingStatus, string> = {
  pending:  'bg-status-warning/15 text-status-warning border-status-warning/30',
  active:   'bg-status-success/15 text-status-success border-status-success/30',
  inactive: 'bg-muted text-muted-foreground border-border',
  sold:     'bg-status-info/15 text-status-info border-status-info/30',
  rented:   'bg-status-rented/15 text-status-rented border-status-rented/30',
  archived: 'bg-muted text-muted-foreground/60 border-border',
  expired:  'bg-status-warning/15 text-status-warning border-status-warning/30',
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
  expires_at: string | null
  owner?: { name: string | null } | null
}

interface Props {
  listings: AdminListing[]
  total: number
  page: number
  perPage: number
  activeStatus: string
  searchQuery?: string
  activeTab?: string
  pageTitle?: string
  activeVisibility?: string
  activeReason?: string
  auditCounts?: { total: number; expired: number; noExpiry: number }
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
                className="h-10 rounded-xl px-4 shrink-0 max-sm:w-auto"
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
  statusLabels,
  typeLabel,
  onClose,
  onDeleted,
  onPremium,
  onStatusChanged,
  locale,
}: {
  listing: AdminListing
  statusLabel: string
  statusLabels: Record<ListingStatus, string>
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
            <span className="text-muted-foreground text-xs">{t('visibility_label')}</span>
            <div>
              {(() => {
                const vis = formatVisibility({ status: listing.status, expires_at: listing.expires_at })
                return vis.visible
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-status-success/15 text-status-success border-status-success/30">{t('visibility_visible')}</span>
                  : <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-destructive/10 text-destructive border-destructive/30 whitespace-normal break-words">{t(vis.labelKey as Parameters<typeof t>[0])}</span>
              })()}
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
        {!showDeleteConfirm && getStatusActionsForStatus(listing.status).length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('status_section_label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {getStatusActionsForStatus(listing.status).map(({ toStatus, labelKey, className }) => (
                <Button
                  key={toStatus}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(toStatus)}
                  disabled={changingStatus !== null}
                  className={`gap-1.5 ${className ?? ''}`}
                >
                  {changingStatus === toStatus && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                  {labelKey === 'btn_set_status'
                    ? t('btn_set_status', { status: statusLabels[toStatus] })
                    : t(labelKey as Parameters<typeof t>[0])}
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
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
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
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/admin/listings/${listing.id}/preview`}
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5 max-sm:w-full max-sm:min-h-11'}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              {t('btn_view')}
            </Link>
            {!isListingHidden(listing.status) && (
              <Link
                href={`/${locale}/listings/${listing.slug}`}
                target="_blank"
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5 max-sm:w-full max-sm:min-h-11'}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {t('btn_open_public')}
              </Link>
            )}
            <Link
              href={`/${locale}/listings/${listing.slug}/edit`}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5 max-sm:w-full max-sm:min-h-11'}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              {tc('edit')}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onPremium}
              className="gap-1.5 border-badge-premium/40 text-badge-premium hover:bg-badge-premium/10 max-sm:w-full max-sm:min-h-11"
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              {listing.is_premium ? t('premium_change') : t('premium_set')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 max-sm:w-full max-sm:min-h-11 sm:ml-auto"
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

export function AdminListingsTable({ listings: init, total, page, perPage, activeStatus, searchQuery = '', activeTab = 'all', pageTitle, activeVisibility = '', activeReason = '', auditCounts }: Props) {
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

  function navigateVisibility(vis: string | null, reason?: string | null) {
    navigate({
      visibility: vis,
      reason: reason ?? null,
      page: '1',
    })
  }

  const columns: AdminTableColumn<AdminListing>[] = [
    {
      key: 'id',
      header: 'ID',
      visibility: 'xl',
      className: 'w-24',
      cell: l => (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
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
      ),
    },
    {
      key: 'listing',
      header: t('col_listing'),
      cell: l => (
        <button
          type="button"
          onClick={() => setPreviewListing(l)}
          className="flex items-center gap-2 text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium shrink-0" />}
          <span className="font-medium truncate max-w-50">{l.title}</span>
        </button>
      ),
    },
    {
      key: 'type',
      header: t('col_type'),
      visibility: 'md',
      cell: l => (
        <span className="text-muted-foreground text-xs">
          {(tl as (k: string) => string)(l.listing_type)} · {propertyTypes.find(pt => pt.value === l.property_type)?.label ?? l.property_type}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('col_price'),
      cell: l => <span className="font-medium text-sm">{formatPrice(l.price, l.currency, locale)}</span>,
    },
    {
      key: 'status',
      header: t('col_status'),
      cell: l => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BADGE[l.status]}`}>
          {STATUS_LABEL[l.status]}
        </span>
      ),
    },
    {
      key: 'visibility',
      header: t('visibility_label'),
      cell: l => {
        const vis = formatVisibility({ status: l.status, expires_at: l.expires_at })
        return vis.visible
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-status-success/15 text-status-success border-status-success/30">{t('visibility_visible')}</span>
          : <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-destructive/10 text-destructive border-destructive/30 whitespace-normal break-words">{t(vis.labelKey as Parameters<typeof t>[0])}</span>
      },
    },
    {
      key: 'agent',
      header: t('col_agent'),
      visibility: 'lg',
      cell: l => <span className="text-muted-foreground text-xs">{l.owner?.name ?? '—'}</span>,
    },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'xl',
      cell: l => <span className="text-muted-foreground text-xs"><RelativeTime date={l.created_at} /></span>,
    },
  ]

  const filterBar = (
    <>
      {/* Tabs */}
      <div className="flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit">
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

      {/* Search + Status filter + Visibility filter */}
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
        <Button
          type="button"
          variant={activeVisibility === 'hidden_eligible' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (activeVisibility === 'hidden_eligible') {
              navigateVisibility(null)
            } else {
              navigateVisibility('hidden_eligible')
            }
          }}
          className="max-sm:w-full max-sm:min-h-11 whitespace-normal break-words"
        >
          {t('visibility_filter_hidden_eligible')}
        </Button>
      </div>
    </>
  )

  return (
    <div data-testid="admin-listings-table">
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
          statusLabels={STATUS_LABEL}
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

      <AdminPageShell
        title={pageTitle}
        countBadge={pageTitle ? { value: total } : undefined}
        filterBar={filterBar}
      >
        {/* Audit panel: public-eligible but hidden counts */}
        {auditCounts && (
          <div className="rounded-xl border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            {auditCounts.total === 0 ? (
              <span className="text-muted-foreground">{t('audit_hidden_zero')}</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateVisibility('hidden_eligible')}
                  className={cn(
                    'font-medium hover:underline underline-offset-4 text-left max-sm:w-full max-sm:min-h-11 max-sm:flex max-sm:items-center',
                    activeVisibility === 'hidden_eligible' && !activeReason ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {t('audit_hidden_total', { count: auditCounts.total })}
                </button>
                <span className="hidden sm:inline text-muted-foreground">·</span>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => navigateVisibility('hidden_eligible', 'expired')}
                    className={cn(
                      'text-sm hover:underline underline-offset-4 text-left max-sm:w-full max-sm:min-h-11 max-sm:flex max-sm:items-center whitespace-normal break-words',
                      activeReason === 'expired' ? 'text-primary font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {t('audit_hidden_expired', { count: auditCounts.expired })}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateVisibility('hidden_eligible', 'no_expiry')}
                    className={cn(
                      'text-sm hover:underline underline-offset-4 text-left max-sm:w-full max-sm:min-h-11 max-sm:flex max-sm:items-center whitespace-normal break-words',
                      activeReason === 'no_expiry' ? 'text-primary font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {t('audit_hidden_no_expiry', { count: auditCounts.noExpiry })}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <AdminTable
          rows={items}
          columns={columns}
          rowKey={l => l.id}
          stickyColumnIndex={1}
          rowClassName={l => isListingArchived(l.status as ListingStatus) ? 'grayscale opacity-70' : ''}
          emptyState={t('empty')}
          ariaLabel={pageTitle ?? t('col_listing')}
          cardRow={l => ({
            title: (
              <div className="flex items-center gap-2 min-w-0">
                {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium shrink-0" />}
                <span className="font-medium truncate">{l.title}</span>
              </div>
            ),
            subtitle: (() => {
              const vis = formatVisibility({ status: l.status, expires_at: l.expires_at })
              return (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="font-medium text-sm">{formatPrice(l.price, l.currency, locale)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_BADGE[l.status]}`}>
                    {STATUS_LABEL[l.status]}
                  </span>
                  {vis.visible
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-status-success/15 text-status-success border-status-success/30">{t('visibility_visible')}</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-destructive/10 text-destructive border-destructive/30 whitespace-normal break-words">{t(vis.labelKey as Parameters<typeof t>[0])}</span>
                  }
                </div>
              )
            })(),
            meta: (
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                <span>{(tl as (k: string) => string)(l.listing_type)} · {propertyTypes.find(pt => pt.value === l.property_type)?.label ?? l.property_type}</span>
                {l.owner?.name && <span>· {l.owner.name}</span>}
              </div>
            ),
            trailing: <ChevronRight className="h-4 w-4 text-muted-foreground/40" />,
          })}
        />

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
      </AdminPageShell>
    </div>
  )
}
