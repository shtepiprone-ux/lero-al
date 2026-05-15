'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PROPERTY_TYPES, CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'

interface Location { id: number; name_al: string }
interface Props { locations: Location[] }

interface Chip {
  key: string
  label: string
  paramKey: string
  multiValue?: string  // if set, removes only this value from comma-list
}

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function ActiveFilterChips({ locations }: Props) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  function removeChip(chip: Chip) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (chip.multiValue !== undefined) {
      const current = (params.get(chip.paramKey) ?? '').split(',').filter(Boolean)
      const next = current.filter(v => v !== chip.multiValue)
      if (next.length > 0) params.set(chip.paramKey, next.join(','))
      else params.delete(chip.paramKey)
    } else {
      params.delete(chip.paramKey)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const chips: Chip[] = []

  const type = searchParams.get('type')
  if (type) chips.push({ key: 'type', label: tl(type), paramKey: 'type' })

  const propType = searchParams.get('property_type')
  if (propType) {
    const pt = PROPERTY_TYPES.find(p => p.value === propType)
    if (pt) chips.push({ key: 'property_type', label: tl(pt.labelKey), paramKey: 'property_type' })
  }

  const marketType = searchParams.get('market_type')
  if (marketType) {
    const mt = MARKET_TYPES.find(m => m.value === marketType)
    if (mt) chips.push({ key: 'market_type', label: tl(mt.labelKey), paramKey: 'market_type' })
  }

  const locationId = searchParams.get('location_id')
  if (locationId) {
    const loc = locations.find(l => String(l.id) === locationId)
    if (loc) chips.push({ key: 'location_id', label: loc.name_al, paramKey: 'location_id' })
  }

  // Rooms — individual chip per selected room
  const roomsParam = searchParams.get('rooms')
  if (roomsParam) {
    roomsParam.split(',').filter(Boolean).forEach(r => {
      chips.push({
        key: `rooms_${r}`,
        label: `${r === '5' ? '5+' : r} ${t('rooms_label').toLowerCase()}`,
        paramKey: 'rooms',
        multiValue: r,
      })
    })
  }

  const priceMin = searchParams.get('price_min')
  if (priceMin) chips.push({ key: 'price_min', label: `≥ ${fmt(Number(priceMin))} €`, paramKey: 'price_min' })

  const priceMax = searchParams.get('price_max')
  if (priceMax) chips.push({ key: 'price_max', label: `≤ ${fmt(Number(priceMax))} €`, paramKey: 'price_max' })

  const areaMin = searchParams.get('area_min')
  if (areaMin) chips.push({ key: 'area_min', label: `≥ ${areaMin} m²`, paramKey: 'area_min' })

  const areaMax = searchParams.get('area_max')
  if (areaMax) chips.push({ key: 'area_max', label: `≤ ${areaMax} m²`, paramKey: 'area_max' })

  const floorMin = searchParams.get('floor_min')
  if (floorMin) chips.push({ key: 'floor_min', label: `≥ ${floorMin} ${t('floor_range').toLowerCase()}`, paramKey: 'floor_min' })

  const floorMax = searchParams.get('floor_max')
  if (floorMax) chips.push({ key: 'floor_max', label: `≤ ${floorMax} ${t('floor_range').toLowerCase()}`, paramKey: 'floor_max' })

  const floorsTotalMin = searchParams.get('floors_total_min')
  if (floorsTotalMin) chips.push({ key: 'floors_total_min', label: `≥ ${floorsTotalMin} ${t('floors_total_range').toLowerCase()}`, paramKey: 'floors_total_min' })

  const floorsTotalMax = searchParams.get('floors_total_max')
  if (floorsTotalMax) chips.push({ key: 'floors_total_max', label: `≤ ${floorsTotalMax} ${t('floors_total_range').toLowerCase()}`, paramKey: 'floors_total_max' })

  const condition = searchParams.get('condition')
  if (condition) {
    const c = CONDITIONS.find(c => c.value === condition)
    if (c) chips.push({ key: 'condition', label: tl(c.labelKey), paramKey: 'condition' })
  }

  // Layout features — individual chip per feature
  const layoutParam = searchParams.get('layout_features')
  if (layoutParam) {
    layoutParam.split(',').filter(Boolean).forEach(f => {
      const feat = LAYOUT_FEATURES.find(lf => lf.value === f)
      if (feat) chips.push({ key: `layout_${f}`, label: tl(feat.labelKey), paramKey: 'layout_features', multiValue: f })
    })
  }

  const heating = searchParams.get('heating')
  if (heating) {
    const h = HEATING_TYPES.find(h => h.value === heating)
    if (h) chips.push({ key: 'heating', label: tl(h.labelKey), paramKey: 'heating' })
  }

  const wallType = searchParams.get('wall_type')
  if (wallType) {
    const w = WALL_TYPES.find(w => w.value === wallType)
    if (w) chips.push({ key: 'wall_type', label: tl(w.labelKey), paramKey: 'wall_type' })
  }

  const yearBuiltMin = searchParams.get('year_built_min')
  if (yearBuiltMin) chips.push({ key: 'year_built_min', label: `≥ ${yearBuiltMin}`, paramKey: 'year_built_min' })

  const yearBuiltMax = searchParams.get('year_built_max')
  if (yearBuiltMax) chips.push({ key: 'year_built_max', label: `≤ ${yearBuiltMax}`, paramKey: 'year_built_max' })

  const offerType = searchParams.get('offer_type')
  if (offerType) {
    const ot = OFFER_TYPES.find(o => o.value === offerType)
    if (ot) chips.push({ key: 'offer_type', label: tl(ot.labelKey), paramKey: 'offer_type' })
  }

  // Purchase conditions — individual chip per condition
  const purchaseParam = searchParams.get('purchase_conditions')
  if (purchaseParam) {
    purchaseParam.split(',').filter(Boolean).forEach(pc => {
      const cond = PURCHASE_CONDITIONS.find(c => c.value === pc)
      if (cond) chips.push({ key: `purchase_${pc}`, label: tl(cond.labelKey), paramKey: 'purchase_conditions', multiValue: pc })
    })
  }

  const dateFrom = searchParams.get('date_from')
  if (dateFrom) chips.push({ key: 'date_from', label: `${t('date_from')}: ${dateFrom}`, paramKey: 'date_from' })

  const dateTo = searchParams.get('date_to')
  if (dateTo) chips.push({ key: 'date_to', label: `${t('date_to')}: ${dateTo}`, paramKey: 'date_to' })

  const listingId = searchParams.get('listing_id')
  if (listingId) chips.push({ key: 'listing_id', label: `ID: ${listingId}`, paramKey: 'listing_id' })

  if (chips.length === 0) return null

  return (
    <div className="active-filter-chips flex flex-wrap items-center gap-2 pt-3 pb-1">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 select-none"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => removeChip(chip)}
            className="hover:opacity-60 transition-opacity leading-none"
            aria-label={t('aria_remove_filter')}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(pathname)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
      >
        <X className="h-3 w-3" />
        {t('reset_filters')}
      </Button>
    </div>
  )
}
