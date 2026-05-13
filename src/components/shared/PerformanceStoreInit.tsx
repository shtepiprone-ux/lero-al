'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initPerformanceStore } from '@/lib/performance/store'
import { resetPredictiveBudget, resetScrollTracker } from '@/lib/performance/predictive'
import { resetGuard } from '@/lib/performance/imageGuard'

export function PerformanceStoreInit() {
  // Initialize store once — applies data-perf-tier to DOM + subscribes to lero:vitals
  useEffect(() => {
    return initPerformanceStore()
  }, [])

  // Reset predictive budget and image guard on each page navigation.
  // Both are per-page: URL dedup set, suppression counters, and budget must clear
  // on navigation or page 2 starts with exhausted budgets from page 1.
  const pathname = usePathname()
  useEffect(() => {
    resetPredictiveBudget()
    resetScrollTracker()
    resetGuard()
  }, [pathname])

  return null
}
