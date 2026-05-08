'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Search, Trash2, ArrowRight, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { RelativeTime } from '@/components/shared/RelativeTime'

interface Props {
  savedSearches: any[]
  locale: string
}

function buildSearchUrl(filters: Record<string, unknown>, locale: string): string {
  const params = new URLSearchParams()
  const str = (v: unknown) => (v != null && v !== '' ? String(v) : '')
  if (str(filters.type)) params.set('type', str(filters.type))
  if (str(filters.property_type)) params.set('property_type', str(filters.property_type))
  if (str(filters.location_id)) params.set('location_id', str(filters.location_id))
  if (str(filters.price_min)) params.set('price_min', str(filters.price_min))
  if (str(filters.price_max)) params.set('price_max', str(filters.price_max))
  if (str(filters.rooms)) params.set('rooms', str(filters.rooms))
  const qs = params.toString()
  return `/${locale}/listings${qs ? `?${qs}` : ''}`
}

function FilterSummary({ filters }: { filters: Record<string, unknown> }) {
  const tl = useTranslations('listing')
  const tc = useTranslations('common')

  const parts: string[] = []
  if (filters.type) parts.push(tl(filters.type as any))
  if (filters.property_type) parts.push(tl(`property_type_${filters.property_type}` as any))
  if (filters.price_min || filters.price_max) {
    const from = filters.price_min ? String(filters.price_min) : ''
    const to = filters.price_max ? String(filters.price_max) : ''
    const currency = filters.currency ? String(filters.currency) : 'ALL'
    parts.push(from && to ? `${from}–${to} ${currency}` : from ? `>${from} ${currency}` : `<${to} ${currency}`)
  }
  if (Array.isArray(filters.rooms) && filters.rooms.length > 0) {
    parts.push(`${tc('rooms_label')}: ${(filters.rooms as number[]).join(', ')}`)
  }

  return parts.length > 0 ? (
    <p className="text-xs text-muted-foreground truncate">{parts.join(' · ')}</p>
  ) : null
}

export function SavedSearchesTab({ savedSearches: initial }: Props) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('saved_searches').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete saved search', { error, searchId: id })
    } else {
      setItems(prev => prev.filter(s => s.id !== id))
    }
    setDeletingId(null)
  }

  async function toggleNotify(id: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('saved_searches')
      .update({ notify_email: !current })
      .eq('id', id)
    if (!error) {
      setItems(prev => prev.map(s => s.id === id ? { ...s, notify_email: !current } : s))
    }
  }

  if (items.length === 0) {
    return (
      <div className="saved-searches-tab bg-card rounded-2xl border shadow-sm p-12 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold text-base">{t('no_searches')}</p>
      </div>
    )
  }

  return (
    <div className="saved-searches-tab flex flex-col gap-3">
      {items.map(search => {
        const filters = (search.filters ?? {}) as Record<string, unknown>
        const url = buildSearchUrl(filters, locale)

        return (
          <div
            key={search.id}
            className="bg-card rounded-xl border shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Search className="h-4 w-4 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {search.name || t('unnamed_search')}
              </p>
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
                aria-label={tc('notify_email_toggle')}
                title={t('notify_on_email')}
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
                onClick={() => router.push(url)}
                aria-label={tc('aria_open_search')}
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
                aria-label={t('delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
