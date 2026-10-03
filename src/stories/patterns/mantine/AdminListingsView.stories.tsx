import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AdminListingsView,
  type AdminListingsAuditCounts,
} from '@/components/admin/AdminListingsView'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import type { ListingStatus } from '@/types/database'

// Task 857 — presentational View of the `/admin/listings` list (Container/Presentational split of
// `AdminListingsTable`). GR-3a: CREATE — the legacy `Admin/AdminListingsTable` Story rendered the legacy container
// and is deleted in this task; no canonical Story imported this surface. Tabs, search, status select and the
// segmented visibility filter sit above the audit panel and the `AdminTable` list (cards below 768px). GR-3b/§7.3: every
// export renders inside the real `AdminShell` and the route's `AdminPageFrame` (`width="shell"`), so the table
// has the production card width; GR-3d: the frame is the page gutter. `FIXTURE_LISTINGS` is labelled fixture data; the filters are local state. Viewport and locale
// come from the Storybook toolbar.
const meta: Meta<typeof AdminListingsView> = {
  title: 'Patterns/Mantine/AdminListingsView',
  component: AdminListingsView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/listings' } },
    docs: {
      description: {
        component:
          'Listings list: All / Premium tabs, a debounced search field, a status select and an All / Visible / Hidden-eligible segmented filter; the hidden-eligible audit panel; the `AdminTable` list with ID, listing, type, price, status, visibility, agent and date; pagination. A row click selects a listing; the container opens the preview dialog.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminListingsView>

interface DemoProps {
  listings?: AdminListing[]
  initialTab?: string
  initialStatus?: string
  initialVisibility?: string
  initialReason?: string
  auditCounts?: AdminListingsAuditCounts
  totalPages?: number
  initialPage?: number
}

function ViewDemo({
  listings = FIXTURE_LISTINGS,
  initialTab = 'all',
  initialStatus = '',
  initialVisibility = '',
  initialReason = '',
  auditCounts = { total: 2, expired: 1, noExpiry: 1 },
  totalPages = 1,
  initialPage = 1,
}: DemoProps) {
  const tc = useTranslations('cabinet')
  const [tab, setTab] = useState(initialTab)
  const [status, setStatus] = useState(initialStatus)
  const [visibility, setVisibility] = useState(initialVisibility)
  const [reason, setReason] = useState(initialReason)
  const [page, setPage] = useState(initialPage)
  const [query, setQuery] = useState('')
  const statusLabels = Object.fromEntries(
    LISTING_STATUS_CODES.map(s => [s, getListingStatusLabel(s, k => tc(k as Parameters<typeof tc>[0]))]),
  ) as Record<ListingStatus, string>
  return (
    <AdminPageFrame width="shell">
      <AdminListingsView
        listings={listings}
        page={page}
        totalPages={totalPages}
        activeStatus={status}
        activeTab={tab}
        activeVisibility={visibility}
        activeReason={reason}
        auditCounts={auditCounts}
        statusLabels={statusLabels}
        search={{ value: query, onChange: e => setQuery(e.target.value) }}
        onTabChange={setTab}
        onStatusChange={setStatus}
        onVisibilityChange={value => { setVisibility(value); setReason('') }}
        onAuditSelect={next => { setVisibility('hidden_eligible'); setReason(next ?? '') }}
        onPageChange={setPage}
        onSelect={() => {}}
      />
    </AdminPageFrame>
  )
}

export const Default: Story = { render: () => <ViewDemo /> }

export const PremiumTab: Story = {
  render: () => <ViewDemo initialTab="premium" listings={FIXTURE_LISTINGS.filter(l => l.is_premium)} />,
}

export const FilteredPending: Story = {
  render: () => (
    <ViewDemo initialStatus="pending" listings={FIXTURE_LISTINGS.filter(l => l.status === 'pending')} />
  ),
}

export const VisibleFilter: Story = {
  render: () => (
    <ViewDemo initialVisibility="visible" listings={FIXTURE_LISTINGS.filter(l => l.status === 'active')} />
  ),
}

export const HiddenEligible: Story = {
  render: () => (
    <ViewDemo
      initialVisibility="hidden_eligible"
      initialReason="expired"
      auditCounts={{ total: 3, expired: 2, noExpiry: 1 }}
      listings={FIXTURE_LISTINGS.filter(l => l.status === 'sold')}
    />
  ),
}

export const AuditZero: Story = {
  render: () => <ViewDemo auditCounts={{ total: 0, expired: 0, noExpiry: 0 }} />,
}

export const Empty: Story = { render: () => <ViewDemo listings={[]} /> }

export const Paginated: Story = { render: () => <ViewDemo totalPages={8} initialPage={2} /> }
