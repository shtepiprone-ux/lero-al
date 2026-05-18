'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Search, Trash2, ArrowRight, Mail, Trash } from 'lucide-react'
import { toast } from 'sonner'
import type { SavedSearch } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  deleteSavedSearch,
  updateSavedSearchNotify,
  updateLastViewed,
  deleteAllSavedSearches,
} from '@/modules/cabinet/actions'
import { canonicalToSearchParams, type CanonicalFilters } from '@/modules/listings/lib/savedSearchCanonicalize'

interface Props {
  savedSearches: SavedSearch[]
}

function FilterSummary({ filters }: { filters: Record<string, unknown> }) {
  const tl = useTranslations('listing')
  const tc = useTranslations('common')

  const parts: string[] = []
  if (filters.listingType) parts.push(tl(String(filters.listingType)))
  if (filters.propertyType) parts.push(tl(`property_type_${filters.propertyType}`))
  if (filters.priceMin || filters.priceMax) {
    const from = filters.priceMin ? String(filters.priceMin) : ''
    const to = filters.priceMax ? String(filters.priceMax) : ''
    parts.push(from && to ? `${from}–${to}` : from ? `>${from}` : `<${to}`)
  }
  if (Array.isArray(filters.rooms) && filters.rooms.length > 0) {
    parts.push(`${tc('rooms_label')}: ${(filters.rooms as number[]).join(', ')}`)
  }
  if (filters.locationId) {
    // Location name not available without a join — show location_id as fallback
    parts.push(`#${filters.locationId}`)
  }

  return parts.length > 0 ? (
    <p className="text-xs text-muted-foreground truncate">{parts.join(' · ')}</p>
  ) : null
}


export function SavedSearchesTab({ savedSearches: initial }: Props) {
  const t = useTranslations('saved_search')
  const tc = useTranslations('cabinet')
  const locale = useLocale()
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [isPendingDeleteAll, startDeleteAll] = useTransition()

  useEffect(() => { setItems(initial) }, [initial])

  function buildUrl(filters: Record<string, unknown>): string {
    const params = canonicalToSearchParams(filters as CanonicalFilters)
    const qs = params.toString()
    return `/${locale}/listings${qs ? `?${qs}` : ''}`
  }

  async function handleOpen(id: string, url: string) {
    // Update last_viewed_at + reset new_count AFTER navigating (fire-and-forget)
    router.push(url)
    updateLastViewed(id).catch(() => {})
    // Optimistic: clear badge immediately
    setItems(prev => prev.map(s => s.id === id ? { ...s, new_count: 0 } : s))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteSavedSearch(id)
    if (result.error) {
      toast.error(tc('error_deleting'))
    } else {
      setItems(prev => prev.filter(s => s.id !== id))
    }
    setDeletingId(null)
  }

  async function toggleNotify(id: string, current: boolean) {
    const result = await updateSavedSearchNotify(id, !current)
    if (!result.error) {
      setItems(prev => prev.map(s => s.id === id ? { ...s, notify_email: !current } : s))
    }
  }

  function handleDeleteAll() {
    startDeleteAll(async () => {
      const result = await deleteAllSavedSearches()
      if (result.error) {
        toast.error(tc('error_deleting'))
      } else {
        setItems([])
      }
      setShowDeleteAll(false)
    })
  }

  if (items.length === 0) {
    return (
      <div className="saved-searches-tab bg-card rounded-2xl border shadow-sm p-12 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold text-base">{t('empty_state')}</p>
      </div>
    )
  }

  return (
    <>
      <Dialog open={showDeleteAll} onOpenChange={(open) => !open && setShowDeleteAll(false)}>
        <DialogContent showCloseButton={false}>
          <p className="font-semibold text-base">{t('delete_all_confirm')}</p>
          <p className="text-sm text-destructive">{t('delete_all_warning')}</p>
          <p className="text-xs text-muted-foreground">{items.length} {tc('searches_tab')}</p>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(false)} disabled={isPendingDeleteAll}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={isPendingDeleteAll}>
              {isPendingDeleteAll ? '...' : tc('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="saved-searches-tab flex flex-col gap-3">
        {/* Delete all button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
            onClick={() => setShowDeleteAll(true)}
          >
            <Trash className="h-3.5 w-3.5" />
            {t('delete_all_confirm')}
          </Button>
        </div>

        {items.map(search => {
          const filters = (search.filters ?? {}) as Record<string, unknown>
          const url = buildUrl(filters)

          return (
            <div
              key={search.id}
              className="bg-card rounded-xl border shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Search className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {search.name || tc('unnamed_search')}
                  </p>
                  {search.new_count > 0 && (
                    <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {t('new_listings_badge', { count: search.new_count })}
                    </span>
                  )}
                </div>
                <FilterSummary filters={filters} />
                <p className="text-[11px] text-muted-foreground mt-1">
                  <RelativeTime date={search.created_at} />
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Email notify toggle */}
                <button
                  type="button"
                  onClick={() => toggleNotify(search.id, search.notify_email)}
                  aria-label={tc('notify_on_email')}
                  title={tc('notify_on_email')}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
                    search.notify_email
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>

                {/* Open search */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => handleOpen(search.id, url)}
                  aria-label={t('open_search')}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                {/* Delete */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/50"
                  disabled={deletingId === search.id}
                  onClick={() => handleDelete(search.id)}
                  aria-label={tc('delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
