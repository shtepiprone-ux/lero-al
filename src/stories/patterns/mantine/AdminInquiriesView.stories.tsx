import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminInquiriesView, type InquiryMailboxFilter, type InquiryStatusFilter } from '@/components/admin/AdminInquiriesView'
import type { InquiryRow } from '@/components/admin/AdminInquiriesManager'
import { FIXTURE_INQUIRIES } from '@/stories/fixtures/admin.fixtures'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 894 — presentational View of the `/admin/inquiries/{sales,support}` list (Container/Presentational split of
// `AdminInquiriesManager`). GR-3a: CREATE — no canonical Story imported this surface (the manager is a container
// with live data). Status and mailbox filters on Mantine `SegmentedControl`s in a horizontal `ScrollArea`, rows
// on `Paper` + `UnstyledButton`. The detail dialog is the separate `InquiryDetailDialogView`. GR-3d: the View has
// no gutter of its own (the real page's gutter is the `Box` in the route), so each export is wrapped in
// `StoryPageGutter`. `FIXTURE_INQUIRIES` is labelled fixture data; the filters are local state. Viewport and
// locale come from the Storybook toolbar.
const meta: Meta<typeof AdminInquiriesView> = {
  title: 'Patterns/Mantine/AdminInquiriesView',
  component: AdminInquiriesView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Inquiry list: status `SegmentedControl` (All / New / In progress / Closed), an optional mailbox `SegmentedControl` when the route does not scope the mailbox, and full-width rows with status badge, subject, sender, date and reply count. Row click selects an inquiry; the container opens the detail dialog.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminInquiriesView>

// Fixture subject of a row: the custom subject for `other`, the topic code otherwise (the container resolves the
// translated topic label in production).
const subjectOf = (inq: InquiryRow) => inq.custom_subject ?? inq.topic

function ViewDemo({
  inquiries = FIXTURE_INQUIRIES,
  showMailboxFilter = false,
}: { inquiries?: InquiryRow[]; showMailboxFilter?: boolean }) {
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>('all')
  const [mailboxFilter, setMailboxFilter] = useState<InquiryMailboxFilter>('all')
  const shown = inquiries.filter(i => statusFilter === 'all' || i.status === statusFilter)
  return (
    <StoryPageGutter>
      <AdminInquiriesView
        inquiries={shown}
        statusFilter={statusFilter}
        mailboxFilter={mailboxFilter}
        showMailboxFilter={showMailboxFilter}
        onStatusFilterChange={setStatusFilter}
        onMailboxFilterChange={setMailboxFilter}
        onSelect={() => {}}
        displaySubject={subjectOf}
      />
    </StoryPageGutter>
  )
}

export const Default: Story = { render: () => <ViewDemo /> }

export const Empty: Story = { render: () => <ViewDemo inquiries={[]} /> }

export const Unscoped: Story = { render: () => <ViewDemo showMailboxFilter /> }

export const LongSubject: Story = {
  render: () => (
    <ViewDemo
      inquiries={[
        {
          ...FIXTURE_INQUIRIES[1],
          custom_subject:
            'Question about the invoice for the October promotion package of three apartments in the centre of Tiranë and the villa in Durrës',
          name: 'Agim Krasniqi-Berisha Hoxha',
          email: 'agim.krasniqi-berisha.hoxha.with.a.very.long.address@example-company.al',
        },
        ...FIXTURE_INQUIRIES,
      ]}
    />
  ),
}
