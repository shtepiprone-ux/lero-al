import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminCurrenciesManager, CurrencyFormDialog } from './AdminCurrenciesManager'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminCurrenciesManager> = {
  title: 'Admin/AdminCurrenciesManager',
  component: AdminCurrenciesManager,
  tags: ['autodocs'],
  args: { initialCurrencies: FIXTURE_CURRENCIES },
}
export default meta
type Story = StoryObj<typeof AdminCurrenciesManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const FormDialogMobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: '@320: CurrencyFormDialog (add/edit) opens as a full-width bottom sheet — edge-to-edge, drag handle, ≤90dvh scroll, fields wrap. Use locale toolbar for sq/en/uk/it.' } }
  },
  render: () => (
    <CurrencyFormDialog initial={null} onClose={() => {}} onSaved={() => {}} />
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
