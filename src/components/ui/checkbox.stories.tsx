import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Checkbox } from './checkbox';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {},
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

const ck = (k: string, l = 'en') => storyT(l, `storybook.checkbox.${k}`)

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex items-center gap-2">
        <Checkbox id="example" />
        <label htmlFor="example" className="text-sm">{ck('agree', l)}</label>
      </div>
    )
  },
};

export const Checked: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex items-center gap-2">
        <Checkbox id="checked" defaultChecked />
        <label htmlFor="checked" className="text-sm">{ck('save_search', l)}</label>
      </div>
    )
  },
};

export const Disabled: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex items-center gap-2">
        <Checkbox id="disabled" disabled />
        <label htmlFor="disabled" className="text-sm text-muted-foreground">{ck('unavail', l)}</label>
      </div>
    )
  },
};

export const FilterCheckboxList: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const types = [ck('apartment', l), ck('house', l), ck('studio', l), ck('villa', l), ck('land', l)]
    return (
      <div className="space-y-2 w-48">
        {types.map((type) => (
          <div key={type} className="flex items-center gap-2 min-h-[44px]">
            <Checkbox id={type} />
            <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>
          </div>
        ))}
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Filter checkboxes with min-h-[44px] touch targets. Use locale toolbar for sq/en/uk/it.' } }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
};
