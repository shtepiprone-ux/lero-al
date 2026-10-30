import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { TicketDetailDialogView } from '@/components/admin/TicketDetailDialogView'
import type { SupportTicketRow, SupportTicketEventRow } from '@/components/admin/AdminSupportManager'
import type { TicketStatus } from '@/types/database'
import { FIXTURE_TICKETS, FIXTURE_SUPPORT_TIMELINE_EVENTS } from '@/stories/fixtures/admin.fixtures'

// Task 859 — presentational View of the support ticket detail dialog (Container/Presentational split;
// `TicketDetailDialog` is the container). GR-3a: CREATE — no canonical Story imported this View. Overlay-only
// Story (GR-3d: no gutter wrapper): each export opens the controlled structured `MantineModal` on mount — centred from
// 640px, bottom sheet below. The status, note and updating flag are local state; the tickets and events are
// labelled fixture data. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof TicketDetailDialogView> = {
  title: 'Patterns/Mantine/TicketDetailDialogView',
  component: TicketDetailDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Support ticket detail as a structured `MantineModal` (§23.7): facts (`MantineDetailList`), reason, status choice (`Radio.Card`s + note), the event timeline with localized status labels, profile links (`MantineNavRowList`) and the Cancel / Update status footer pair.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TicketDetailDialogView>

// Fixture data (labelled): tkt-001 is a support ticket, tkt-002 a complaint with a timeline.
const SUPPORT_TICKET: SupportTicketRow = { ...FIXTURE_TICKETS[0], reason: 'Butoni Ruaj nuk reagon pas ndryshimit të çmimit.' }
const COMPLAINT_TICKET: SupportTicketRow = { ...FIXTURE_TICKETS[1], reason: 'Fotot nuk përputhen me pronën reale.' }

function DialogDemo({
  ticket,
  events = [],
  updating = false,
}: {
  ticket: SupportTicketRow
  events?: SupportTicketEventRow[]
  updating?: boolean
}) {
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status)
  const [note, setNote] = useState('')
  return (
    <TicketDetailDialogView
      ticket={ticket}
      events={events}
      newStatus={newStatus}
      onNewStatusChange={setNewStatus}
      note={note}
      onNoteChange={setNote}
      updating={updating}
      onUpdate={() => {}}
      onClose={() => {}}
    />
  )
}

export const Support: Story = { render: () => <DialogDemo ticket={SUPPORT_TICKET} /> }

export const Complaint: Story = { render: () => <DialogDemo ticket={COMPLAINT_TICKET} /> }

export const WithTimeline: Story = {
  render: () => <DialogDemo ticket={COMPLAINT_TICKET} events={FIXTURE_SUPPORT_TIMELINE_EVENTS} />,
}

export const Updating: Story = {
  render: () => <DialogDemo ticket={COMPLAINT_TICKET} events={FIXTURE_SUPPORT_TIMELINE_EVENTS} updating />,
}
