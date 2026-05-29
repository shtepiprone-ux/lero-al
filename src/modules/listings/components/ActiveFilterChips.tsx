'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'

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
  const { propertyTypes } = usePropertyTypes()
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

  const premium = searchParams.get('premium')
  if (premium === 'true') chips.push({ key: 'premium', label: tl('filter_chip_premium_only'), paramKey: 'premium' })

  const type = searchParams.get('type')
  if (type) chips.push({ key: 'type', label: tl(type), paramKey: 'type' })

  const propType = searchParams.get('property_type')
  if (propType) {
    const pt = propertyTypes.find(p => p.value === propType)
    if (pt) chips.push({ key: 'property_type', label: pt.label, paramKey: 'property_type' })
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

  // Condition — per-value chips (multi-select)
  const conditionParam = searchParams.get('condition')
  if (conditionParam) {
    conditionParam.split(',').filter(Boolean).forEach(cv => {
      const c = CONDITIONS.find(c => c.value === cv)
      if (c) chips.push({ key: `condition_${cv}`, label: tl(c.labelKey), paramKey: 'condition', multiValue: cv })
    })
  }

  // Layout features — individual chip per feature
  const layoutParam = searchParams.get('layout_features')
  if (layoutParam) {
    layoutParam.split(',').filter(Boolean).forEach(f => {
      const feat = LAYOUT_FEATURES.find(lf => lf.value === f)
      if (feat) chips.push({ key: `layout_${f}`, label: tl(feat.labelKey), paramKey: 'layout_features', multiValue: f })
    })
  }

  // Heating — per-value chips (multi-select)
  const heatingParam = searchParams.get('heating')
  if (heatingParam) {
    heatingParam.split(',').filter(Boolean).forEach(hv => {
      const h = HEATING_TYPES.find(h => h.value === hv)
      if (h) chips.push({ key: `heating_${hv}`, label: tl(h.labelKey), paramKey: 'heating', multiValue: hv })
    })
  }

  // Wall type — per-value chips (multi-select)
  const wallTypeParam = searchParams.get('wall_type')
  if (wallTypeParam) {
    wallTypeParam.split(',').filter(Boolean).forEach(wv => {
      const w = WALL_TYPES.find(w => w.value === wv)
      if (w) chips.push({ key: `wall_type_${wv}`, label: tl(w.labelKey), paramKey: 'wall_type', multiValue: wv })
    })
  }

  const yearBuiltMin = searchParams.get('year_built_min')
  if (yearBuiltMin) chips.push({ key: 'year_built_min', label: `≥ ${yearBuiltMin}`, paramKey: 'year_built_min' })

  const yearBuiltMax = searchParams.get('year_built_max')
  if (yearBuiltMax) chips.push({ key: 'year_built_max', label: `≤ ${yearBuiltMax}`, paramKey: 'year_built_max' })

  // Offer type — per-value chips (multi-select)
  const offerTypeParam = searchParams.get('offer_type')
  if (offerTypeParam) {
    offerTypeParam.split(',').filter(Boolean).forEach(ov => {
      const ot = OFFER_TYPES.find(o => o.value === ov)
      if (ot) chips.push({ key: `offer_type_${ov}`, label: tl(ot.labelKey), paramKey: 'offer_type', multiValue: ov })
    })
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
        <Button
          key={chip.key}
          type="button"
          variant="outline"
          onClick={() => removeChip(chip)}
          className="gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary text-xs font-medium border-primary/20 select-none hover:bg-primary/20 min-h-[44px] sm:min-h-0"
          aria-label={`${chip.label} — ${t('aria_remove_filter')}`}
        >
          {chip.label}
          <X className="h-3 w-3 shrink-0" aria-hidden="true" />
        </Button>
      ))}
    </div>
  )
}
