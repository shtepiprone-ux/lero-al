import type { Meta, StoryObj } from '@storybook/react'
import { AdminTable, type AdminTableColumn } from './AdminTable'
import { Badge } from '@/components/ui/badge'

const meta: Meta = {
  title: 'Admin/AdminTable',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical admin table. At lg:+ renders a controlled-scroll table (sticky first column, sticky header, right-edge fade). Below lg: renders AdminCardList card mode automatically. See docs/admin-ux-rules.md §3 + §14 (Epic HH Phase 2, Task 306-Fix).',
      },
    },
  },
}

export default meta
type Story = StoryObj

type SampleRow = { id: string; name: string; state: 'on' | 'off'; role: string; created: string; email: string; phone: string; location: string }

const ROWS: SampleRow[] = [
  { id: '1', name: 'Arben Krasniqi', state: 'on', role: 'agent', created: '2026-01-15', email: 'arben@example.com', phone: '+355 69 123 4567', location: 'Tirana' },
  { id: '2', name: 'Oksana Petrenko', state: 'off', role: 'user', created: '2026-02-20', email: 'oksana@example.com', phone: '+380 50 987 6543', location: 'Kyiv' },
  { id: '3', name: 'Marco Rossi', state: 'on', role: 'moderator', created: '2026-03-01', email: 'marco@example.com', phone: '+39 02 1234 5678', location: 'Milan' },
]

const COLUMNS: AdminTableColumn<SampleRow>[] = [
  { key: 'name', header: 'Name', cell: r => <span className="font-medium">{r.name}</span> },
  { key: 'state', header: 'State', cell: r => <Badge variant={r.state === 'on' ? 'success' : 'neutral'}>{r.state}</Badge> },
  { key: 'role', header: 'Role', cell: r => r.role, visibility: 'sm' },
  { key: 'email', header: 'Email', cell: r => r.email, visibility: 'md' },
  { key: 'phone', header: 'Phone', cell: r => r.phone, visibility: 'lg' },
  { key: 'location', header: 'Location', cell: r => r.location, visibility: 'lg' },
  { key: 'created', header: 'Created', cell: r => r.created, visibility: 'xl' },
  { key: 'actions', header: '', cell: () => <span className="text-xs text-muted-foreground">…</span>, align: 'right' },
]

export const Desktop1280: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminTable
      rows={ROWS}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records found."
      ariaLabel="Sample table"
    />
  ),
}

export const Mobile320ScrollAffordance: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminTable
      rows={ROWS}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records found."
      ariaLabel="Sample table — scroll right"
    />
  ),
}

export const EmptyState: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminTable
      rows={[]}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No listings match your filters."
    />
  ),
}

export const LoadingState: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminTable
      rows={[]}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records."
      loading
    />
  ),
}

type UkRow = { id: string; name: string; status: string }
const UK_ROWS: UkRow[] = [
  { id: '1', name: 'Оголошення про продаж квартири в центрі міста — довга назва для перевірки', status: 'В обробці' },
  { id: '2', name: 'Оренда офісного приміщення поруч з метро — ще одна довга назва', status: 'Активне' },
]
const UK_COLS: AdminTableColumn<UkRow>[] = [
  { key: 'name', header: 'Назва', cell: r => <span className="font-medium truncate max-w-[180px] block">{r.name}</span> },
  { key: 'status', header: 'Статус', cell: r => <Badge variant="neutral">{r.status}</Badge> },
]

export const UkrainianLongStrings: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminTable
      rows={UK_ROWS}
      columns={UK_COLS}
      rowKey={r => r.id}
      emptyState="Немає записів."
      ariaLabel="Таблиця оголошень"
    />
  ),
}

export const ResponsiveSwitch_Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { story: 'At <lg: (below 1024px), AdminTable renders AdminCardList card mode automatically. Table is hidden.' } },
  },
  render: () => (
    <AdminTable
      rows={ROWS}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records."
      cardRow={r => ({
        title: <span className="font-medium">{r.name}</span>,
        subtitle: <Badge variant={r.state === 'on' ? 'success' : 'neutral'}>{r.state}</Badge>,
        meta: <span className="text-xs text-muted-foreground">{r.role} · {r.email}</span>,
      })}
    />
  ),
}

export const ResponsiveSwitch_Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'At lg:+ (1024px+), AdminTable renders the scroll table. Card list is hidden.' } },
  },
  render: () => (
    <AdminTable
      rows={ROWS}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records."
      cardRow={r => ({
        title: <span className="font-medium">{r.name}</span>,
        subtitle: <Badge variant={r.state === 'on' ? 'success' : 'neutral'}>{r.state}</Badge>,
        meta: <span className="text-xs text-muted-foreground">{r.role} · {r.email}</span>,
      })}
    />
  ),
}

export const ResponsiveSwitch_Tablet1024: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: { description: { story: '1024px is the switch point. This story validates the boundary — at exactly lg: card list gives way to table.' } },
  },
  render: () => (
    <AdminTable
      rows={ROWS}
      columns={COLUMNS}
      rowKey={r => r.id}
      emptyState="No records."
    />
  ),
}
