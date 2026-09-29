/**
 * Activity-derived render state — Task 891 review 1, F3 (§17.2); split into `cardState`/`chartState`
 * by review 2, F9 (§18.1): a stale all-zero period must still show the card's stale caption, which a
 * single `chartState` that resolved `'empty'` before checking `stale` was silently losing.
 *
 * `kpiState` covers the three KPI mini-chart cards (AGT-03/WhatsApp/AGT-05): a failed freshness
 * read, a failed current-period series read, OR a failed previous-period series read all put them
 * into `'error'` — R2's "a failed series read puts those three cards into their error state
 * (Retry), never 0" covers every series R1 fetches, including the previous period (review 1 F3;
 * before this module, a failed previous-period read silently read as "no base for comparison",
 * which asserts the previous period had nothing when it was never read at all).
 *
 * `cardState` drives the activity `MantineDashboardCard`'s own state (its badge/stale caption):
 * `'error'` on a freshness or current-period failure, `'stale'` when the aggregate is stale
 * (independent of whether the period happens to be all-zero — F9), else `'ready'`.
 *
 * `chartState` drives only the inner `MantineDashboardLineChart` (whose own `DashboardChartState`
 * has no `'stale'` value — the card already shows that caption): `'error'` on the same failures,
 * `'empty'` when the current period read succeeded but every day is a genuine zero, else `'ready'`.
 */
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { ActivityFreshness, ActivityPoint } from '@/modules/analytics/activity/types'

export interface ActivityStates {
  kpiState: 'ready' | 'error'
  cardState: 'ready' | 'stale' | 'error'
  chartState: 'ready' | 'empty' | 'error'
}

function isAllZero(points: ActivityPoint[]): boolean {
  return points.every((p) => p.recordedViews === 0 && p.whatsappClicks === 0 && p.listingInquirySubmissions === 0)
}

export function activityStates(
  freshness: BlockResult<ActivityFreshness>,
  current: BlockResult<ActivityPoint[]>,
  previous: BlockResult<ActivityPoint[]>,
): ActivityStates {
  const kpiState: ActivityStates['kpiState'] = !freshness.ok || !current.ok || !previous.ok ? 'error' : 'ready'

  if (!freshness.ok || !current.ok) {
    return { kpiState, cardState: 'error', chartState: 'error' }
  }
  const chartState: ActivityStates['chartState'] = isAllZero(current.data) ? 'empty' : 'ready'
  const cardState: ActivityStates['cardState'] = freshness.data.stale ? 'stale' : 'ready'
  return { kpiState, cardState, chartState }
}
