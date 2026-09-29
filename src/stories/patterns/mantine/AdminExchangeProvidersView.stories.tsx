import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminExchangeProvidersView } from '@/components/admin/AdminExchangeProvidersView'
import { FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'
import type { DBExchangeProvider } from '@/types/database'

// Task 874 — presentational View of the `/admin/currency` Providers tab (Container/Presentational
// split of `AdminExchangeProvidersManager`). No canonical Story imported this View before (GR-3a: CREATE);
// the former legacy page for the manager is retired by this task. Table from `sm`, cards
// below, delete confirmation in `MantineModal` (bottom sheet <640px). Callbacks are no-ops or local state;
// `FIXTURE_PROVIDERS` is labelled fixture data. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminExchangeProvidersView> = {
  title: 'Patterns/Mantine/AdminExchangeProvidersView',
  component: AdminExchangeProvidersView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Exchange-provider list on `MantineDataTableToCards` (table from `sm`, cards below) with the delete confirmation in `MantineModal`. The create/edit dialog is the separate `ProviderFormDialogView`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminExchangeProvidersView>

function ViewDemo({
  initialProviders = FIXTURE_PROVIDERS,
  initialDeleteTarget = null,
  isPending = false,
}: {
  initialProviders?: DBExchangeProvider[]
  initialDeleteTarget?: DBExchangeProvider | null
  isPending?: boolean
}) {
  const [providers, setProviders] = useState(initialProviders)
  const [deleteTarget, setDeleteTarget] = useState<DBExchangeProvider | null>(initialDeleteTarget)
  return (
    <AdminExchangeProvidersView
      providers={providers}
      isPending={isPending}
      deleteTarget={deleteTarget}
      onNew={() => {}}
      onEdit={() => {}}
      onToggle={p => setProviders(prev => prev.map(x => (x.id === p.id ? { ...x, is_enabled: !x.is_enabled } : x)))}
      onRequestDelete={setDeleteTarget}
      onCancelDelete={() => setDeleteTarget(null)}
      onConfirmDelete={() => {
        setProviders(prev => prev.filter(x => x.id !== deleteTarget?.id))
        setDeleteTarget(null)
      }}
    />
  )
}

export const Default: Story = { render: () => <ViewDemo /> }

export const Empty: Story = { render: () => <ViewDemo initialProviders={[]} /> }

export const Pending: Story = { render: () => <ViewDemo isPending /> }

export const DeleteConfirm: Story = {
  render: () => <ViewDemo initialDeleteTarget={FIXTURE_PROVIDERS[0]} />,
}
