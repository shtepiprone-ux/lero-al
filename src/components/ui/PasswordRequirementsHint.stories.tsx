import type { Meta, StoryObj } from '@storybook/react'
import { PasswordRequirementsHint } from './PasswordRequirementsHint'

const meta: Meta<typeof PasswordRequirementsHint> = {
  title: 'Primitives/PasswordRequirementsHint',
  component: PasswordRequirementsHint,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof PasswordRequirementsHint>

export const Idle: Story = {
  args: { value: '' },
  parameters: { docs: { description: { story: 'Empty value — all rules unmet, muted grey.' } } },
}

export const PartiallyMet: Story = {
  args: { value: 'Abc' },
  parameters: { docs: { description: { story: 'Some rules met — mix of ✓ green and ✗ grey.' } } },
}

export const AllMet: Story = {
  args: { value: 'Sample123!' },
  parameters: { docs: { description: { story: 'All 5 rules met — all green check marks, no error text.' } } },
}

export const UkrainianLocale: Story = {
  args: { value: 'Abc' },
  parameters: {
    globals: { locale: 'uk' },
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: 'Ukrainian 320px — longest strings, verify wrap without truncation.' } },
  },
}
