import type { Meta, StoryObj } from '@storybook/react';
import { Search } from 'lucide-react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Enter address or area…' },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-72">
      <label className="text-sm font-medium">Price (EUR)</label>
      <Input type="number" placeholder="e.g. 150000" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Input disabled', value: 'Locked value' },
};

export const SearchInput: Story = {
  render: () => (
    <div className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
      <Input className="pl-9" placeholder="Search listings…" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '`AdminSearchInput` is the canonical composition of Input + search icon. ' +
               'Never create a custom input wrapper with hardcoded height.',
      },
    },
  },
};

export const LocalePlaceholders: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <Input placeholder="Search properties…" />
      <Input placeholder="Kërko prona…" />
      <Input placeholder="Пошук нерухомості…" />
      <Input placeholder="Cerca proprietà…" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Input placeholder in en/sq/uk/it — verify text is not clipped.' },
    },
  },
};

export const PhoneNumericValidation: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Phone (valid — digits only)</label>
        <Input type="tel" value="691 234 567" readOnly />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Phone (error state — letters blocked)</label>
        <Input type="tel" value="691 234 567" aria-invalid readOnly />
        <p className="text-xs text-destructive mt-0.5">
          Enter digits only — no letters or symbols.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Phone (uk locale error)</label>
        <Input type="tel" value="" aria-invalid readOnly placeholder="691 234 567" />
        <p className="text-xs text-destructive mt-0.5">
          Введіть лише цифри — без букв та символів.
        </p>
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story:
          'PhoneField numeric-only validation states. ' +
          'Input filtering (`/[^\\d\\s\\-().]​/g`) strips letters/symbols on every keystroke and paste. ' +
          'Schema step (c) in `validateNationalPhone` returns `error_phone_digits_only` if non-digits pass filtering. ' +
          'Error key is localized in all 4 locales (auth / cabinet / admin.user_profile.validation namespaces). ' +
          'See `PhoneField.tsx` and `lib/phone/index.ts`. (Task 363)',
      },
    },
  },
}

export const MobileForm: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-sm p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Full name</label>
        <div className="min-h-[44px] flex items-center">
          <Input placeholder="Your name" className="w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Phone</label>
        <div className="min-h-[44px] flex items-center">
          <Input type="tel" placeholder="+355 69 000 0000" className="w-full" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: 'Mobile form: wrap Input in `min-h-[44px]` container for touch-safe target area. ' +
               'See docs/ui-rules.md §4 for input size governance.',
      },
    },
  },
};
