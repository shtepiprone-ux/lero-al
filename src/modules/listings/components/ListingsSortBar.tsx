'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/shared/Combobox'

interface Props {
  total: number
  page: number
  perPage: number
  view: 'grid' | 'list'
  onViewChange: (v: 'grid' | 'list') => void
  onFiltersOpen: () => void
  activeFiltersCount: number
}

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort_newest' },
  { value: 'price_asc', labelKey: 'sort_price_asc' },
  { value: 'price_desc', labelKey: 'sort_price_desc' },
  { value: 'area_desc', labelKey: 'sort_area_desc' },
  { value: 'area_asc', labelKey: 'sort_area_asc' },
] as const

export function ListingsSortBar({ total, page, perPage, view, onViewChange, onFiltersOpen, activeFiltersCount }: Props) {
  const t = useTranslations('listing')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sort = searchParams.get('sort') ?? 'newest'
  const from = Math.min((page - 1) * perPage + 1, total)
  const to = Math.min(page * perPage, total)

  function setSort(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="listings-sort-bar flex items-center justify-between gap-3 py-3 border-b">
      {/* Left: count + range */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
        <span className="font-semibold text-sm text-foreground">
          {total === 1 ? t('found_results_one') : t('found_results', { count: total })}
        </span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            · {t('showing_results', { from, to, total })}
          </span>
        )}
      </div>

      {/* Right: filters btn (mobile) + sort + view toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile filters button */}
        <Button
          variant="outline"
          size="lg"
          className="md:hidden px-3 rounded-xl relative gap-1.5"
          onClick={onFiltersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:block">{t('filters_title')}</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Sort combobox */}
        <Combobox
          options={SORT_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
          value={sort}
          onChange={v => { if (v) setSort(v) }}
          variant="button"
          size="sm"
          className="w-auto min-w-[140px]"
        />

        {/* Grid / List toggle */}
        <div className="hidden sm:flex items-center bg-muted rounded-xl p-1">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('grid')}
            aria-label={t('view_grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('list')}
            aria-label={t('view_list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
