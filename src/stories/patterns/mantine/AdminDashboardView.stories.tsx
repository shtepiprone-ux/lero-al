import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminDashboardView, type AdminDashboardViewProps } from '@/modules/admin/dashboard/components/AdminDashboardView'
import { DASHBOARD_PERIOD_NOW } from '@/stories/fixtures/dashboardPeriod.fixture'
import {
  adminDashboardAllOk,
  adminDashboardAdm02Error,
  adminDashboardAllQueuesZero,
  adminDashboardAdm09Zero,
  adminDashboardNoLocationRequests,
  adminTrendsAllOk,
  adminTrendsError,
  adminCitiesAllOk,
  adminCitiesOnlyOther,
} from '@/stories/fixtures/adminDashboard.fixtures'
import {
  activitySeriesCurrentAllOk,
  activitySeriesAllZero,
  activitySeriesFailed,
  freshnessFresh,
  freshnessStale,
  freshnessFailed,
} from '@/stories/fixtures/agentStatistics.fixtures'

// Task 853 — canonical Mantine story for the `/admin` operations dashboard (16c/GR-3a: no prior
// canonical Story renders this production component; CREATE per the kickoff's GR-3a receipt).
// Task 890 (GR-3a: EXTEND this same Story, no new file) — the dashboard is rebuilt around charts, so
// every export below composes the same fixtures explicitly: 847's `AdminDashboardData`, the
// platform activity series (849; the agent dashboard's own fixtures, since both read the same
// aggregate shape), the trend/city reads of `trends.ts`, and a frozen `now`.
// `AdminDashboardView` calls `useRouter()`/`usePathname()` for its own retry and period callbacks
// (791 boundary — the view owns the callbacks), so the Next.js navigation mock is required here, the
// same way `AdminShell.stories.tsx` needs it. Viewport and locale are switched via the Storybook
// toolbar (Task 799 caveat).
// GR-3b (review 1, F1): in production `/admin` renders inside `AdminShell` (`src/app/admin/layout.tsx:7`), whose
// `MantineAppShellFoundation` has `navbarBreakpoint="lg"` (`src/components/admin/AdminShell.tsx:23`) and a fixed
// 240px navbar from 1024px. Every export therefore renders inside the real `AdminShell` (one meta decorator),
// the same way `AdminShell.stories.tsx` does — no Box, width, padding or viewport pin of this Story's own.
// GR-3d: no `StoryPageGutter` — this page-level View carries its own page gutter, the root
// `MantineDashboardGrid` (`px={{ base: 'md', md: 'xl' }}`, `src/design-system/mantine/patterns/MantineDashboardGrid.tsx`).
function withAdminShell(Story: Parameters<Decorator>[0]) {
  return (
    <AdminShell siteName="Lero.al">
      <Story />
    </AdminShell>
  )
}

const meta: Meta<typeof AdminDashboardView> = {
  title: 'Patterns/Mantine/AdminDashboardView',
  component: AdminDashboardView,
  tags: ['autodocs'],
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin' } },
    docs: {
      description: {
        component:
          "Task 853/890 — the `/admin` operations dashboard, recomposed to the owner's Lahomes/Omah references. Composes the 843–846 + 889 canonical patterns over 847's `AdminDashboardData`, 849's platform activity series and `trends.ts`; `src/app/admin/page.tsx` fetches every block server-side and passes them here unchanged (the 791 server→client boundary — this component owns every callback itself).",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminDashboardView>

/** The all-ok baseline every export overrides one piece of. */
function baseProps(locale: string): AdminDashboardViewProps {
  return {
    data: adminDashboardAllOk(locale),
    activity: activitySeriesCurrentAllOk(30),
    freshness: freshnessFresh(),
    trends: adminTrendsAllOk(30),
    cities: adminCitiesAllOk(),
    locale,
    now: DASHBOARD_PERIOD_NOW,
    period: { kind: '30d' },
    periodDays: 30,
  }
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} />
  },
}
/** R7 state — the ADM-02 query fails; every other block still renders its own data. */
export const Adm02Error: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} data={adminDashboardAdm02Error(locale)} />
  },
}

/** R7 state — ADM-01/02/06 are all genuinely empty (the positive empty texts, never a bare 0). */
export const AllQueuesZero: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} data={adminDashboardAllQueuesZero(locale)} />
  },
}

/** R7 state — ADM-09's visibility-check breakdown is all zero (the positive zero state). */
export const Adm09Zero: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} data={adminDashboardAdm09Zero(locale)} />
  },
}

/** R7 state — no location requests: the work-list row's fourth card does not render at all. */
export const NoLocationRequests: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} data={adminDashboardNoLocationRequests(locale)} />
  },
}

/** Task 890 R8 — the activity aggregate is stale: the chart and totals still show their data, with
 *  the stale caption, and the header's updated-at reads the last refresh (never "now"). */
export const ActivityStale: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} freshness={freshnessStale()} />
  },
}

/** Task 890 R8 — the series and freshness reads fail: the activity card errors with Retry and shows
 *  neither a chart of zeros nor zero totals; every other block is unaffected. */
export const ActivityError: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} activity={activitySeriesFailed()} freshness={freshnessFailed()} />
  },
}

/** Task 890 — the whole period has no recorded activity: the chart's empty state, no totals strip. */
export const ActivityEmptyPeriod: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} activity={activitySeriesAllZero(30)} />
  },
}

/** Task 890 R2 — every trend read failed (or hit the row limit): the new-listings/new-users card and
 *  the three queue sparklines error; the queue counts themselves are unaffected. */
export const TrendsError: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} trends={adminTrendsError()} />
  },
}

/** Task 890 R3 — no visible listing resolves to a city: the city card shows a single "Other" bar. */
export const CitiesOnlyOther: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView {...baseProps(locale)} cities={adminCitiesOnlyOther()} />
  },
}
