'use client'

import { useState, useEffect } from 'react'
import type { ExchangeRates } from '@/lib/getExchangeRate'

interface ExchangeRateResult {
  rates: ExchangeRates | null
  /** Backward-compat: EUR/ALL rate (null when unavailable) */
  rate: number | null
  loading: boolean
}

// Module-level singleton cache — survives SPA navigations, resets on full reload.
let cachedRates: ExchangeRates | null = null
let fetchedAt = 0
let inflight: Promise<ExchangeRates | null> | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

function fetchRatesSingleton(): Promise<ExchangeRates | null> {
  if (cachedRates !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedRates)
  }
  if (inflight) return inflight

  inflight = fetch('/api/exchange-rate')
    .then(r => r.json() as Promise<{ rates: ExchangeRates | null }>)
    .then(data => {
      cachedRates = data.rates ?? null
      fetchedAt = Date.now()
      return cachedRates
    })
    .catch(() => cachedRates)
    .finally(() => { inflight = null })

  return inflight!
}

export function useExchangeRate(): ExchangeRateResult {
  const [rates, setRates] = useState<ExchangeRates | null>(cachedRates)
  const [loading, setLoading] = useState(cachedRates === null)

  useEffect(() => {
    let cancelled = false

    if (cachedRates !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
      setRates(cachedRates)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchRatesSingleton().then(r => {
      if (!cancelled) {
        setRates(r)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { rates, rate: rates?.EUR ?? null, loading }
}
