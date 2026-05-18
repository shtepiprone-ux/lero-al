import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="example" />
      <label htmlFor="example" className="text-sm">I agree to the terms</label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checked" defaultChecked />
      <label htmlFor="checked" className="text-sm">Save search</label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled" disabled />
      <label htmlFor="disabled" className="text-sm text-muted-foreground">Unavailable option</label>
    </div>
  ),
};

export const FilterCheckboxList: Story = {
  render: () => (
    <div className="space-y-2 w-48">
      {['Apartment', 'House', 'Studio', 'Villa', 'Land'].map((type) => (
        <div key={type} className="flex items-center gap-2 min-h-[44px]">
          <Checkbox id={type} />
          <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>
        </div>
      ))}
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: 'Filter checkboxes use `min-h-[44px]` wrapper for mobile touch targets.',
      },
    },
  },
};
