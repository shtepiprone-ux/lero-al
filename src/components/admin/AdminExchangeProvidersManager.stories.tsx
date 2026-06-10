import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminExchangeProvidersManager, ProviderFormDialog } from './AdminExchangeProvidersManager'
import { FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'

const meta: Meta<typeof AdminExchangeProvidersManager> = {
  title: 'Admin/AdminExchangeProvidersManager',
  component: AdminExchangeProvidersManager,
  tags: ['autodocs'],
  args: { initialProviders: FIXTURE_PROVIDERS },
}
export default meta
type Story = StoryObj<typeof AdminExchangeProvidersManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const FormDialogMobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: '@320: ProviderFormDialog (add/edit) opens as a full-width bottom sheet — edge-to-edge, drag handle, ≤90dvh scroll, fields wrap. Use locale toolbar for sq/en/uk/it.' } }
  },
  render: () => (
    <ProviderFormDialog initial={null} onClose={() => {}} onSaved={() => {}} />
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
