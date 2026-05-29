'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DashboardListing {
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

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-status-success/10 text-status-success',
  inactive: 'bg-status-warning/10 text-status-warning',
  sold:     'bg-status-info/10 text-status-info',
  rented:   'bg-status-rented/10 text-status-rented',
  archived: 'bg-muted text-muted-foreground',
  pending:  'bg-muted text-muted-foreground',
}

interface Props {
  listings: DashboardListing[]
  locale: string
}

/**
 * Recent Listings panel for the admin Dashboard.
 * Epic K §11 canonical pattern: primary text is a <button> that opens a preview Dialog.
 * No Actions column; all actions accessible from the Dialog.
 */
export function AdminDashboardRecentListings({ listings, locale }: Props) {
  const t = useTranslations('admin.dashboard')
  const tl = useTranslations('listing')
  const [selected, setSelected] = useState<DashboardListing | null>(null)

  const statusLabel = (status: string) =>
    getListingStatusLabel(status, s => tl(s as Parameters<typeof tl>[0]))

  return (
    <>
      <div className="divide-y">
        {listings.map(l => (
          <div key={l.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              {/* §11: primary text as <button> opening the preview Dialog */}
              <button
                type="button"
                className="text-sm font-medium truncate hover:text-primary transition-colors text-left w-full"
                onClick={() => setSelected(l)}
              >
                {l.title}
              </button>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {l.owner?.name ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {l.is_premium && <Star className="h-3.5 w-3.5 text-badge-premium shrink-0" />}
              <span className="text-sm font-medium hidden sm:inline">
                {formatPrice(l.price, l.currency, locale)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[l.status] ?? ''}`}>
                {statusLabel(l.status)}
              </span>
              <RelativeTime date={l.created_at} className="text-xs text-muted-foreground hidden md:block" />
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog (§11 pattern) */}
      {selected && (
        <Dialog open onOpenChange={open => { if (!open) setSelected(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">{selected.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dialog_owner')}</span>
                <span className="font-medium">{selected.owner?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dialog_status')}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[selected.status] ?? ''}`}>
                  {statusLabel(selected.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dialog_price')}</span>
                <span className="font-medium">{formatPrice(selected.price, selected.currency, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dialog_created')}</span>
                <RelativeTime date={selected.created_at} className="font-medium" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/${locale}/listings/${selected.slug}`}
                target="_blank"
                rel="noopener"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 justify-center')}
              >
                {t('dialog_view_site')}
              </Link>
              <Link
                href="/admin/listings"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 justify-center')}
              >
                {t('dialog_view_admin')}
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
