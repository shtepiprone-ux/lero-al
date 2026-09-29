import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminCurrenciesView } from '@/components/admin/AdminCurrenciesView'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'
import type { DBCurrency } from '@/types/database'

// Task 877 — presentational View of the `/admin/currency` Currencies tab (Container/Presentational split of
// `AdminCurrenciesManager`). GR-3a: CREATE — the legacy `Admin/AdminCurrenciesManager` Story was deleted.
// Search, list (table from 640px, cards below through the `AdminTable` adapter), delete confirmation and the
// row detail dialog. Callbacks are no-ops or local state; `FIXTURE_CURRENCIES` is labelled fixture data.
// Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminCurrenciesView> = {
  title: 'Patterns/Mantine/AdminCurrenciesView',
  component: AdminCurrenciesView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Currency list on the `AdminTable` adapter with search, the delete confirmation in `MantineModal` and `CurrencyDetailDialogView`. The create/edit dialog is the separate `CurrencyFormDialogView`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminCurrenciesView>

function ViewDemo({
  initialCurrencies = FIXTURE_CURRENCIES,
  initialDetailTarget = null,
  initialDeleteTarget = null,
}: {
  initialCurrencies?: DBCurrency[]
  initialDetailTarget?: DBCurrency | null
  initialDeleteTarget?: DBCurrency | null
}) {
  const [currencies, setCurrencies] = useState(initialCurrencies)
  const [query, setQuery] = useState('')
  const [detailTarget, setDetailTarget] = useState<DBCurrency | null>(initialDetailTarget)
  const [deleteTarget, setDeleteTarget] = useState<DBCurrency | null>(initialDeleteTarget)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? currencies.filter(c => c.code.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q) || c.name_sq.toLowerCase().includes(q))
    : currencies
  return (
    <StoryPageGutter>
    <AdminCurrenciesView
      currencies={filtered}
      query={query}
      onQueryChange={setQuery}
      isPending={false}
      onNew={() => {}}
      detailTarget={detailTarget}
      onOpenDetail={setDetailTarget}
      onCloseDetail={() => setDetailTarget(null)}
      onDetailEdit={() => setDetailTarget(null)}
      onDetailToggleActive={() => {
        setCurrencies(prev => prev.map(x => (x.id === detailTarget?.id ? { ...x, is_active: !x.is_active } : x)))
        setDetailTarget(null)
      }}
      onDetailSetDefault={() => {
        setCurrencies(prev => prev.map(x => ({ ...x, is_default: x.id === detailTarget?.id })))
        setDetailTarget(null)
      }}
      onDetailDelete={() => {
        setDeleteTarget(detailTarget)
        setDetailTarget(null)
      }}
      deleteTarget={deleteTarget}
      onCancelDelete={() => setDeleteTarget(null)}
      onConfirmDelete={() => {
        setCurrencies(prev => prev.filter(x => x.id !== deleteTarget?.id))
        setDeleteTarget(null)
      }}
    />
    </StoryPageGutter>
  )
}

export const Default: Story = { render: () => <ViewDemo /> }

export const Empty: Story = { render: () => <ViewDemo initialCurrencies={[]} /> }

export const DeleteConfirm: Story = {
  render: () => <ViewDemo initialDeleteTarget={FIXTURE_CURRENCIES[1]} />,
}

export const Detail: Story = {
  render: () => <ViewDemo initialDetailTarget={FIXTURE_CURRENCIES[1]} />,
}
