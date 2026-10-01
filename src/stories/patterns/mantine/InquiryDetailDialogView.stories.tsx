import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { InquiryDetailDialogView } from '@/components/admin/InquiryDetailDialogView'
import type { InquiryRow, ReplyRow } from '@/components/admin/AdminInquiriesManager'
import type { StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import type { ContactStatus } from '@/types/database'
import { FIXTURE_INQUIRIES, FIXTURE_INQUIRY_REPLIES } from '@/stories/fixtures/admin.fixtures'

// Task 894 — presentational View of the inquiry detail dialog (Container/Presentational split of
// `AdminInquiriesManager`). GR-3a: CREATE — no canonical Story imported this View. Overlay-only Story (GR-3d: no
// gutter wrapper): each export opens the controlled `MantineModal` on mount — centred from 640px, bottom sheet
// below. The reply text is local state; the inquiries and replies are labelled fixture data. Viewport and locale
// come from the Storybook toolbar.
const meta: Meta<typeof InquiryDetailDialogView> = {
  title: 'Patterns/Mantine/InquiryDetailDialogView',
  component: InquiryDetailDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Inquiry detail in the canonical `MantineModal`: sender, topic and mailbox, received date, the status select, the original message with line breaks kept, the reply history (or a notice when it could not be loaded) and the reply composer.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof InquiryDetailDialogView>

// Fixture data (labelled).
const STATUS_OPTIONS: StatusSelectOption<ContactStatus>[] = [
  { code: 'new', labelKey: 'status_new' },
  { code: 'in_progress', labelKey: 'status_in_progress' },
  { code: 'closed', labelKey: 'status_closed' },
]

function DialogDemo({
  inquiry,
  replies = [],
  isPending = false,
  initialBody = '',
}: { inquiry: InquiryRow; replies?: ReplyRow[]; isPending?: boolean; initialBody?: string }) {
  const [body, setBody] = useState(initialBody)
  return (
    <InquiryDetailDialogView
      inquiry={inquiry}
      replies={replies}
      subject={inquiry.custom_subject ?? inquiry.topic}
      statusOptions={STATUS_OPTIONS}
      replyBody={body}
      onReplyBodyChange={setBody}
      isPending={isPending}
      onStatusSubmit={() => {}}
      onSendReply={() => {}}
      onClose={() => {}}
    />
  )
}

export const New: Story = { render: () => <DialogDemo inquiry={FIXTURE_INQUIRIES[0]} /> }

export const WithReplies: Story = {
  render: () => <DialogDemo inquiry={FIXTURE_INQUIRIES[1]} replies={FIXTURE_INQUIRY_REPLIES} />,
}

export const RepliesLoadFailed: Story = {
  render: () => <DialogDemo inquiry={FIXTURE_INQUIRIES[1]} replies={[]} />,
}

export const Sending: Story = {
  render: () => (
    <DialogDemo
      inquiry={FIXTURE_INQUIRIES[1]}
      replies={FIXTURE_INQUIRY_REPLIES}
      isPending
      initialBody="Thank you, the address is correct."
    />
  ),
}
