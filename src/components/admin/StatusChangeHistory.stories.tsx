import type { Meta, StoryObj } from '@storybook/react'
import { StatusChangeHistory, type HistoryEvent } from './StatusChangeHistory'
import { storyT } from '@/stories/_storyI18n'

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

const STATUS_KEY: Record<string, string> = {
  open: 'state_open', in_progress: 'state_in_progress', resolved: 'state_resolved',
  closed: 'state_closed', new: 'state_new', pending: 'state_pending',
}

const makeFmt = (locale: string) => (s: string) => {
  const key = STATUS_KEY[s]
  return key ? storyT(locale, `storybook.admin_history.${key}`) : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const ah = (k: string, l = 'en') => storyT(l, `storybook.admin_history.${k}`)

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
    return (
      <StatusChangeHistory
        events={[
          { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: ah('note_1', locale), actorName: ah('actor_1', locale), createdAt: '2026-05-31T08:00:00Z' },
          { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: ah('actor_2', locale), createdAt: '2026-06-01T10:00:00Z' },
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
