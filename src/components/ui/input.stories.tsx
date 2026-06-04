import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { PhoneField, type PhoneFieldValue } from '@/components/shared/PhoneField';

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

const INP: Record<string, Record<string, string>> = {
  addr:     { en: 'Enter address or area…', sq: 'Shkruani adresen ose zonen…', uk: 'Vvedit adresu abo raion…', it: 'Inserisci indirizzo o zona…' },
  price:    { en: 'Price (EUR)',           sq: 'Cmimi (EUR)',          uk: 'Tsina (EUR)',           it: 'Prezzo (EUR)' },
  locked:   { en: 'Locked value',          sq: 'Vlere e bllokuar',     uk: 'Zablokavane znachennia', it: 'Valore bloccato' },
  dis_ph:   { en: 'Input disabled',        sq: 'Input i çaktivizuar',  uk: 'Pole vymknutе',          it: 'Input disabilitato' },
  search:   { en: 'Search listings…',      sq: 'Kerko njoftime…',      uk: 'Poshuk oholoshen…',      it: 'Cerca annunci…' },
  fullname: { en: 'Full name',             sq: 'Emri i plote',         uk: 'Povne imia',             it: 'Nome completo' },
  name_ph:  { en: 'Your name',             sq: 'Emri juaj',            uk: 'Vashe imia',             it: 'Il tuo nome' },
  phone:    { en: 'Phone',                 sq: 'Telefon',              uk: 'Telefon',                it: 'Telefono' },
}
const inp = (k: string, l = 'en') => INP[k]?.[l] ?? INP[k]?.en ?? k

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
    return <Input disabled placeholder={inp('dis_ph', l)} value={inp('locked', l)} />
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
      <Input placeholder="Search properties…" />
      <Input placeholder="Kërko prona…" />
      <Input placeholder="Пошук нерухомості…" />
      <Input placeholder="Cerca proprietà…" />
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
        <label className="text-sm font-medium">Phone (valid — digits only)</label>
        <Input type="tel" value="691 234 567" readOnly />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Phone (error state — letters blocked)</label>
        <Input type="tel" value="691 234 567" aria-invalid readOnly />
        <p className="text-xs text-destructive mt-0.5">Enter digits only — no letters or symbols.</p>
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: { description: { story: 'PhoneField numeric-only validation states. Error key is localized in all 4 locales. See PhoneField.tsx and lib/phone/index.ts. (Task 363)' } },
  },
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
    viewport: { defaultViewport: 'mobile375' },
    docs: { description: { story: 'Mobile form: canonical PhoneField — dial-code Combobox + national Input. Dropdown shows country names in the active locale (sq/en/uk/it via toolbar). CLDR-sourced names — no hardcode.' } },
  },
};

