import type { Meta, StoryObj } from '@storybook/react'
import { AdminCardList } from './AdminCardList'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

const meta: Meta = {
  title: 'Admin/AdminCardList',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical card-row list for workflow-heavy admin surfaces. Used directly for non-tabular data (e.g. /admin/support, /admin/inquiries/*) and internally by AdminTable for card mode below lg:. Supports both structured card objects (title/subtitle/meta/trailing) and legacy ReactNode. See docs/admin-ux-rules.md §2 + §14 (Epic HH Phase 2, Task 306-Fix).',
      },
    },
  },
}

export default meta
type Story = StoryObj

type TicketRow = { id: string; subject: string; state: string; type: string; updated: string }

const TICKETS: TicketRow[] = [
  { id: '1', subject: 'Unable to edit my listing after publishing', state: 'open', type: 'Support', updated: '2026-05-31' },
  { id: '2', subject: 'User reported for fake property photos', state: 'in_progress', type: 'Complaint', updated: '2026-05-30' },
  { id: '3', subject: 'Payment dispute for rental deposit', state: 'resolved', type: 'Support', updated: '2026-05-29' },
]

export const StructuredCard_Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        subtitle: (
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={row.state === 'open' ? 'warning' : row.state === 'in_progress' ? 'info' : 'success'} className="text-xs">
              {row.state}
            </Badge>
            <span className="text-xs text-muted-foreground">{row.type}</span>
          </div>
        ),
        meta: <span className="text-xs text-muted-foreground mt-0.5">{row.updated}</span>,
        trailing: <ChevronRight className="h-4 w-4 text-muted-foreground/40" />,
      })}
      onRowClick={row => alert(`Opened: ${row.subject}`)}
      emptyState="No tickets found."
      ariaLabel="Support tickets"
    />
  ),
}

export const StructuredCard_Mobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        subtitle: (
          <Badge variant={row.state === 'open' ? 'warning' : 'neutral'} className="text-xs mt-1">
            {row.state}
          </Badge>
        ),
        meta: <span className="text-xs text-muted-foreground">{row.type} · {row.updated}</span>,
        trailing: <ChevronRight className="h-4 w-4 text-muted-foreground/40" />,
      })}
      onRowClick={() => undefined}
      emptyState="No tickets."
    />
  ),
}

export const Compact: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        trailing: <Badge variant="neutral" className="text-xs">{row.state}</Badge>,
      })}
      emptyState="No tickets."
      compact
    />
  ),
}

export const LegacyReactNode: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => (
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">{row.subject}</p>
          <Badge variant="neutral" className="text-xs shrink-0">{row.state}</Badge>
        </div>
      )}
      emptyState="No tickets found."
    />
  ),
}

export const EmptyState: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList
      rows={[]}
      rowKey={r => (r as TicketRow).id}
      card={() => null}
      emptyState="No support tickets found."
    />
  ),
}

export const LoadingState: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList
      rows={[]}
      rowKey={() => ''}
      card={() => null}
      emptyState="No tickets."
      loading
    />
  ),
}

type UkTicket = { id: string; subject: string }
const UK_TICKETS: UkTicket[] = [
  { id: '1', subject: 'Не можу відредагувати оголошення після публікації — довга назва тікету для тесту' },
  { id: '2', subject: 'Скарга на користувача за підроблені фотографії нерухомості' },
]

export const UkrainianLongStrings: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminCardList
      rows={UK_TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        trailing: <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />,
      })}
      emptyState="Немає тікетів."
      ariaLabel="Список тікетів"
    />
  ),
}
