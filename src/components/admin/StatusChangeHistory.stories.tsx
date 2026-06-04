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
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusChangeHistory>

const EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: null, actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed', new: 'New', pending: 'Pending' },
  sq: { open: 'Hapur', in_progress: 'Në procesim', resolved: 'Zgjidhur', closed: 'E mbyllur', new: 'E re', pending: 'Në pritje' },
  uk: { open: 'Відкрито', in_progress: 'В обробці', resolved: 'Вирішено', closed: 'Закрито', new: 'Новий', pending: 'Очікує' },
  it: { open: 'Aperto', in_progress: 'In lavorazione', resolved: 'Risolto', closed: 'Chiusa', new: 'Nuova', pending: 'In attesa' },
}

// ── Locale Stress content — long actor names and notes per locale ─────────────
const STRESS_CONTENT: Record<string, { actorName1: string; actorName2: string; note1: string }> = {
  en: { actorName1: 'Administrator', actorName2: 'Moderator', note1: 'Under review by the administration team — detailed note for stress test' },
  sq: { actorName1: 'Administratori', actorName2: 'Moderatori', note1: 'Nën shqyrtim nga ekipi i administrimit — shënim i detajuar për testin e stresit' },
  uk: { actorName1: 'Адміністратор', actorName2: 'Модератор', note1: 'Перевіряється командою адміністраторів — детальна примітка для стрес-тесту' },
  it: { actorName1: 'Amministratore', actorName2: 'Moderatore', note1: "Sotto esame del team di amministrazione — nota dettagliata per il test di stress" },
}

const makeFmt = (locale: string) => {
  const map = STATUS_LABELS[locale] ?? STATUS_LABELS.en
  return (s: string) => map[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export const Empty: Story = {
  render: () => <StatusChangeHistory events={[]} />,
}

export const Single: Story = {
  parameters: {
    docs: { description: { story: 'One event. labelFormatter resolves status labels per active locale toolbar. Use locale toolbar to verify sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <StatusChangeHistory events={[EVENTS[0]]} labelFormatter={makeFmt(locale)} />
  },
}

export const Multiple: Story = {
  parameters: {
    docs: { description: { story: 'Two events. All status labels localized via labelFormatter per active locale toolbar.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <StatusChangeHistory
        events={[
          { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: null, actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
          { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
        ]}
        labelFormatter={makeFmt(locale)}
      />
    )
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: long actor names, notes, and status labels follow the toolbar locale. Use locale toolbar for sq/en/uk/it; viewport toolbar for widths.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const sc = STRESS_CONTENT[locale] ?? STRESS_CONTENT.en
    return (
      <StatusChangeHistory
        events={[
          { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: sc.note1, actorName: sc.actorName1, createdAt: '2026-05-31T08:00:00Z' },
          { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: sc.actorName2, createdAt: '2026-06-01T10:00:00Z' },
        ]}
        labelFormatter={makeFmt(locale)}
      />
    )
  },
}

export const RawKeyStress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'No labelFormatter supplied. Component must humanize snake_case keys to Title Case — ' +
          'never expose raw "open", "in_progress", "resolved" as user-visible text.',
      },
    },
  },
  render: () => <StatusChangeHistory events={EVENTS} />,
}
