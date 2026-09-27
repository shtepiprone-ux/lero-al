import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent, expect } from 'storybook/test'
import { storyT } from '@/stories/_storyI18n'
import { AdminDashboardRecentListings } from '@/components/admin/AdminDashboardRecentListings'
import {
  MantineDashboardGrid,
  MantineDashboardGridFull,
} from '@/design-system/mantine/patterns/MantineDashboardGrid'
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard'
import type { RecentListingRow } from '@/modules/admin/dashboard/types'

// Task 853 (R4/16d) — `AdminDashboardRecentListings` rebuilt on canonical Mantine (a Stack of
// dividered rows, an `UnstyledButton` opening a `MantineModal` preview — Epic K §11 preserved).
// No prior canonical Story renders this production component (GR-3a: CREATE). The frozen anchor
// matches the Storybook preview's own frozen clock (Task 698, D25), so `RelativeTime` is
// deterministic in a capture. Titles route through `storyT` (docs/storybook-governance.md §14.2);
// owner names reuse `scripts/check-locale-leak.mjs`'s own global proper-noun allowlist.
//
// Review 1, R13 (F4): the component now renders inside its REAL production parent chain —
// `MantineDashboardGrid` > `MantineDashboardGridFull` > `MantineDashboardCard`, exactly as
// `AdminDashboardView.tsx:377-392` composes it — rather than a `Box` wrapper on a theme token,
// which reproduced the outer width contract but skipped the card the component actually lives in.
// No `Box`, no `w`/`maw`/`miw`/`px`/`py`, no `style`, no `theme` import (GR-3b).
const FIXTURE_ANCHOR = new Date('2026-07-30T00:00:00.000Z')
function hoursAgo(hours: number): string {
  return new Date(FIXTURE_ANCHOR.getTime() - hours * 60 * 60 * 1000).toISOString()
}

function listings(locale: string): RecentListingRow[] {
  return [
    { id: 'l1', slug: 'modern-apartment', title: storyT(locale, 'storybook.listing.modern_apartment'), status: 'active', isPremium: true, price: 85000, currency: 'EUR', createdAt: hoursAgo(2), ownerName: 'Ana Koci' },
    { id: 'l2', slug: 'cozy-studio', title: storyT(locale, 'storybook.listing.cozy_studio'), status: 'pending', isPremium: false, price: 45000, currency: 'EUR', createdAt: hoursAgo(6), ownerName: 'Arben Krasniqi' },
    { id: 'l3', slug: 'apartment-long', title: storyT(locale, 'storybook.listing.apartment_long'), status: 'sold', isPremium: false, price: 210000, currency: 'EUR', createdAt: hoursAgo(30), ownerName: 'Blerim Hoxha' },
  ]
}

const meta: Meta<typeof AdminDashboardRecentListings> = {
  title: 'Patterns/Mantine/AdminDashboardRecentListings',
  component: AdminDashboardRecentListings,
  tags: ['autodocs'],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Task 853 — the `/admin` row-5 recent-listings panel. The row title opens a `MantineModal` preview (Epic K §11); price hides below `sm`; status `Badge` colours from `listingStatusTone.ts` (844). Rendered inside its real production parents (`AdminDashboardView.tsx:377-392`).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminDashboardRecentListings>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridFull>
          <MantineDashboardCard title={storyT(locale, 'admin.dashboard.recent_listings_title')} state="ready">
            <AdminDashboardRecentListings
              listings={listings(locale)}
              locale={locale}
              emptyText={storyT(locale, 'admin.dashboard.recent_listings_empty')}
            />
          </MantineDashboardCard>
        </MantineDashboardGridFull>
      </MantineDashboardGrid>
    )
  },
}

export const ModalOpen: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridFull>
          <MantineDashboardCard title={storyT(locale, 'admin.dashboard.recent_listings_title')} state="ready">
            <AdminDashboardRecentListings
              listings={listings(locale)}
              locale={locale}
              emptyText={storyT(locale, 'admin.dashboard.recent_listings_empty')}
            />
          </MantineDashboardCard>
        </MantineDashboardGridFull>
      </MantineDashboardGrid>
    )
  },
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const canvas = within(canvasElement)
    const trigger = await canvas.findByText(listings(locale)[0]!.title)
    await userEvent.click(trigger)
    const dialog = await within(document.body).findByRole('dialog')
    expect(dialog).toBeTruthy()
  },
}

export const Empty: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridFull>
          <MantineDashboardCard title={storyT(locale, 'admin.dashboard.recent_listings_title')} state="ready">
            <AdminDashboardRecentListings
              listings={[]}
              locale={locale}
              emptyText={storyT(locale, 'admin.dashboard.recent_listings_empty')}
            />
          </MantineDashboardCard>
        </MantineDashboardGridFull>
      </MantineDashboardGrid>
    )
  },
}
