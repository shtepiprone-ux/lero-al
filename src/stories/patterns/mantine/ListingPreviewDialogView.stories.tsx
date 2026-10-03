import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListingPreviewDialogView } from '@/components/admin/ListingPreviewDialogView'
import { usePreviewStatusOptions } from '@/components/admin/ListingPreviewDialog'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import type { ListingStatus } from '@/types/database'

// Task 857 — presentational View of the listing preview dialog (Container/Presentational split of
// `AdminListingsTable`). GR-3a: CREATE — the legacy `Admin/AdminListingsTable` Story opened the legacy dialog and is
// deleted in this task. Overlay-only Story (GR-3d: no gutter wrapper): each export opens the controlled
// `MantineModal` on mount — centred from 640px, bottom sheet below. The status actions come from the production
// hook `usePreviewStatusOptions` (the transition engine's real set for the fixture status); the listings are
// labelled fixture data. Viewport and locale come from the Storybook toolbar.
// Task 857 Revision 7/8: the dialog is built on the canonical dialog anatomy (docs §23.7) and shows no listing card (the
// listing's row stays visible behind it). The fixtures carry `premium_until` for the premium state. The description shows
// the translated property-type label, mapped from a `{ value, label }` list the way `AdminListingsTable.tsx` does with
// `usePropertyTypes`. GR-3a: EXTEND — states of this Story.
const meta: Meta<typeof ListingPreviewDialogView> = {
  title: 'Patterns/Mantine/ListingPreviewDialogView',
  component: ListingPreviewDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Listing preview on the canonical dialog anatomy (docs §23.7): a structured `MantineModal` whose sections are the status as `StatusChangeSelect`, the facts as `MantineDetailList` and the navigation as `MantineNavRowList` (hidden listings have no public-page row); the footer is an equal-width Delete (secondary) and Edit (the one primary) pair; the delete confirmation shows one section and a Cancel / filled red Delete pair.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ListingPreviewDialogView>

// Labelled fixture: an end date for the premium state (frozen day, no wall clock).
const SUMMARY = { premium_until: '2027-06-15T00:00:00Z' }
const ACTIVE = { ...FIXTURE_LISTINGS[0], ...SUMMARY }
const PENDING = { ...FIXTURE_LISTINGS[1], ...SUMMARY }
const SOLD = { ...FIXTURE_LISTINGS[3], ...SUMMARY }

// The property types the fixtures use, labelled from the existing `listing.property_type_*` messages.
const FIXTURE_PROPERTY_TYPES = ['apartment', 'house', 'commercial']

function DialogDemo({
  listing: initialListing,
  showDeleteConfirm: initialConfirm = false,
}: { listing: AdminListing; showDeleteConfirm?: boolean }) {
  // Mirrors the production status flow: `AdminListingsTable.tsx` patches `previewListing.status` once the action
  // resolves, and the controlled `StatusChangeSelect` shows the new value only when its parent passes it.
  const [listing, setListing] = useState(initialListing)
  const tc = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialConfirm)
  const statusLabels = Object.fromEntries(
    LISTING_STATUS_CODES.map(s => [s, getListingStatusLabel(s, k => tc(k as Parameters<typeof tc>[0]))]),
  ) as Record<ListingStatus, string>
  const statusOptions = usePreviewStatusOptions(listing.status, statusLabels)
  const propertyTypes = FIXTURE_PROPERTY_TYPES.map(value => ({ value, label: (tl as (k: string) => string)(`property_type_${value}`) }))
  return (
    <ListingPreviewDialogView
      listing={listing}
      typeLabel={`${(tl as (k: string) => string)(listing.listing_type)} · ${propertyTypes.find(pt => pt.value === listing.property_type)?.label ?? listing.property_type}`}
      statusOptions={statusOptions}
      onStatusChange={({ toStatus }) => setListing(prev => ({ ...prev, status: toStatus }))}
      showDeleteConfirm={showDeleteConfirm}
      deleting={false}
      onShowDeleteConfirm={setShowDeleteConfirm}
      onDelete={() => {}}
      onPremium={() => {}}
      onClose={() => {}}
    />
  )
}

export const Active: Story = { render: () => <DialogDemo listing={ACTIVE} /> }

export const SoldStatusActions: Story = { render: () => <DialogDemo listing={SOLD} /> }

export const Hidden: Story = { render: () => <DialogDemo listing={PENDING} /> }

export const DeleteConfirm: Story = { render: () => <DialogDemo listing={ACTIVE} showDeleteConfirm /> }

// A premium listing: the details and the premium row show the end date.
export const Premium: Story = { render: () => <DialogDemo listing={{ ...ACTIVE, is_premium: true }} /> }
