import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { CurrencyFormDialogView, type CurrencyFormValues } from '@/components/admin/CurrencyFormDialogView'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'

// Task 877 — presentational View of the currency create/edit dialog (Container/Presentational split of
// `CurrencyFormDialog`). GR-3a: CREATE — no canonical Story imported this View. The dialog opens on mount:
// centred `MantineModal` from 640px, bottom sheet below. Values come from labelled fixture data
// (`FIXTURE_CURRENCIES`); callbacks are local state (code is upper-cased here as the container does).
// Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof CurrencyFormDialogView> = {
  title: 'Patterns/Mantine/CurrencyFormDialogView',
  component: CurrencyFormDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Currency create/edit form in `MantineModal`: `TextInput` fields (code disabled when editing) and a numeric decimals input. Fully controlled — the container owns state and the server actions.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CurrencyFormDialogView>

const EMPTY_VALUES: CurrencyFormValues = {
  code: '',
  symbol: '',
  nameSq: '',
  nameEn: '',
  nameUk: '',
  nameIt: '',
  decimals: 0,
}

const EDIT_CURRENCY = FIXTURE_CURRENCIES[1]
const EDIT_VALUES: CurrencyFormValues = {
  code: EDIT_CURRENCY.code,
  symbol: EDIT_CURRENCY.symbol,
  nameSq: EDIT_CURRENCY.name_sq,
  nameEn: EDIT_CURRENCY.name_en,
  nameUk: EDIT_CURRENCY.name_uk,
  nameIt: EDIT_CURRENCY.name_it,
  decimals: EDIT_CURRENCY.decimals,
}

function FormDemo({
  isEdit = false,
  initialValues = EMPTY_VALUES,
  submitting = false,
}: {
  isEdit?: boolean
  initialValues?: CurrencyFormValues
  submitting?: boolean
}) {
  const [values, setValues] = useState(initialValues)
  return (
    <CurrencyFormDialogView
      opened
      isEdit={isEdit}
      values={values}
      onFieldChange={(field, value) =>
        setValues(prev => ({ ...prev, [field]: field === 'code' ? String(value).toUpperCase() : value }))
      }
      submitting={submitting}
      onSubmit={() => {}}
      onClose={() => {}}
    />
  )
}

export const New: Story = { render: () => <FormDemo /> }

export const Edit: Story = { render: () => <FormDemo isEdit initialValues={EDIT_VALUES} /> }

export const Submitting: Story = {
  render: () => <FormDemo isEdit initialValues={EDIT_VALUES} submitting />,
}
