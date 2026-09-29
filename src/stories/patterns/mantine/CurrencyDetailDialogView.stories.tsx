import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CurrencyDetailDialogView } from '@/components/admin/CurrencyDetailDialogView'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'

// Task 877 — presentational View of the currency detail dialog (was the internal `CurrencyDetailDialog` of
// `AdminCurrenciesManager`). GR-3a: CREATE — no canonical Story imported it. Opens on mount: centred
// `MantineModal` from 640px, bottom sheet below. States follow the footer conditions: a normal active
// currency, the default currency (no "set default" / "delete") and an inactive one ("activate", no
// "set default"). Callbacks are no-ops; `FIXTURE_CURRENCIES` is labelled fixture data. Viewport and locale
// come from the Storybook toolbar.
const meta: Meta<typeof CurrencyDetailDialogView> = {
  title: 'Patterns/Mantine/CurrencyDetailDialogView',
  component: CurrencyDetailDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Currency detail in `MantineModal`: fields in a two-column `SimpleGrid`, status badges (default = brand, active/inactive = green/gray) and the action footer.',
      },
    },
  },
  args: {
    onClose: () => {},
    onEdit: () => {},
    onToggleActive: () => {},
    onSetDefault: () => {},
    onDelete: () => {},
  },
}
export default meta
type Story = StoryObj<typeof CurrencyDetailDialogView>

// FIXTURE_CURRENCIES: [0] ALL (default, active) · [1] EUR (active) · [2] USD (inactive).
export const Default: Story = { args: { currency: FIXTURE_CURRENCIES[1] } }

export const DefaultCurrency: Story = { args: { currency: FIXTURE_CURRENCIES[0] } }

export const Inactive: Story = { args: { currency: FIXTURE_CURRENCIES[2] } }
