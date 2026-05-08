export type MetricRating = 'good' | 'needs-improvement' | 'poor'
export type MetricName = 'LCP' | 'CLS' | 'INP'

// Google Core Web Vitals thresholds — https://web.dev/vitals
export const PERFORMANCE_BUDGETS: Record<MetricName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },  // ms
  CLS: { good: 0.1,  poor: 0.25 }, // unitless score
  INP: { good: 200,  poor: 500 },  // ms
}

export function classifyMetric(name: MetricName, value: number): MetricRating {
  const { good, poor } = PERFORMANCE_BUDGETS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}
