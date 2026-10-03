import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminReportsView } from '@/components/admin/AdminReportsView'
import type { ReportStatusFilter } from '@/components/admin/reportStatusFilter'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'

// Task 858 — presentational View of the `/admin/reports` list (Container/Presentational split of
// `AdminReportsManager`). GR-3a: CREATE — the only Story that rendered this surface was the legacy
// `Admin/AdminReportsManager` (deleted in the same task). Status tabs on Mantine `Tabs` with count `Badge`s,
// the list on the shared `AdminTable` (table from 640px, cards below). The detail dialog is the separate
// `ReportDetailDialogView`. `FIXTURE_REPORTS` is labelled fixture data; the tab is local state. Viewport and
// locale come from the Storybook toolbar.
const meta: Meta<typeof AdminReportsView> = {
  title: 'Patterns/Mantine/AdminReportsView',
  component: AdminReportsView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/reports' } },
    docs: {
      description: {
        component:
          'Report moderation list: Mantine `Tabs` (All / Pending / Reviewed / Resolved / Dismissed) with a count `Badge` per non-empty tab, and the shared `AdminTable` (cards below 640px). Row click selects a report; the container opens the detail dialog.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminReportsView>

// Fixture data (labelled): five reports — three pending, one resolved, one dismissed.
const BASE: ReportRow = {
  id: 'r-1',
  listing_id: 'l-1',
  user_id: 'u-reporter',
  reason: 'fraud',
  comment: 'The listing shows a price that does not match the real one.',
  status: 'pending',
  created_at: '2026-09-28T10:30:00Z',
  listing: {
    id: 'l-1',
    title: 'Apartament 2+1 në Tiranë',
    slug: 'apartament-2-1-ne-tirane',
    owner: { id: 'u-owner', name: 'Agim Krasniqi', user_type: 'agent' },
  },
  reporter: { id: 'u-reporter', name: 'Blerina Hoxha' },
}

const FIXTURE_REPORTS: ReportRow[] = [
  BASE,
  {
    ...BASE,
    id: 'r-2',
    reason: 'duplicate',
    comment: null,
    created_at: '2026-09-27T08:00:00Z',
    listing: { id: 'l-2', title: 'Vila me pishinë në Durrës — përballë plazhit', slug: 'vila-durres', owner: null },
    reporter: null,
  },
  { ...BASE, id: 'r-3', reason: 'spam', created_at: '2026-09-25T16:10:00Z', reporter: { id: 'u-3', name: 'Fatmir Gashi' } },
  { ...BASE, id: 'r-4', reason: 'wrong_category', status: 'resolved', created_at: '2026-09-20T12:00:00Z' },
  { ...BASE, id: 'r-5', reason: 'offensive', status: 'dismissed', created_at: '2026-09-18T09:45:00Z' },
]

function ViewDemo({ initialFilter, reports = FIXTURE_REPORTS }: { initialFilter: ReportStatusFilter; reports?: ReportRow[] }) {
  const [filter, setFilter] = useState<ReportStatusFilter>(initialFilter)
  const counts: Record<string, number> = { all: reports.length }
  for (const r of reports) counts[r.status] = (counts[r.status] ?? 0) + 1
  const shown = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  return (
    <AdminPageFrame width="page">
      <AdminReportsView reports={shown} filter={filter} counts={counts} onFilterChange={setFilter} onSelect={() => {}} />
    </AdminPageFrame>
  )
}

export const Default: Story = { render: () => <ViewDemo initialFilter="pending" /> }

export const AllTab: Story = { render: () => <ViewDemo initialFilter="all" /> }

export const Empty: Story = { render: () => <ViewDemo initialFilter="pending" reports={[]} /> }
