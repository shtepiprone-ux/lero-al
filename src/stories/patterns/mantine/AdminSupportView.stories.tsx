import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminSupportView } from '@/components/admin/AdminSupportView'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { matchesSupportFilters, type SupportFilters } from '@/components/admin/supportFilters'
import type { SupportTicketRow } from '@/components/admin/AdminSupportManager'
import { FIXTURE_TICKETS, FIXTURE_SUPPORT_TICKETS_EXTRA } from '@/stories/fixtures/admin.fixtures'
import { withAdminShell } from '@/stories/_StoryAdminShell'

// Task 859 — presentational View of the `/admin/support` list (Container/Presentational split of
// `AdminSupportManager`). GR-3a: CREATE — the only Story that rendered this surface was the legacy
// `Admin/AdminSupportManager` (deleted in the same task). The canonical admin list anatomy: header with the create action, three stat cards, the type
// `Tabs`, the status `MantineSelect`, the assignment filter and the shared `AdminTable` (table from 768px,
// cards below). Rendered inside the real `AdminShell` and the route's `AdminPageFrame` (GR-3b admin rule); the
// filters are local state and the tickets are labelled fixture data. Viewport and locale come from the
// Storybook toolbar.
const meta: Meta<typeof AdminSupportView> = {
  title: 'Patterns/Mantine/AdminSupportView',
  component: AdminSupportView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/support' } },
    docs: {
      description: {
        component:
          'Support and complaint list: stat cards over every loaded ticket, type tabs, a status select (all, active, one status), the assignment filter and the shared `AdminTable`. Row click selects a ticket; the container opens the detail dialog.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminSupportView>

// Fixture data (labelled): five tickets — open, in progress, resolved, a long open one and a closed complaint.
const ALL_TICKETS: SupportTicketRow[] = [...FIXTURE_TICKETS, ...FIXTURE_SUPPORT_TICKETS_EXTRA]

function ViewDemo({ initialFilters, tickets = ALL_TICKETS }: { initialFilters: SupportFilters; tickets?: SupportTicketRow[] }) {
  const [filters, setFilters] = useState<SupportFilters>(initialFilters)
  const counts = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  }
  return (
    <AdminPageFrame width="shell">
      <AdminSupportView
        tickets={tickets.filter(t => matchesSupportFilters(t, filters))}
        counts={counts}
        filters={filters}
        onFiltersChange={setFilters}
        onSelect={() => {}}
        onNew={() => {}}
      />
    </AdminPageFrame>
  )
}

export const Default: Story = {
  render: () => <ViewDemo initialFilters={{ type: 'all', status: 'all', assigned: 'all' }} />,
}

export const UnassignedLanding: Story = {
  render: () => <ViewDemo initialFilters={{ type: 'all', status: 'active', assigned: 'unassigned' }} />,
}

export const Empty: Story = {
  render: () => <ViewDemo initialFilters={{ type: 'all', status: 'all', assigned: 'all' }} tickets={[]} />,
}
