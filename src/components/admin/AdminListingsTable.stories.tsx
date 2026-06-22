import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { AdminListingsTable } from './AdminListingsTable'
import { FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminListingsTable> = {
  title: 'Admin/AdminListingsTable',
  component: AdminListingsTable,
  tags: ['autodocs'],
  args: {
    listings: FIXTURE_LISTINGS,
    total: FIXTURE_LISTINGS.length,
    page: 1,
    perPage: 25,
    activeStatus: '',
    searchQuery: '',
    activeTab: 'all',
    activeVisibility: '',
    activeReason: '',
    auditCounts: { total: 2, expired: 1, noExpiry: 1 },
  },
}
export default meta
type Story = StoryObj<typeof AdminListingsTable>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const FilteredPending: Story = {
  args: {
    listings: FIXTURE_LISTINGS.filter(l => l.status === 'pending'),
    total: 1,
    activeStatus: 'pending',
  },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── Task 456 — visibility surfaces at mobile 320 ────────────────────────────

export const Visibility: Story = {
  args: {
    auditCounts: { total: 3, expired: 2, noExpiry: 1 },
    activeVisibility: 'hidden_eligible',
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const VisibilityAuditZero: Story = {
  args: {
    auditCounts: { total: 0, expired: 0, noExpiry: 0 },
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── Task 427 rework AC R4 — rendered-evidence harness only, no production ────
// component, styling, i18n, engine, gateway, or option-derivation change.
// Opens ListingPreviewDialog for the `sold` fixture (lst-004), which now
// renders the full privileged status-action set (5 buttons).
export const PreviewDialogSoldStatusActions: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story: 'Task 427 rework AC R4 — opens ListingPreviewDialog for a `sold` listing, which now renders the full privileged status-action set (5 buttons). Rendered-evidence harness only.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = await canvas.findByText('Apartament 2+1 — Durrës, pranë bregdetit')
    await userEvent.click(trigger)
  },
}
