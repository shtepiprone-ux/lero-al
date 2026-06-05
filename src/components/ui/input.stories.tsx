import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { PhoneField, type PhoneFieldValue } from '@/components/shared/PhoneField';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {},
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search', 'tel'] },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

const inp = (k: string, l = 'en') => storyT(l, `storybook.input.${k}`)

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <Input placeholder={inp('addr', l)} />
  },
};

export const WithLabel: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-col gap-2 w-72">
        <label className="text-sm font-medium">{inp('price', l)}</label>
        <Input type="number" placeholder="e.g. 150000" />
      </div>
    )
  },
};

export const Disabled: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <Input disabled placeholder={inp('disabled_ph', l)} value={inp('locked', l)} />
  },
};

export const SearchInput: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
        <Input className="pl-9" placeholder={inp('search', l)} />
      </div>
    )
  },
  parameters: {
    docs: { description: { story: 'Search input composition: canonical Input + search icon. Use locale toolbar for sq/en/uk/it.' } },
  },
};

export const LocalePlaceholders: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      {(['en', 'sq', 'uk', 'it'] as string[]).map(l => (
        <Input key={l} placeholder={storyT(l, 'storybook.input.search')} />
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Input placeholder in en/sq/uk/it — verify text is not clipped. (Documentation story showing all 4 locales simultaneously.)' } },
  },
};

export const PhoneNumericValidation: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{'Phone (valid — digits only)'}</label>
        <Input type="tel" value="691 234 567" readOnly />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{'Phone (error state — letters blocked)'}</label>
        <Input type="tel" value="691 234 567" aria-invalid readOnly />
        <p className="text-xs text-destructive mt-0.5">{'Enter digits only — no letters or symbols.'}</p>
      </div>
    </div>
  ),

  parameters: {
    docs: { description: { story: 'PhoneField numeric-only validation states. Error key is localized in all 4 locales. See PhoneField.tsx and lib/phone/index.ts. (Task 363)' } }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}

function MobileFormDemo({ locale }: { locale: string }) {
  const [phone, setPhone] = useState<PhoneFieldValue>({ national: '', dialCode: '+355', iso2: 'AL', e164: '' })
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{inp('fullname', locale)}</label>
        <Input placeholder={inp('name_ph', locale)} />
      </div>
      <PhoneField value={phone.e164} onChange={setPhone} label={inp('phone', locale)} />
    </div>
  )
}

export const MobileForm: Story = {
  render: (_, context) => <MobileFormDemo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: { description: { story: 'Mobile form: canonical PhoneField — dial-code Combobox + national Input. Dropdown shows country names in the active locale (sq/en/uk/it via toolbar). CLDR-sourced names — no hardcode.' } }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
};
