import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {},
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

const CK: Record<string, Record<string, string>> = {
  agree:   { en: 'I agree to the terms',  sq: 'Pranoj kushtet',          uk: 'Pohodiuius z umovamy',     it: 'Accetto i termini' },
  save_s:  { en: 'Save search',           sq: 'Ruaj kerkimin',           uk: 'Zberehty poshuk',          it: 'Salva ricerca' },
  unavail: { en: 'Unavailable option',    sq: 'Opsion i padisponueshem', uk: 'Nedostupnyi parametr',     it: 'Opzione non disponibile' },
  apt:     { en: 'Apartment',             sq: 'Apartament',              uk: 'Kvartyra',                 it: 'Appartamento' },
  house:   { en: 'House',                 sq: 'Shtepi',                  uk: 'Budynok',                  it: 'Casa' },
  studio:  { en: 'Studio',                sq: 'Studio',                  uk: 'Studio',                   it: 'Monolocale' },
  villa:   { en: 'Villa',                 sq: 'Vile',                    uk: 'Vila',                     it: 'Villa' },
  land:    { en: 'Land',                  sq: 'Toke',                    uk: 'Zemlia',                   it: 'Terreno' },
}
const ck = (k: string, l = 'en') => CK[k]?.[l] ?? CK[k]?.en ?? k

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
        <label htmlFor="checked" className="text-sm">{ck('save_s', l)}</label>
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
    const types = [ck('apt', l), ck('house', l), ck('studio', l), ck('villa', l), ck('land', l)]
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
    viewport: { defaultViewport: 'mobile375' },
    docs: { description: { story: 'Filter checkboxes with min-h-[44px] touch targets. Use locale toolbar for sq/en/uk/it.' } },
  },
};
