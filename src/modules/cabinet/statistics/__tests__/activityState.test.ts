import { describe, it, expect } from 'vitest'
import { activityStates } from '../activityState'
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { ActivityFreshness, ActivityPoint } from '@/modules/analytics/activity/types'

const OK_FRESH: BlockResult<ActivityFreshness> = { ok: true, data: { lastSuccessAt: '2026-09-18T08:00:00Z', stale: false } }
const OK_STALE: BlockResult<ActivityFreshness> = { ok: true, data: { lastSuccessAt: '2026-09-16T08:00:00Z', stale: true } }
const FAILED_FRESH: BlockResult<ActivityFreshness> = { ok: false, error: 'query_failed' }

function point(over: Partial<ActivityPoint> = {}): ActivityPoint {
  return { date: '2026-09-17', recordedViews: 0, whatsappClicks: 0, listingInquirySubmissions: 0, ...over }
}

const ALL_ZERO: BlockResult<ActivityPoint[]> = { ok: true, data: [point(), point(), point()] }
const HAS_ACTIVITY: BlockResult<ActivityPoint[]> = { ok: true, data: [point(), point({ recordedViews: 5 }), point()] }
const FAILED_SERIES: BlockResult<ActivityPoint[]> = { ok: false, error: 'query_failed' }

describe('activityStates', () => {
  it('a failed freshness read errors the KPIs, the card and the chart', () => {
    expect(activityStates(FAILED_FRESH, HAS_ACTIVITY, HAS_ACTIVITY)).toEqual({
      kpiState: 'error',
      cardState: 'error',
      chartState: 'error',
    })
  })

  it('a failed current-period read errors the KPIs, the card and the chart', () => {
    expect(activityStates(OK_FRESH, FAILED_SERIES, HAS_ACTIVITY)).toEqual({
      kpiState: 'error',
      cardState: 'error',
      chartState: 'error',
    })
  })

  it('a failed previous-period read errors the KPIs but not the card or the chart (R2, review 1 F3)', () => {
    expect(activityStates(OK_FRESH, HAS_ACTIVITY, FAILED_SERIES)).toEqual({
      kpiState: 'error',
      cardState: 'ready',
      chartState: 'ready',
    })
  })

  it('a stale-but-successful, non-zero aggregate keeps the KPIs ready, marks the card stale, and keeps the chart ready', () => {
    expect(activityStates(OK_STALE, HAS_ACTIVITY, HAS_ACTIVITY)).toEqual({
      kpiState: 'ready',
      cardState: 'stale',
      chartState: 'ready',
    })
  })

  it('a genuine all-zero current period (successful, fresh read) marks the chart empty, never an error, and keeps the card ready', () => {
    expect(activityStates(OK_FRESH, ALL_ZERO, ALL_ZERO)).toEqual({
      kpiState: 'ready',
      cardState: 'ready',
      chartState: 'empty',
    })
  })

  it('everything ready and non-zero is ready/ready/ready', () => {
    expect(activityStates(OK_FRESH, HAS_ACTIVITY, HAS_ACTIVITY)).toEqual({
      kpiState: 'ready',
      cardState: 'ready',
      chartState: 'ready',
    })
  })

  it('an all-zero AND stale period keeps the card stale (its caption must not be lost) while the chart shows empty (review 2, F9)', () => {
    expect(activityStates(OK_STALE, ALL_ZERO, ALL_ZERO)).toEqual({
      kpiState: 'ready',
      cardState: 'stale',
      chartState: 'empty',
    })
  })
})
