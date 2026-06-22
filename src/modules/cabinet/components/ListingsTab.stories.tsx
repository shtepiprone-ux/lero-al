import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations, useLocale } from 'next-intl'
import { Eye, Phone, Pencil, Maximize2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { formatPrice } from '@/lib/formatters'
import { formatVisibility } from '@/modules/listings/lib/visibility'
import type { ListingStatus } from '@/types/database'

// Badge variants — identical to ListingsTab.tsx
const STATUS_VARIANT: Record<ListingStatus, 'warning' | 'success' | 'neutral' | 'info' | 'rented'> = {
  pending: 'warning', active: 'success', inactive: 'neutral',
  sold: 'info', rented: 'rented', archived: 'neutral', expired: 'warning',
}

const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString()
const PAST = new Date(Date.now() - 10 * 86_400_000).toISOString()

interface RowData {
  id: string; title: string; price: number; currency: string
  listing_type: string; property_type: string; status: ListingStatus
  slug: string; created_at: string; expires_at: string | null
  is_premium: boolean; views_count: number
}

const ROWS: RowData[] = [
  { id: '1', title: '3+1 apartament në qendër të Tiranës — kati i 5-të', price: 95000, currency: 'EUR', listing_type: 'sale', property_type: 'apartment', status: 'active', slug: 'a', created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(), expires_at: FUTURE, is_premium: false, views_count: 42 },
  { id: '2', title: 'Shtëpi 250 m² me kopsht — Kombinat, Tirana', price: 180000, currency: 'EUR', listing_type: 'sale', property_type: 'house', status: 'active', slug: 'b', created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(), expires_at: PAST, is_premium: false, views_count: 18 },
  { id: '3', title: 'Lokal tregtar 120 m² — Rruga e Kavajës, pranë sheshit kryesor', price: 1200, currency: 'EUR', listing_type: 'rent', property_type: 'commercial', status: 'active', slug: 'c', created_at: new Date(Date.now() - 20 * 86_400_000).toISOString(), expires_at: null, is_premium: false, views_count: 5 },
  { id: '4', title: 'Apartament 2+1 — Durrës, pranë bregdetit', price: 62000, currency: 'EUR', listing_type: 'sale', property_type: 'apartment', status: 'sold', slug: 'd', created_at: new Date(Date.now() - 30 * 86_400_000).toISOString(), expires_at: PAST, is_premium: false, views_count: 91 },
]

function CabinetRowsView() {
  const t = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const locale = useLocale()

  return (
    <div className="flex flex-col gap-3">
      {ROWS.map(listing => {
        const status = listing.status
        return (
          <div key={listing.id} className="bg-card rounded-xl border shadow-sm flex gap-4 p-3">
            <div className="relative w-24 h-20 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <Maximize2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={STATUS_VARIANT[status]} className="text-xs px-1.5 py-0 h-5">
                    {t(`status_${status}`)}
                  </Badge>
                  {(() => {
                    const vis = formatVisibility({ status, expires_at: listing.expires_at })
                    if (!vis.visible) {
                      return (
                        <span className="inline-flex items-center px-1.5 py-0 h-5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium whitespace-normal break-words">
                          {t(vis.labelKey as Parameters<typeof t>[0])}
                        </span>
                      )
                    }
                    return null
                  })()}
                  {listing.is_premium && (
                    <Badge className="text-xs px-1.5 py-0 h-5 bg-badge-premium text-primary-foreground">
                      {t('filter_PREMIUM')}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {(tl as (k: string) => string)(listing.listing_type)} · {(tl as (k: string) => string)(`property_type_${listing.property_type}`)}
                  </span>
                </div>
                <span className="font-semibold text-sm leading-snug line-clamp-2">
                  {listing.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground text-sm">
                  {formatPrice(listing.price, listing.currency, locale)}
                </span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.views_count} {t('views')}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t('contact_count', { count: 0 })}</span>
                <RelativeTime date={listing.created_at} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 justify-start pt-0.5">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" aria-label={t('edit_listing')}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const meta: Meta = {
  title: 'Cabinet/ListingsTab',
  component: CabinetRowsView,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}
