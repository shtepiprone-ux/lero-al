import type { Meta, StoryObj } from '@storybook/react'
import { AdminPageShell } from './AdminPageShell'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof AdminPageShell> = {
  title: 'Admin/AdminPageShell',
  component: AdminPageShell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical admin page wrapper. Provides responsive header (title + countBadge + actions), optional filter bar slot, and content area. See docs/admin-ux-rules.md (Epic HH Phase 2, Task 306).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AdminPageShell>

const SAMPLE_CONTENT = (
  <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
    Table / list content goes here
  </div>
)

const SAMPLE_FILTERS = (
  <div className="flex gap-2 flex-wrap">
    <Button size="sm" variant="outline">All</Button>
    <Button size="sm" variant="ghost">Active</Button>
    <Button size="sm" variant="ghost">Pending</Button>
  </div>
)

export const WithTitleAndCount: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminPageShell title="Listings" countBadge={{ value: 127 }}>
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}

export const WithActions: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminPageShell
      title="Users"
      subtitle="Manage platform accounts"
      countBadge={{ value: 843 }}
      actions={<Button size="sm">+ New User</Button>}
    >
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}

export const WithFilterBar: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminPageShell
      title="Listings"
      countBadge={{ value: 127 }}
      filterBar={SAMPLE_FILTERS}
    >
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}

export const Mobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminPageShell
      title="Listings"
      countBadge={{ value: 127 }}
      actions={<Button size="sm">+ New</Button>}
      filterBar={SAMPLE_FILTERS}
    >
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}

export const WithLongUkrainianTitle: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <AdminPageShell
      title="Оголошення"
      countBadge={{ value: 127 }}
      actions={<Button size="sm">+ Нове оголошення</Button>}
      filterBar={SAMPLE_FILTERS}
    >
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}

export const NoHeader: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminPageShell filterBar={SAMPLE_FILTERS}>
      {SAMPLE_CONTENT}
    </AdminPageShell>
  ),
}
