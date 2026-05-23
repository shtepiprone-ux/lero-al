'use client'

import { useState, useEffect } from 'react'
import { getActiveCurrencies } from '@/modules/currency/lib/queries'
import type { DBCurrency } from '@/types/database'

// Module-level singleton cache — survives SPA navigations, resets on full reload.
let cachedCurrencies: DBCurrency[] | null = null
let fetchedAt = 0
let inflight: Promise<DBCurrency[]> | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

function fetchCurrenciesSingleton(): Promise<DBCurrency[]> {
  if (cachedCurrencies !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedCurrencies)
  }
  if (inflight) return inflight

  inflight = getActiveCurrencies()
    .then(data => {
      cachedCurrencies = data
      fetchedAt = Date.now()
      return data
    })
    .catch(() => cachedCurrencies ?? [])
    .finally(() => { inflight = null })

  return inflight!
}

// Fallback when DB not yet migrated or unavailable — mirrors the canonical seed rows
const FALLBACK: DBCurrency[] = [
  { id: 1, code: 'ALL', symbol: 'L',  name_sq: 'Lekë',           name_en: 'Albanian Lek',   name_uk: 'Лек',                name_it: 'Lek',                  is_active: true, is_default: true,  decimals: 0, created_at: '', updated_at: '' },
  { id: 2, code: 'EUR', symbol: '€',  name_sq: 'Euro',           name_en: 'Euro',            name_uk: 'Євро',               name_it: 'Euro',                 is_active: true, is_default: false, decimals: 2, created_at: '', updated_at: '' },
  { id: 3, code: 'USD', symbol: '$',  name_sq: 'Dollar amerikan',name_en: 'US Dollar',       name_uk: 'Долар США',          name_it: 'Dollaro USA',          is_active: true, is_default: false, decimals: 2, created_at: '', updated_at: '' },
  { id: 4, code: 'GBP', symbol: '£',  name_sq: 'Paund britanik', name_en: 'British Pound',   name_uk: 'Британський фунт',   name_it: 'Sterlina britannica',  is_active: true, is_default: false, decimals: 2, created_at: '', updated_at: '' },
]

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<DBCurrency[]>(cachedCurrencies ?? FALLBACK)
  const [loading, setLoading] = useState(cachedCurrencies === null)

  useEffect(() => {
    let cancelled = false

    if (cachedCurrencies !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
      setCurrencies(cachedCurrencies)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchCurrenciesSingleton().then(data => {
      if (!cancelled) {
        setCurrencies(data.length > 0 ? data : FALLBACK)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  return { currencies, loading }
}
