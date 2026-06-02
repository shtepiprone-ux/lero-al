import type { Meta, StoryObj } from '@storybook/react'
import { StatusChangeHistory, type HistoryEvent } from './StatusChangeHistory'

const meta: Meta<typeof StatusChangeHistory> = {
  title: 'Admin/StatusChangeHistory',
  component: StatusChangeHistory,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Read-only timeline of status-change events. Used inside StatusChangeControl variant="workflow". ' +
          'Normal stories supply a `labelFormatter` so both sides of every transition are localized human-readable labels — never raw snake_case enums. ' +
          'Default component fallback: snake_case → Title Case (safe, never leaks raw keys). ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. ' +
          'See docs/admin-ux-rules.md §13 (Epic HH Phase 2, Task 307).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusChangeHistory>

// ── Canonical event data ───────────────────────────────────────────────────────
const EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: null, actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

// ── Per-locale status label maps ──────────────────────────────────────────────
const STATUS_EN: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed', new: 'New', pending: 'Pending',
}
const STATUS_UK: Record<string, string> = {
  open: 'Відкрито', in_progress: 'В обробці', resolved: 'Вирішено', closed: 'Закрито', new: 'Новий', pending: 'Очікує',
}
const fmt = (map: Record<string, string>) => (s: string) =>
  map[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Empty: Story = {
  render: () => <StatusChangeHistory events={[]} />,
}

export const Single: Story = {
  parameters: { globals: { locale: 'en' } },
  render: () => (
    <StatusChangeHistory events={[EVENTS[0]]} labelFormatter={fmt(STATUS_EN)} />
  ),
}

export const Multiple: Story = {
  parameters: {
    globals: { locale: 'en' },
    docs: { description: { story: 'Two events with a note on the first. All status labels localized via labelFormatter. Use locale toolbar for other locales.' } },
  },
  render: () => (
    <StatusChangeHistory
      events={[
        { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: 'Under investigation', actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
        { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
      ]}
      labelFormatter={fmt(STATUS_EN)}
    />
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long Ukrainian actor name, status labels, and note must wrap without horizontal overflow. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <StatusChangeHistory
      events={[
        { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: 'Перевіряється командою адміністраторів — детальна примітка для стрес-тесту', actorName: 'Адміністратор', createdAt: '2026-05-31T08:00:00Z' },
        { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Модератор', createdAt: '2026-06-01T10:00:00Z' },
      ]}
      labelFormatter={fmt(STATUS_UK)}
    />
  ),
}

export const RawKeyStress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'No labelFormatter supplied. Component must humanize snake_case keys to Title Case — ' +
          'never expose raw "open", "in_progress", "resolved" as user-visible text. ' +
          'Expected output: "Open → In Progress", "In Progress → Resolved".',
      },
    },
  },
  render: () => <StatusChangeHistory events={EVENTS} />,
}
