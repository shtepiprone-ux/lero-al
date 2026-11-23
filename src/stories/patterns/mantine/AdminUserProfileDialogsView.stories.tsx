import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import {
  AdminUserProfileDialogsView,
  type AdminUserProfileDialog,
} from '@/components/admin/AdminUserProfileDialogsView'

// Task 893 (R6) — presentational View of the confirmation dialogs of `/admin/users/[id]` (Container/Presentational
// split of `AdminUserProfile`). GR-3a: CREATE — no canonical Story imported this View. Overlay-only Story (GR-3d:
// no gutter wrapper): each export opens one controlled `MantineModal` on mount — centred from 640px, bottom sheet
// below. The reason text is local state; the user name and email are labelled fixture data. Viewport and locale
// come from the Storybook toolbar.
const meta: Meta<typeof AdminUserProfileDialogsView> = {
  title: 'Patterns/Mantine/AdminUserProfileDialogsView',
  component: AdminUserProfileDialogsView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Seven confirmations in the canonical `MantineModal`: unsaved changes, cancel, deactivate / reactivate (reason required), hard delete, and clear history (one row / whole list). The container owns which one is open and every outcome.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminUserProfileDialogsView>

function DialogDemo({ dialog, loading = false }: { dialog: AdminUserProfileDialog; loading?: boolean }) {
  const [reason, setReason] = useState('')
  return (
    <AdminUserProfileDialogsView
      dialog={dialog}
      userName="Arben Krasniqi"
      email="arben@example.com"
      reason={reason}
      onReasonChange={setReason}
      loading={loading}
      onConfirm={() => {}}
      onClose={() => {}}
    />
  )
}

export const Unsaved: Story = { render: () => <DialogDemo dialog="unsaved" /> }

// The cancel confirmation keeps its open state, as `AdminUserProfile` does through `onClose` (Task 957 Revision 2, R2-5: the registry row declares the dismissals Mantine supports, and the
// census measures them): Escape and the close control close it and the rendered state stays closed. It opens on render.
function CancelDemo() {
  const [open, setOpen] = useState(true)
  const [reason, setReason] = useState('')
  return (
    <AdminUserProfileDialogsView
      dialog={open ? 'cancel' : null}
      userName="Arben Krasniqi"
      email="arben@example.com"
      reason={reason}
      onReasonChange={setReason}
      loading={false}
      onConfirm={() => setOpen(false)}
      onClose={() => setOpen(false)}
    />
  )
}
export const Cancel: Story = { render: () => <CancelDemo /> }

export const Deactivate: Story = { render: () => <DialogDemo dialog="deactivate" /> }

export const DeactivateLoading: Story = { render: () => <DialogDemo dialog="deactivate" loading /> }

export const Reactivate: Story = { render: () => <DialogDemo dialog="reactivate" /> }

export const Delete: Story = { render: () => <DialogDemo dialog="delete" /> }

export const DeleteLoading: Story = { render: () => <DialogDemo dialog="delete" loading /> }

export const ClearRow: Story = { render: () => <DialogDemo dialog="clear-row" /> }

export const ClearEntity: Story = { render: () => <DialogDemo dialog="clear-entity" /> }
