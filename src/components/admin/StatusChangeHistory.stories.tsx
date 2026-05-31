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
          'Read-only timeline of status-change events. Used inside StatusChangeControl variant="workflow". See docs/admin-ux-rules.md §13 (Epic HH Phase 2, Task 307).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusChangeHistory>

const EVENTS: HistoryEvent[] = [
  { id: '1', fromStatus: 'open', toStatus: 'in_progress', note: 'Under investigation', actorName: 'Admin', createdAt: '2026-05-30T10:00:00Z' },
  { id: '2', fromStatus: 'in_progress', toStatus: 'resolved', note: null, actorName: 'Moderator', createdAt: '2026-05-31T09:00:00Z' },
]

export const Empty: Story = {
  render: () => <StatusChangeHistory events={[]} />,
}

export const Single: Story = {
  render: () => <StatusChangeHistory events={[EVENTS[0]]} />,
}

export const Multiple: Story = {
  render: () => <StatusChangeHistory events={EVENTS} />,
}

export const WithUkrainianActor: Story = {
  render: () => (
    <StatusChangeHistory
      events={[
        { id: '1', fromStatus: 'Відкрито', toStatus: 'В обробці', note: 'Перевіряється', actorName: 'Адміністратор', createdAt: '2026-05-31T08:00:00Z' },
      ]}
    />
  ),
}
