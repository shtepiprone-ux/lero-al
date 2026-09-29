import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ProviderFormDialogView, type ProviderFormValues } from '@/components/admin/ProviderFormDialogView'
import { FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'

// Task 874 — presentational View of the exchange-provider create/edit dialog (Container/Presentational
// split of `ProviderFormDialog`). No canonical Story imported this View before (GR-3a: CREATE).
// The dialog opens on mount: centred `MantineModal` from 640px, bottom sheet below. Values come from
// labelled fixture data (`FIXTURE_PROVIDERS`); callbacks are local state. Viewport and locale come from
// the Storybook toolbar.
const meta: Meta<typeof ProviderFormDialogView> = {
  title: 'Patterns/Mantine/ProviderFormDialogView',
  component: ProviderFormDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Provider create/edit form in `MantineModal`: `TextInput` fields, native `PasswordInput` with a labelled reveal toggle, `SegmentedControl` mode. Fully controlled — the container owns state and the server actions.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProviderFormDialogView>

const EMPTY_VALUES: ProviderFormValues = {
  name: '',
  endpoint: '',
  apiKey: '',
  interval: 60,
  priority: 10,
  mode: 'auto',
  notes: '',
}

const EDIT_PROVIDER = FIXTURE_PROVIDERS[1]
const EDIT_VALUES: ProviderFormValues = {
  name: EDIT_PROVIDER.name,
  endpoint: EDIT_PROVIDER.endpoint_url,
  apiKey: EDIT_PROVIDER.api_key ?? '',
  interval: EDIT_PROVIDER.refresh_interval_min,
  priority: EDIT_PROVIDER.priority,
  mode: EDIT_PROVIDER.mode,
  notes: EDIT_PROVIDER.notes ?? '',
}

function FormDemo({
  isEdit = false,
  initialValues = EMPTY_VALUES,
  initialApiKeyVisible = false,
  submitting = false,
}: {
  isEdit?: boolean
  initialValues?: ProviderFormValues
  initialApiKeyVisible?: boolean
  submitting?: boolean
}) {
  const [values, setValues] = useState(initialValues)
  const [apiKeyVisible, setApiKeyVisible] = useState(initialApiKeyVisible)
  return (
    <ProviderFormDialogView
      opened
      isEdit={isEdit}
      values={values}
      onFieldChange={(field, value) => setValues(prev => ({ ...prev, [field]: value }))}
      apiKeyVisible={apiKeyVisible}
      onApiKeyVisibilityChange={setApiKeyVisible}
      submitting={submitting}
      onSubmit={() => {}}
      onClose={() => {}}
    />
  )
}

export const New: Story = { render: () => <FormDemo /> }

export const Edit: Story = { render: () => <FormDemo isEdit initialValues={EDIT_VALUES} /> }

export const ApiKeyRevealed: Story = {
  render: () => <FormDemo isEdit initialValues={EDIT_VALUES} initialApiKeyVisible />,
}

export const Submitting: Story = {
  render: () => <FormDemo isEdit initialValues={EDIT_VALUES} submitting />,
}
