import type { Meta, StoryObj } from '@storybook/react'
import { StatusChangeControl } from './StatusChangeControl'
import type { StatusOption, Transition } from './StatusChangeControl'
import type { HistoryEvent } from './StatusChangeHistory'
import { Circle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

// ── Story purpose banner (Task 354-Fix pattern) ──────────────────────────────
function StoryPurposeNote() {
  return (
    <div className="border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 bg-muted/10 text-[11px] text-muted-foreground mb-3 space-y-0.5">
      <p className="font-semibold">StatusChangeControl — canonical tiered status primitive</p>
      <p><strong>variant=&quot;select&quot;</strong>: low-stakes status changes (Sales/Support Inquiries). Renders a simple select + optional note. No workflow graph.</p>
      <p><strong>variant=&quot;workflow&quot;</strong>: moderation flows (Support Tickets, Listing status). Renders allowed transition buttons derived from the current status + history log via historyEvents.</p>
      <p><strong>Used in:</strong> /admin/inquiries (sales + support), /admin/support (tickets), /admin/listings (listing status). Defined by Epic HH Phase 2, Task 307.</p>
    </div>
  )
}

const meta: Meta = {
  title: 'Admin/StatusChangeControl',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Canonical tiered status-change primitive (Task 307, Epic HH Phase 2).**\n\n' +
          '`variant="select"` — low-stakes status changes (Sales Inquiries, Support Inquiries). ' +
          'Renders a dropdown select + optional note textarea. No workflow graph. Used when any status transition is valid.\n\n' +
          '`variant="workflow"` — moderation flows (Support Tickets, Listing status). ' +
          'Renders explicit transition buttons derived from the `transitions` prop for the current status. ' +
          'Supports `requireNote`, `enableNote`, and `historyEvents` (change log). ' +
          'Used when only certain transitions are permitted from the current state.\n\n' +
          '**Locale:** `label` is NOT set in story fixtures — the component resolves labels via `t(labelKey)` ' +
          'using the active locale from the Storybook toolbar. Use the locale toolbar to verify all 4 locales.\n\n' +
          '**Product surfaces:** `/admin/inquiries/sales`, `/admin/inquiries/support` (select variant); ' +
          '`/admin/support` tickets, `/admin/listings` status (workflow variant).\n\n' +
          '**Story note:** each story shows a `StoryPurposeNote` banner explaining the variant and where it is used. ' +
          'StatusChangeControl is NOT a defect — it is intentionally a control primitive, not a full page layout.',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ── Inquiry status fixtures — no hardcoded label; component uses t(labelKey) ──
type IStatus = 'new' | 'in_progress' | 'closed'

const INQUIRY_STATUSES: StatusOption<IStatus>[] = [
  { code: 'new',         labelKey: 'status_new',         badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', labelKey: 'status_in_progress', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'closed',      labelKey: 'status_closed',      badgeVariant: 'neutral', icon: <CheckCircle2 className="h-3 w-3" /> },
]

// ── Ticket status fixtures — no hardcoded label; component uses t(labelKey) ───
type TStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const TICKET_STATUSES: StatusOption<TStatus>[] = [
  { code: 'open',        labelKey: 'status_open',        badgeVariant: 'warning', icon: <Circle className="h-3 w-3" /> },
  { code: 'in_progress', labelKey: 'status_in_progress', badgeVariant: 'info',    icon: <AlertCircle className="h-3 w-3" /> },
  { code: 'resolved',    labelKey: 'status_resolved',    badgeVariant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  { code: 'closed',      labelKey: 'status_closed',      badgeVariant: 'neutral', icon: <XCircle className="h-3 w-3" /> },
]

// ── Ticket transition fixtures — no hardcoded label; component uses t(labelKey) ──
const TICKET_TRANSITIONS: Transition<TStatus>[] = [
  { from: 'open',        to: 'in_progress', labelKey: 'status_in_progress' },
  { from: 'open',        to: 'resolved',    labelKey: 'status_resolved' },
  { from: 'open',        to: 'closed',      labelKey: 'action_close', destructive: true },
  { from: 'in_progress', to: 'resolved',    labelKey: 'status_resolved' },
  { from: 'in_progress', to: 'closed',      labelKey: 'action_close', destructive: true },
  { from: 'resolved',    to: 'open',        labelKey: 'action_reopen' },
  { from: 'resolved',    to: 'closed',      labelKey: 'action_close', destructive: true },
  { from: 'closed',      to: 'open',        labelKey: 'action_reopen' },
]

const HISTORY_EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'new', toStatus: 'in_progress', note: null, actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'closed', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Select: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story: '`variant="select"` — low-stakes inquiry status change. Any transition is valid. Labels resolved via t(labelKey) — use locale toolbar to verify sq/en/uk/it.',
      },
    },
  },
  render: () => (
    <div className="max-w-xs p-4">
      <StoryPurposeNote />
      <StatusChangeControl
        variant="select"
        currentStatus={'new' as IStatus}
        statuses={INQUIRY_STATUSES}
        onSubmit={() => {}}
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
        onSubmit={() => {}}
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
        onSubmit={() => {}}
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
    docs: { description: { story: 'uk@320: Ukrainian labels via t(labelKey) — no hardcoded locale fixtures needed. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <div className="p-3 space-y-4">
      <StatusChangeControl
        variant="workflow"
        currentStatus={'open' as TStatus}
        statuses={TICKET_STATUSES}
        transitions={TICKET_TRANSITIONS}
        onSubmit={() => {}}
      />
      <StatusChangeControl
        variant="select"
        currentStatus={'new' as IStatus}
        statuses={INQUIRY_STATUSES}
        onSubmit={() => {}}
      />
    </div>
  ),
}
