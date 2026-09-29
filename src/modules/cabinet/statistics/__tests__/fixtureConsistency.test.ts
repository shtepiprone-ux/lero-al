/**
 * Review 3, R22 — every exported `agentStatistics*` Story data fixture must stay internally
 * consistent with `portfolio.ts`'s own documented identity: `visible = active - hidden`. Review 4
 * found `agentStatisticsAllOk`'s hero (`agt02.visible: 12`) and the donut it feeds via the
 * independently-hardcoded `portfolioAllOk()` (`active: 12`, `hidden: 2` → `visible: 10`) disagreed.
 * This is a data-level check, independent of any rendered Story: it asserts that each fixture's own
 * `agt02.visible` equals `portfolioSegments(agt02.statusCounts, agt01.hidden).visible` for its own
 * `agt01`/`agt02` pair.
 */
import { describe, it, expect } from 'vitest'
import {
  agentStatisticsAllOk,
  agentStatisticsAgt01AllZero,
  agentStatisticsAgt10Empty,
  agentStatisticsAgt10FilteredEmpty,
  agentStatisticsSortedByViews,
  agentStatisticsNoActivity,
} from '@/stories/fixtures/agentStatistics.fixtures'
import { portfolioSegments } from '../portfolio'
import type { AgentStatisticsData } from '../types'

const FIXTURES: [string, () => AgentStatisticsData][] = [
  ['agentStatisticsAllOk', () => agentStatisticsAllOk('en')],
  ['agentStatisticsAgt01AllZero', () => agentStatisticsAgt01AllZero('en')],
  ['agentStatisticsAgt10Empty', () => agentStatisticsAgt10Empty()],
  ['agentStatisticsAgt10FilteredEmpty', () => agentStatisticsAgt10FilteredEmpty('en')],
  ['agentStatisticsSortedByViews', () => agentStatisticsSortedByViews('en')],
  ['agentStatisticsNoActivity', () => agentStatisticsNoActivity('en')],
]

describe('agent statistics fixtures: agt02.visible matches the portfolioSegments visible identity', () => {
  it.each(FIXTURES)('%s', (_name, build) => {
    const data = build()
    expect(data.agt02.ok).toBe(true)
    expect(data.agt01.ok).toBe(true)
    if (!data.agt02.ok || !data.agt01.ok) return
    const expected = portfolioSegments(data.agt02.data.statusCounts, data.agt01.data.hidden).visible
    expect(data.agt02.data.visible).toBe(expected)
  })
})
