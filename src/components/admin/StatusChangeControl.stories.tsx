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
          'Canonical tiered status-change primitive. variant="select" for low-stakes (Inquiries). variant="workflow" for moderation (Support tickets, Listings). Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/admin-ux-rules.md §13 (Epic HH Phase 2, Task 307).',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ── Inquiry status fixtures ───────────────────────────────────────────────────
type IStatus = 'new' | 'in_progress' | 'closed'

const INQUIRY_STATUSES: StatusOption<IStatus>[] = [
  { code: 'new',         label: 'New',        labelKey: 'status_new',         badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', label: 'In progress', labelKey: 'status_in_progress', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'closed',      label: 'Closed',      labelKey: 'status_closed',      badgeVariant: 'neutral', icon: <CheckCircle2 className="h-3 w-3" /> },
]

// ── Ticket status fixtures ────────────────────────────────────────────────────
type TStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const TICKET_STATUSES: StatusOption<TStatus>[] = [
  { code: 'open',        label: 'Open',        labelKey: 'status_change_label', badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', label: 'In progress', labelKey: 'status_change_label', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'resolved',    label: 'Resolved',    labelKey: 'status_change_label', badgeVariant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  { code: 'closed',      label: 'Closed',      labelKey: 'status_change_label', badgeVariant: 'neutral', icon: <XCircle className="h-3 w-3" /> },
]

const TICKET_TRANSITIONS: Transition<TStatus>[] = [
  { from: 'open',        to: 'in_progress', label: 'In progress', labelKey: 'status_change_label' },
  { from: 'open',        to: 'resolved',    label: 'Resolved',    labelKey: 'status_change_label' },
  { from: 'open',        to: 'closed',      label: 'Close',       labelKey: 'status_change_label', destructive: true },
  { from: 'in_progress', to: 'resolved',    label: 'Resolved',    labelKey: 'status_change_label' },
  { from: 'in_progress', to: 'closed',      label: 'Close',       labelKey: 'status_change_label', destructive: true },
  { from: 'resolved',    to: 'open',        label: 'Re-open',     labelKey: 'status_change_label' },
  { from: 'resolved',    to: 'closed',      label: 'Close',       labelKey: 'status_change_label', destructive: true },
  { from: 'closed',      to: 'open',        label: 'Re-open',     labelKey: 'status_change_label' },
]

const HISTORY_EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'new', toStatus: 'in_progress', note: 'Assigned for review', actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'closed', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

// ── Ukrainian locale fixtures ─────────────────────────────────────────────────
const INQUIRY_STATUSES_UK: StatusOption<IStatus>[] = [
  { code: 'new',         label: 'Новий',     labelKey: 'status_new',         badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', label: 'В обробці', labelKey: 'status_in_progress', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'closed',      label: 'Закритий',  labelKey: 'status_closed',      badgeVariant: 'neutral', icon: <CheckCircle2 className="h-3 w-3" /> },
]

const TICKET_STATUSES_UK: StatusOption<TStatus>[] = [
  { code: 'open',        label: 'Відкритий',  labelKey: 'status_change_label', badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', label: 'В роботі',   labelKey: 'status_change_label', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'resolved',    label: 'Вирішений',  labelKey: 'status_change_label', badgeVariant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  { code: 'closed',      label: 'Закритий',   labelKey: 'status_change_label', badgeVariant: 'neutral', icon: <XCircle className="h-3 w-3" /> },
]

const TICKET_TRANSITIONS_UK: Transition<TStatus>[] = [
  { from: 'open',        to: 'in_progress', label: 'В роботі',       labelKey: 'status_change_label' },
  { from: 'open',        to: 'resolved',    label: 'Вирішений',      labelKey: 'status_change_label' },
  { from: 'open',        to: 'closed',      label: 'Закрити',        labelKey: 'status_change_label', destructive: true },
  { from: 'in_progress', to: 'resolved',    label: 'Вирішений',      labelKey: 'status_change_label' },
  { from: 'in_progress', to: 'closed',      label: 'Закрити',        labelKey: 'status_change_label', destructive: true },
  { from: 'resolved',    to: 'open',        label: 'Відкрити знову', labelKey: 'status_change_label' },
  { from: 'resolved',    to: 'closed',      label: 'Закрити',        labelKey: 'status_change_label', destructive: true },
  { from: 'closed',      to: 'open',        label: 'Відкрити знову', labelKey: 'status_change_label' },
]

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Select: Story = {
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

export const SelectWithNote: Story = {
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

export const Workflow: Story = {
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

export const WorkflowRequiredNote: Story = {
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

export const WorkflowWithHistory: Story = {
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

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: Ukrainian workflow + select variants side-by-side. Long Ukrainian labels must not overflow. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <div className="p-3 space-y-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'open' as TStatus}
        statuses={TICKET_STATUSES_UK}
        transitions={TICKET_TRANSITIONS_UK}
        onSubmit={() => {}}
      />
      <StatusChangeControl
        variant="select"
        currentStatus={'new' as IStatus}
        statuses={INQUIRY_STATUSES_UK}
        onSubmit={() => {}}
      />
    </div>
  ),
}
