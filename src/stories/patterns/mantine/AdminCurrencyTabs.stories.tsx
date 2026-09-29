import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { AdminCurrencyTabs } from '@/components/admin/AdminCurrencyTabs'
import { AdminCurrenciesView } from '@/components/admin/AdminCurrenciesView'
import { AdminExchangeProvidersView } from '@/components/admin/AdminExchangeProvidersView'
import { FIXTURE_CURRENCIES, FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'
import type { DBCurrency } from '@/types/database'

// Task 877 — presentational tab frame of `/admin/currency` (`AdminCurrencyTabs`, two slots). GR-3a: CREATE —
// the component had no Story (it was exempt from coverage). The slots hold the REAL Views the page's
// containers render (`AdminCurrenciesView`, 874's `AdminExchangeProvidersView`) fed by labelled fixture data.
// Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminCurrencyTabs> = {
  title: 'Patterns/Mantine/AdminCurrencyTabs',
  component: AdminCurrencyTabs,
  decorators: [(StoryFn) => <StoryPageGutter><StoryFn /></StoryPageGutter>],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Mantine `Tabs` (TailAdmin §6c through the theme) around two slots: `currencies` and `providers`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminCurrencyTabs>

function CurrenciesSlot() {
  const [detailTarget, setDetailTarget] = useState<DBCurrency | null>(null)
  const [query, setQuery] = useState('')
  return (
    <AdminCurrenciesView
      currencies={FIXTURE_CURRENCIES.filter(c => c.code.toLowerCase().includes(query.trim().toLowerCase()))}
      query={query}
      onQueryChange={setQuery}
      isPending={false}
      onNew={() => {}}
      detailTarget={detailTarget}
      onOpenDetail={setDetailTarget}
      onCloseDetail={() => setDetailTarget(null)}
      onDetailEdit={() => setDetailTarget(null)}
      onDetailToggleActive={() => setDetailTarget(null)}
      onDetailSetDefault={() => setDetailTarget(null)}
      onDetailDelete={() => setDetailTarget(null)}
      deleteTarget={null}
      onCancelDelete={() => {}}
      onConfirmDelete={() => {}}
    />
  )
}

function ProvidersSlot() {
  return (
    <AdminExchangeProvidersView
      providers={FIXTURE_PROVIDERS}
      isPending={false}
      deleteTarget={null}
      onNew={() => {}}
      onEdit={() => {}}
      onToggle={() => {}}
      onRequestDelete={() => {}}
      onCancelDelete={() => {}}
      onConfirmDelete={() => {}}
    />
  )
}

export const Default: Story = {
  render: () => <AdminCurrencyTabs currencies={<CurrenciesSlot />} providers={<ProvidersSlot />} />,
}
