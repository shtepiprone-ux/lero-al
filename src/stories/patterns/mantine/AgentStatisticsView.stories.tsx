import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AgentStatisticsView } from '@/modules/cabinet/statistics/components/AgentStatisticsView'
import { DASHBOARD_PERIOD_NOW } from '@/stories/fixtures/dashboardPeriod.fixture'
import {
  agentStatisticsAllOk,
  agentStatisticsNoActivity,
  agentStatisticsAgt01AllZero,
  agentStatisticsAgt10Empty,
  agentStatisticsAgt10FilteredEmpty,
  agentStatisticsSortedByViews,
  activitySeriesCurrentAllOk,
  activitySeriesPreviousAllOk,
  activitySeriesSortedByViews,
  activitySeriesAllZero,
  activitySeriesFailed,
  freshnessFresh,
  freshnessStale,
  freshnessFailed,
  topListingsAllOk,
  topListingsSortedByViews,
  topListingsAllZero,
  portfolioAllOk,
  portfolioAllZero,
} from '@/stories/fixtures/agentStatistics.fixtures'
import type { Agt10Table } from '@/modules/cabinet/statistics/types'

// Task 854 — canonical Mantine story for `/{locale}/cabinet/statistics` (16c/GR-3a: no prior
// canonical Story renders this production component; CREATE per the kickoff's GR-3a receipt).
// Rebuilt by Task 891 (§2.1) around 849's activity aggregate: KPI mini-charts, the activity area
// chart, the top-listings bar chart and the portfolio donut all consume the same fixtures every
// story below composes explicitly (854 R9 `EXTEND`, no new Story file).
// `AgentStatisticsView` calls `useRouter()`/`usePathname()` for its own period/table/pagination
// callbacks (791 boundary — the view owns every callback itself), so the Next.js navigation mock is
// required here, the same way `AdminDashboardView.stories.tsx` needs it. Viewport and locale are
// switched via the Storybook toolbar (Task 799 caveat).
const meta: Meta<typeof AgentStatisticsView> = {
  title: 'Patterns/Mantine/AgentStatisticsView',
  component: AgentStatisticsView,
  tags: ['autodocs'],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/en/cabinet/statistics' } },
    docs: {
      description: {
        component:
          "Task 854/891 — the agent dashboard. Composes the 843-846/845/889 canonical patterns over 848's `AgentStatisticsData` and 849's activity aggregate (series, by-listing, freshness); `src/app/[locale]/cabinet/statistics/page.tsx` fetches every block server-side and passes them here unchanged (the 791 server→client boundary — this component owns every callback itself).",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentStatisticsView>

const DEFAULT_TABLE: Agt10Table = { sort: 'created_at', direction: 'desc', page: 1 }

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAllOk(locale)}
        activitySeriesCurrent={activitySeriesCurrentAllOk()}
        activitySeriesPrevious={activitySeriesPreviousAllOk()}
        freshness={freshnessFresh()}
        topListings={topListingsAllOk(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** R7 state — AGT-01's three actions are all genuinely empty (the positive empty text, never a bare 0). */
export const Agt01AllZero: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAgt01AllZero(locale)}
        activitySeriesCurrent={activitySeriesCurrentAllOk()}
        activitySeriesPrevious={activitySeriesPreviousAllOk()}
        freshness={freshnessFresh()}
        topListings={topListingsAllOk(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** R7 state — AGT-10 is genuinely empty: "You have no listings yet" + the Add listing CTA; the
 *  top-listings chart and the portfolio donut are correspondingly empty (a brand-new agent). */
export const Agt10Empty: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAgt10Empty()}
        activitySeriesCurrent={activitySeriesAllZero()}
        activitySeriesPrevious={activitySeriesAllZero()}
        freshness={freshnessFresh()}
        topListings={topListingsAllZero()}
        portfolio={portfolioAllZero()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** R12 (854 review 1, F1, GR-3a EXTEND) — a filter matches nothing while the agent has listings:
 *  the filter row stays and the pattern's own empty path reads "No listings match these filters",
 *  never "You have no listings yet" / the Add-listing CTA. */
export const Agt10FilteredEmpty: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAgt10FilteredEmpty(locale)}
        activitySeriesCurrent={activitySeriesCurrentAllOk()}
        activitySeriesPrevious={activitySeriesPreviousAllOk()}
        freshness={freshnessFresh()}
        topListings={topListingsAllOk(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={{ status: 'sold', sort: 'created_at', direction: 'desc', page: 1 }}
      />
    )
  },
}

/** Task 891 R9 — the aggregate is stale: the header and the activity card show the last refresh
 *  time (R10), and the activity chart still renders its (last-known) data — never a blank chart. */
export const ActivityStale: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAllOk(locale)}
        activitySeriesCurrent={activitySeriesCurrentAllOk()}
        activitySeriesPrevious={activitySeriesPreviousAllOk()}
        freshness={freshnessStale()}
        topListings={topListingsAllOk(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** Task 891 R9 — the freshness read itself failed: the activity chart and all three KPI
 *  mini-charts show their error state with Retry — never a false `0` (R10). */
export const ActivityError: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsAllOk(locale)}
        activitySeriesCurrent={activitySeriesFailed()}
        activitySeriesPrevious={activitySeriesFailed()}
        freshness={freshnessFailed()}
        topListings={topListingsAllOk(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** Task 891 R9 — a real, successfully-read all-zero period: every KPI reads 0 with "no base for
 *  comparison", the activity chart shows its empty state (review 1, F2 — never a flat zero-axis
 *  line), and the top-listings chart is empty — all after a SUCCESSFUL read, never a failure
 *  disguised as zero. AGT-10's own rows carry no activity either (review 1, F4b — `data` is
 *  `agentStatisticsNoActivity`, not the normal fixture, so its rows never contradict the empty
 *  chart/top-listings with real views/clicks/inquiries/last-activity). */
export const NoActivity: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsNoActivity(locale)}
        activitySeriesCurrent={activitySeriesAllZero()}
        activitySeriesPrevious={activitySeriesAllZero()}
        freshness={freshnessFresh()}
        topListings={topListingsAllZero()}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={DEFAULT_TABLE}
      />
    )
  },
}

/** Task 891 R9 — 25 listings, `sort=views_desc`, page 1 of 3: `recordedViews` is strictly
 *  decreasing down the page (AC6's cross-page ordering). Review 2, F7: the activity series and the
 *  top-listings ranking both derive from the same `SORTED_BY_LISTING` array AGT-10's rows merge
 *  from, so the bar values and the KPI totals can never disagree with the rows again. */
export const SortedByViews: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AgentStatisticsView
        data={agentStatisticsSortedByViews(locale)}
        activitySeriesCurrent={activitySeriesSortedByViews()}
        activitySeriesPrevious={activitySeriesPreviousAllOk()}
        freshness={freshnessFresh()}
        topListings={topListingsSortedByViews(locale)}
        portfolio={portfolioAllOk()}
        locale={locale}
        now={DASHBOARD_PERIOD_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
        table={{ sort: 'recorded_views', direction: 'desc', page: 1 }}
      />
    )
  },
}
