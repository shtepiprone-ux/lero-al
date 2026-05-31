import type { Meta, StoryObj } from '@storybook/react'
import { StatusChangeControl } from './StatusChangeControl'
import type { StatusOption, Transition } from './StatusChangeControl'
import type { HistoryEvent } from './StatusChangeHistory'
import { Circle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

const meta: Meta = {
  title: 'Admin/StatusChangeControl',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical tiered status-change primitive. variant="select" for low-stakes (Inquiries). variant="workflow" for moderation (Support tickets, Listings). See docs/admin-ux-rules.md §13 (Epic HH Phase 2, Task 307).',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ── Inquiry status fixture (select variant) ──────────────────────────────────

type IStatus = 'new' | 'in_progress' | 'closed'

const INQUIRY_STATUSES: StatusOption<IStatus>[] = [
  { code: 'new', labelKey: 'status_new', badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', labelKey: 'status_in_progress', badgeVariant: 'info', icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'closed', labelKey: 'status_closed', badgeVariant: 'neutral', icon: <CheckCircle2 className="h-3 w-3" /> },
]

export const Select_BasicInquiry: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <StatusChangeControl
        variant="select"
        currentStatus={'new' as IStatus}
        statuses={INQUIRY_STATUSES}
        onSubmit={({ toStatus }) => { alert(`Changed to: ${toStatus}`) }}
      />
    </div>
  ),
}

export const Select_WithNote: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <StatusChangeControl
        variant="select"
        currentStatus={'in_progress' as IStatus}
        statuses={INQUIRY_STATUSES}
        enableNote
        onSubmit={({ toStatus, note }) => { alert(`Changed to: ${toStatus}, note: ${note}`) }}
      />
    </div>
  ),
}

const HISTORY_EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'new', toStatus: 'in_progress', note: 'Assigned for review', actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'closed', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

export const Select_WithHistory: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-sm p-4">
      <StatusChangeControl
        variant="select"
        currentStatus={'closed' as IStatus}
        statuses={INQUIRY_STATUSES}
        historyEvents={HISTORY_EVENTS}
        onSubmit={() => {}}
      />
    </div>
  ),
}

// ── Ticket status fixture (workflow variant) ──────────────────────────────────

type TStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const TICKET_STATUSES: StatusOption<TStatus>[] = [
  { code: 'open', labelKey: 'support_status_open', badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', labelKey: 'support_status_in_progress', badgeVariant: 'info', icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'resolved', labelKey: 'support_status_resolved', badgeVariant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  { code: 'closed', labelKey: 'support_status_closed', badgeVariant: 'neutral', icon: <XCircle className="h-3 w-3" /> },
]

const TICKET_TRANSITIONS: Transition<TStatus>[] = [
  { from: 'open', to: 'in_progress', labelKey: 'support_status_in_progress' },
  { from: 'open', to: 'resolved', labelKey: 'support_status_resolved' },
  { from: 'open', to: 'closed', labelKey: 'support_status_closed', destructive: true },
  { from: 'in_progress', to: 'resolved', labelKey: 'support_status_resolved' },
  { from: 'in_progress', to: 'closed', labelKey: 'support_status_closed', destructive: true },
  { from: 'resolved', to: 'open', labelKey: 'support_status_open' },
  { from: 'resolved', to: 'closed', labelKey: 'support_status_closed', destructive: true },
  { from: 'closed', to: 'open', labelKey: 'support_status_open' },
]

export const Workflow_TicketStatuses: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-sm p-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'open' as TStatus}
        statuses={TICKET_STATUSES}
        transitions={TICKET_TRANSITIONS}
        onSubmit={({ toStatus, note }) => { alert(`Changed to: ${toStatus}, note: ${note}`) }}
      />
    </div>
  ),
}

export const Workflow_WithRequiredNote: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-sm p-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'in_progress' as TStatus}
        statuses={TICKET_STATUSES}
        transitions={TICKET_TRANSITIONS}
        requireNote
        onSubmit={() => {}}
      />
    </div>
  ),
}

export const Workflow_WithHistory: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-sm p-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'resolved' as TStatus}
        statuses={TICKET_STATUSES}
        transitions={TICKET_TRANSITIONS}
        historyEvents={HISTORY_EVENTS}
        onSubmit={() => {}}
      />
    </div>
  ),
}

export const Workflow_Mobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="p-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'open' as TStatus}
        statuses={TICKET_STATUSES}
        transitions={TICKET_TRANSITIONS}
        onSubmit={() => {}}
      />
    </div>
  ),
}

export const Select_UkrainianLocale: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="p-4">
      <p className="text-xs text-muted-foreground mb-2">uk locale — Combobox should render Ukrainian labels</p>
      <StatusChangeControl
        variant="select"
        currentStatus={'new' as IStatus}
        statuses={INQUIRY_STATUSES}
        onSubmit={() => {}}
      />
    </div>
  ),
}
