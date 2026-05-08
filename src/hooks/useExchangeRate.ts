'use client'

import { useState, useEffect } from 'react'

interface ExchangeRateResult {
  rate: number | null
  loading: boolean
}

// ── Module-level singleton cache ──────────────────────────────────────────────
//
// The listings page mounts two components that each call useExchangeRate():
// ListingsShell and ListingsFilters. Without deduplication they send two
// concurrent fetches to /api/exchange-rate. This singleton ensures exactly
// one in-flight request at a time, and caches the result for the session
// duration (matching the API's 1-hour server-side revalidation window).
//
// Cache is module-scoped: it persists across SPA navigations but resets on
// full page reload. This is the correct granularity — the rate changes at
// most once per hour and a stale rate within a session is acceptable.

let cachedRate: number | null = null
let fetchedAt = 0
let inflight: Promise<number | null> | null = null
const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour — matches API revalidate = 3600

function fetchRateSingleton(): Promise<number | null> {
  // Return cached value immediately if still fresh.
  if (cachedRate !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedRate)
  }
  // Return the in-flight promise if another hook instance already started the fetch.
  if (inflight) return inflight

  inflight = fetch('/api/exchange-rate')
    .then(r => r.json() as Promise<{ rate: number | null }>)
    .then(data => {
      cachedRate = data.rate ?? null
      fetchedAt = Date.now()
      return cachedRate
    })
    .catch(() => cachedRate)  // On error, return stale cached value (null on first load)
    .finally(() => { inflight = null })

  return inflight!
}

export function useExchangeRate(): ExchangeRateResult {
  // Initialize synchronously from the module cache so remounts (SPA navigation
  // back to listings) never flash a loading state when the rate is already known.
  const [rate, setRate] = useState<number | null>(cachedRate)
  const [loading, setLoading] = useState(cachedRate === null)

  useEffect(() => {
    let cancelled = false

    if (cachedRate !== null && Date.now() - fetchedAt < CACHE_TTL_MS) {
      // Cache hit — sync state with current cached value and stop.
      setRate(cachedRate)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchRateSingleton().then(r => {
      if (!cancelled) {
        setRate(r)
        setLoading(false)
      }
    })

    // cancelled prevents a state update if the component unmounts before the
    // fetch resolves. The fetch itself continues and populates cachedRate so
    // the next mount finds the result immediately.
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { rate, loading }
}
