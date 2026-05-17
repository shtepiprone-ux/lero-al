'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { PROPERTY_TYPES } from '@/modules/listings/constants'

export interface DynamicPropertyType { value: string; label: string }

// Module-level singleton cache — survives SPA navigations per locale.
const cache: Record<string, DynamicPropertyType[]> = {}
const inflight: Record<string, Promise<DynamicPropertyType[]>> = {}

function buildFallback(): DynamicPropertyType[] {
  // When DB is unavailable, returns the static constant values.
  // Labels are the raw labelKey strings (caller must handle via i18n or raw display).
  return PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.value }))
}

async function fetchForLocale(locale: string): Promise<DynamicPropertyType[]> {
  if (cache[locale]) return cache[locale]
  if (inflight[locale] !== undefined) return inflight[locale]

  inflight[locale] = fetch(`/api/property-types?locale=${locale}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<DynamicPropertyType[]>
    })
    .then(data => {
      cache[locale] = data
      return data
    })
    .catch(() => buildFallback())
    .finally(() => { delete inflight[locale] })

  return inflight[locale]
}

/**
 * Returns active property types with localized labels for the current UI locale.
 * Falls back to the static PROPERTY_TYPES constant if the API is unavailable.
 * Results are cached per locale for the session.
 */
export function usePropertyTypes(): { propertyTypes: DynamicPropertyType[]; loading: boolean } {
  const locale = useLocale()
  const [propertyTypes, setPropertyTypes] = useState<DynamicPropertyType[]>(
    cache[locale] ?? buildFallback(),
  )
  const [loading, setLoading] = useState(!cache[locale])

  useEffect(() => {
    if (cache[locale]) {
      setPropertyTypes(cache[locale])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchForLocale(locale).then(data => {
      setPropertyTypes(data)
      setLoading(false)
    })
  }, [locale])

  return { propertyTypes, loading }
}
