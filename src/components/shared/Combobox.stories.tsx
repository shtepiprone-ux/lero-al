'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Combobox } from './Combobox'
import type { ComboboxOption } from './Combobox'

const meta: Meta<typeof Combobox> = {
  title: 'Shared/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Canonical searchable/button combobox. variant=input for long lists; variant=button for short lists. Breakpoints via viewport toolbar; locales via locale toolbar.' } },
  },
}

export default meta
type Story = StoryObj<typeof Combobox>

const CITY_OPTIONS: ComboboxOption[] = [
  { value: 'tirana', label: 'Tirana' }, { value: 'durres', label: 'Durrës' },
  { value: 'vlore', label: 'Vlorë' },   { value: 'shkoder', label: 'Shkodër' },
]

const STATUS_OPTIONS: Record<string, ComboboxOption[]> = {
  en: [
    { value: 'new',         label: 'New request awaiting administrator review' },
    { value: 'in_progress', label: 'In progress — under administrator review' },
    { value: 'resolved',    label: 'Successfully resolved' },
    { value: 'closed',      label: 'Closed without resolution' },
  ],
  sq: [
    { value: 'new',         label: 'Kërkesë e re në pritje të shqyrtimit nga administratori' },
    { value: 'in_progress', label: 'Në procesim — duke u shqyrtuar nga ekipi i administrimit' },
    { value: 'resolved',    label: 'Zgjidhur me sukses nga administratori' },
    { value: 'closed',      label: 'Mbyllur pa zgjidhje nga administratori' },
  ],
  uk: [
    { value: 'new',         label: 'Нова заявка на розгляд' },
    { value: 'in_progress', label: 'В обробці адміністратором' },
    { value: 'resolved',    label: 'Вирішено успішно' },
    { value: 'closed',      label: 'Закрито без вирішення' },
  ],
  it: [
    { value: 'new',         label: 'Nuova richiesta in attesa di revisione' },
    { value: 'in_progress', label: 'In lavorazione — in revisione dall\'amministratore' },
    { value: 'resolved',    label: 'Risolto con successo' },
    { value: 'closed',      label: 'Chiuso senza risoluzione' },
  ],
}

const LOCATION_OPTIONS: Record<string, ComboboxOption[]> = {
  en: [
    { value: 'c1', label: 'Tirana, central city district' },
    { value: 'c2', label: 'Durrës, seaside resort area' },
    { value: 'c3', label: 'Vlorë, Adriatic Sea coastline' },
    { value: 'c4', label: 'Shkodër, northern lake district' },
  ],
  sq: [
    { value: 'c1', label: 'Tiranë, rrethi qendror i qytetit' },
    { value: 'c2', label: 'Durrës, zona bregdetare e pushimit' },
    { value: 'c3', label: 'Vlorë, bregdeti i Detit Adriatik' },
    { value: 'c4', label: 'Shkodër, rajoni i liqenit në veri' },
  ],
  uk: [
    { value: 'c1', label: 'Тирана, центральний район міста' },
    { value: 'c2', label: 'Дуррес, приморська зона відпочинку' },
    { value: 'c3', label: 'Вльора, узбережжя Адріатичного моря' },
    { value: 'c4', label: 'Шкодер, озерний район на півночі' },
  ],
  it: [
    { value: 'c1', label: 'Tirana, quartiere centrale della città' },
    { value: 'c2', label: 'Durazzo, area balneare di villeggiatura' },
    { value: 'c3', label: 'Valona, costa del Mare Adriatico' },
    { value: 'c4', label: 'Scutari, distretto del lago nel nord' },
  ],
}

const PLACEHOLDERS: Record<string, Record<string, string>> = {
  city:   { en: 'Select city',     sq: 'Zgjidh qytetin',    uk: 'Виберіть місто',    it: 'Seleziona città' },
  search: { en: 'Search city...',  sq: 'Kërko qytetin...',  uk: 'Пошук міста...',    it: 'Cerca città...' },
  status: { en: 'Select status',   sq: 'Zgjidh statusin',   uk: 'Виберіть статус',   it: 'Seleziona stato' },
  loc_s:  { en: 'Search...',       sq: 'Kërko...',          uk: 'Пошук...',          it: 'Cerca...' },
  no_sel: { en: 'Select a city...', sq: 'Zgjidh një qytet...', uk: 'Виберіть місто...', it: 'Seleziona una città...' },
}
const ph = (k: string, l = 'en') => PLACEHOLDERS[k]?.[l] ?? PLACEHOLDERS[k]?.en ?? k

function ComboboxInteractive({
  options, initialValue = '', variant, placeholder, disabled,
}: {
  options: ComboboxOption[]; initialValue?: string; variant?: 'button' | 'input'; placeholder?: string; disabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  return <Combobox options={options} value={value} onChange={setValue} variant={variant} placeholder={placeholder} disabled={disabled} />
}

export const ButtonVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={ph('city', locale)} /></div>)
  },
}

export const InputVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="input" placeholder={ph('search', locale)} /></div>)
  },
}

export const LongLabelLocaleStress: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' }, docs: { description: { story: '@320: long label truncated in trigger. Select an option — value updates immediately. No horizontal overflow. Use locale toolbar for sq/en/uk/it.' } } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const options = STATUS_OPTIONS[locale] ?? STATUS_OPTIONS.en
    return (<div className="p-4"><ComboboxInteractive options={options} initialValue="in_progress" variant="button" placeholder={ph('status', locale)} /></div>)
  },
}

export const DropdownOpen: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' }, docs: { description: { story: '@320: open the dropdown — long option labels wrap within dropdown bounds. Use locale toolbar for sq/en/uk/it.' } } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const options = LOCATION_OPTIONS[locale] ?? LOCATION_OPTIONS.en
    return (<div className="p-4"><ComboboxInteractive options={options} initialValue="" variant="input" placeholder={ph('loc_s', locale)} /></div>)
  },
}

export const NoSelection: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="button" placeholder={ph('no_sel', locale)} /></div>)
  },
}

export const Disabled: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={ph('city', locale)} disabled /></div>)
  },
}
