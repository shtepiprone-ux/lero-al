import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StatusChangeSelect, type StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 894 — canonical status select (`admin.common.status_control`), the `MantineSelect` successor of the legacy
// `StatusChangeControl` `select` variant. GR-3a: CREATE — the only Story that rendered a status control was the
// legacy `Admin/StatusChangeControl`, which stays for `ListingFormShellView` until Task 796. GR-3d: the control has
// no gutter of its own on any side, so each export is wrapped in `StoryPageGutter`. The status lives in local
// state and `onSubmit` resolves after a tick (fixture behaviour). Viewport and locale come from the toolbar.
const meta: Meta<typeof StatusChangeSelect> = {
  title: 'Patterns/Mantine/StatusChangeSelect',
  component: StatusChangeSelect,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Status `MantineSelect` (bottom sheet below 640px). Picking a different status submits it; success and failure show the shared toasts. With `enableNote` an optional note and a submit button follow.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusChangeSelect>

// Fixture data (labelled).
type FixtureStatus = 'new' | 'in_progress' | 'closed'
const STATUSES: StatusSelectOption<FixtureStatus>[] = [
  { code: 'new', labelKey: 'status_new' },
  { code: 'in_progress', labelKey: 'status_in_progress' },
  { code: 'closed', labelKey: 'status_closed' },
]

function SelectDemo({ enableNote = false, disabled = false }: { enableNote?: boolean; disabled?: boolean }) {
  const t = useTranslations('admin.inquiries')
  const [status, setStatus] = useState<FixtureStatus>('new')
  return (
    <StoryPageGutter>
      <StatusChangeSelect<FixtureStatus>
        currentStatus={status}
        statuses={STATUSES}
        enableNote={enableNote}
        disabled={disabled}
        aria-label={t('change_status')}
        onSubmit={async ({ toStatus }) => {
          await new Promise(resolve => setTimeout(resolve, 200))
          setStatus(toStatus)
        }}
      />
    </StoryPageGutter>
  )
}

export const Default: Story = { render: () => <SelectDemo /> }

export const WithNote: Story = { render: () => <SelectDemo enableNote /> }

export const Disabled: Story = { render: () => <SelectDemo disabled /> }
