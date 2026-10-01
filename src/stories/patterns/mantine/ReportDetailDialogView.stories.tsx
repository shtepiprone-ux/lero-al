import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { ReportDetailDialogView } from '@/components/admin/ReportDetailDialogView'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import type { ReportStatus } from '@/types/database'

// Task 858 — presentational View of the `/admin/reports` detail dialog (Container/Presentational split;
// `ReportDetailDialog` is the container). GR-3a: CREATE — no canonical Story imported this View. Overlay-only
// Story (GR-3d: no gutter wrapper): each export opens the controlled `MantineModal` on mount — centred from
// 640px, bottom sheet below — and `DeleteConfirm` opens the second modal over it. Notes, selected status and
// the confirm are local state; the reports are labelled fixture data. Viewport and locale come from the
// Storybook toolbar.
const meta: Meta<typeof ReportDetailDialogView> = {
  title: 'Patterns/Mantine/ReportDetailDialogView',
  component: ReportDetailDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Report detail in the canonical `MantineModal`: label/value rows, the listing and owner links, the status override (`MantineSelect` + Apply), moderator actions with notes, reopen for terminal reports, and the delete confirmation as a second modal. Capability props gate override, reopen and delete.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ReportDetailDialogView>

// Fixture data (labelled).
const FIXTURE_REPORT: ReportRow = {
  id: 'r-story-1',
  listing_id: 'l-1',
  user_id: 'u-reporter',
  reason: 'fraud',
  comment: 'The listing shows a price that does not match the real one.',
  status: 'pending',
  created_at: '2026-01-15T10:30:00Z',
  listing: {
    id: 'l-1',
    title: 'Apartament 2+1 në Tiranë',
    slug: 'apartament-2-1-ne-tirane',
    owner: { id: 'u-owner', name: 'Agim Krasniqi', user_type: 'agent' },
  },
  reporter: { id: 'u-reporter', name: 'Blerina Hoxha' },
}

interface DemoProps {
  report?: ReportRow
  canOverrideReportStatus?: boolean
  canDeleteReports?: boolean
  isPending?: boolean
  initialDeleteConfirm?: boolean
}

function DialogDemo({
  report = FIXTURE_REPORT,
  canOverrideReportStatus = false,
  canDeleteReports = false,
  isPending = false,
  initialDeleteConfirm = false,
}: DemoProps) {
  const locale = useLocale()
  const [notes, setNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(report.status)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialDeleteConfirm)
  return (
    <ReportDetailDialogView
      report={report}
      locale={locale}
      canOverrideReportStatus={canOverrideReportStatus}
      canDeleteReports={canDeleteReports}
      isPending={isPending}
      notes={notes}
      onNotesChange={setNotes}
      selectedStatus={selectedStatus}
      onSelectedStatusChange={setSelectedStatus}
      showDeleteConfirm={showDeleteConfirm}
      onAction={() => {}}
      onRequestDelete={() => setShowDeleteConfirm(true)}
      onCancelDelete={() => setShowDeleteConfirm(false)}
      onConfirmDelete={() => setShowDeleteConfirm(false)}
      onClose={() => {}}
    />
  )
}

export const Pending: Story = { render: () => <DialogDemo /> }

export const FullManagement: Story = {
  render: () => <DialogDemo canOverrideReportStatus canDeleteReports />,
}

export const TerminalReopen: Story = {
  render: () => <DialogDemo report={{ ...FIXTURE_REPORT, status: 'resolved' }} canOverrideReportStatus canDeleteReports />,
}

export const OwnerMissing: Story = {
  render: () => (
    <DialogDemo
      report={{
        ...FIXTURE_REPORT,
        comment: null,
        listing: { id: 'l-2', title: 'Vila me pishinë në Durrës — përballë plazhit', slug: 'vila-durres', owner: null },
        reporter: null,
      }}
    />
  ),
}

export const DeleteConfirm: Story = {
  render: () => <DialogDemo canDeleteReports initialDeleteConfirm />,
}

export const Saving: Story = {
  render: () => <DialogDemo canOverrideReportStatus canDeleteReports isPending />,
}
