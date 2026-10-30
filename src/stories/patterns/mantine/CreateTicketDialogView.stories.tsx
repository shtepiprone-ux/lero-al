import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CreateTicketDialogView, type CreateTicketType } from '@/components/admin/CreateTicketDialogView'
import { UserPickerFieldView } from '@/components/admin/UserPickerFieldView'
import type { PickerUser } from '@/components/admin/AdminSupportManager'
import type { ComplaintType } from '@/types/database'
import { FIXTURE_PICKER_USERS } from '@/stories/fixtures/admin.fixtures'

// Task 859 — presentational View of the create-ticket dialog (Container/Presentational split;
// `CreateTicketDialog` is the container). GR-3a: CREATE — no canonical Story imported this View. Overlay-only
// Story (GR-3d: no gutter wrapper): each export opens the controlled `MantineModal` on mount. The user pickers
// are slots; here they are the real `UserPickerFieldView` with fixture users and no search. All form state is
// local; the users are labelled fixture data. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof CreateTicketDialogView> = {
  title: 'Patterns/Mantine/CreateTicketDialogView',
  component: CreateTicketDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Create a support ticket or a user complaint as a structured `MantineModal` (§23.7): fields in dialog sections (type select, user pickers, subject and details with per-field errors) and a `MantineDialogFooter` pair whose Create disables when reporter and reported are the same user.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CreateTicketDialogView>

// Fixture data (labelled).
const [AGENT, BLOCKED] = FIXTURE_PICKER_USERS as PickerUser[]

interface DemoProps {
  ticketType?: CreateTicketType
  requester?: PickerUser | null
  reported?: PickerUser | null
  complaintType?: ComplaintType | ''
  subject?: string
  reason?: string
  errors?: Record<string, string>
  creating?: boolean
}

function PickerSlot({
  label,
  icon,
  value,
  onChange,
  error,
}: {
  label: string
  icon: 'user' | 'shield'
  value: PickerUser | null
  onChange: (user: PickerUser | null) => void
  error?: string
}) {
  return (
    <UserPickerFieldView
      label={label}
      icon={icon}
      value={value}
      onClear={() => onChange(null)}
      query=""
      onQueryChange={() => {}}
      results={[]}
      open={false}
      isSearching={false}
      onSelect={onChange}
      error={error}
    />
  )
}

function DialogDemo(props: DemoProps) {
  const t = useTranslations('admin.support')
  const [ticketType, setTicketType] = useState<CreateTicketType>(props.ticketType ?? '')
  const [requester, setRequester] = useState<PickerUser | null>(props.requester ?? null)
  const [reported, setReported] = useState<PickerUser | null>(props.reported ?? null)
  const [complaintType, setComplaintType] = useState<ComplaintType | ''>(props.complaintType ?? '')
  const [subject, setSubject] = useState(props.subject ?? '')
  const [reason, setReason] = useState(props.reason ?? '')
  const errors = props.errors ?? {}
  const sameUser = ticketType === 'user_complaint' && requester !== null && reported !== null && requester.id === reported.id
  return (
    <CreateTicketDialogView
      ticketType={ticketType}
      onTicketTypeChange={setTicketType}
      requesterField={
        <PickerSlot
          label={ticketType === 'user_complaint' ? t('reporter_label') : t('requester_label')}
          icon="user"
          value={requester}
          onChange={setRequester}
          error={errors.requester}
        />
      }
      reportedField={
        <PickerSlot label={t('reported_label')} icon="shield" value={reported} onChange={setReported} error={errors.reported} />
      }
      complaintType={complaintType}
      onComplaintTypeChange={setComplaintType}
      subject={subject}
      onSubjectChange={setSubject}
      reason={reason}
      onReasonChange={setReason}
      errors={errors}
      creating={props.creating ?? false}
      sameUser={sameUser}
      onCreate={() => {}}
      onClose={() => {}}
    />
  )
}

export const Empty: Story = { render: () => <DialogDemo /> }

export const Support: Story = {
  render: () => (
    <DialogDemo
      ticketType="support"
      requester={AGENT}
      subject="Nuk mund të redaktoj njoftimin"
      reason="Butoni Ruaj nuk reagon pas ndryshimit të çmimit."
    />
  ),
}

export const Complaint: Story = {
  render: () => (
    <DialogDemo
      ticketType="user_complaint"
      requester={AGENT}
      reported={BLOCKED}
      complaintType="fraud_or_scam"
      subject="Ankesë për çmim të rremë"
      reason="Njoftimi shfaq çmim që nuk përputhet me realitetin."
    />
  ),
}

export const ComplaintSameUser: Story = {
  render: () => (
    <DialogDemo
      ticketType="user_complaint"
      requester={AGENT}
      reported={AGENT}
      complaintType="spam"
      subject="Ankesë"
      reason="Detaje."
    />
  ),
}

function ErrorsDemo() {
  const t = useTranslations('admin.support')
  return (
    <DialogDemo
      ticketType="user_complaint"
      errors={{
        requester: t('reporter_required'),
        reported: t('reported_required'),
        complaintType: t('complaint_type_required'),
        subject: t('subject_required'),
        reason: t('reason_required'),
      }}
    />
  )
}

export const Errors: Story = { render: () => <ErrorsDemo /> }
