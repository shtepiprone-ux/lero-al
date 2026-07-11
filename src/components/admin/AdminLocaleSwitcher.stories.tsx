import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { AdminLocaleSwitcher } from './AdminLocaleSwitcher'

const meta: Meta<typeof AdminLocaleSwitcher> = {
  title: 'Admin/AdminLocaleSwitcher',
  component: AdminLocaleSwitcher,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof AdminLocaleSwitcher>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const MobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: '@320: language menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar.' } }
  },
  render: () => (
    <div className="p-4 max-w-xs">
      <AdminLocaleSwitcher />
    </div>
  ),
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  // Task 576 — restores the open-sheet QA evidence WITHOUT a defaultOpen/controlled-mode prop:
  // MantineDropdownMenu is intentionally uncontrolled, so the only way to show the OPEN state is
  // a real interaction. Clicking the trigger bubbles to MantineDropdownMenu's mobile wrapper
  // (`Box onClick={() => openDrawer()}`), which opens the bottom sheet exactly as a real user tap would.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = await canvas.findByRole('button')
    await userEvent.click(trigger)
  },
}
