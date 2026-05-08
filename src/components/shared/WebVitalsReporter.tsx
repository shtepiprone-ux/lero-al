'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { startWebVitalsCollection } from '@/lib/performance/collector'
import { reportMetric } from '@/lib/performance/reporter'

export function WebVitalsReporter() {
  const pathname = usePathname()

  useEffect(() => {
    // Capture pathname at mount time — metrics are bound to the initial navigation,
    // not to SPA route changes (Core Web Vitals are page-load metrics).
    return startWebVitalsCollection(pathname, reportMetric)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
