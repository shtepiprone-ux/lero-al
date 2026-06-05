'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Combobox } from './Combobox'
import type { ComboboxOption } from './Combobox'
import { storyT } from '@/stories/_storyI18n'

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

const cb = (k: string, l = 'en') => storyT(l, `storybook.combobox.${k}`)

const CITY_OPTIONS: ComboboxOption[] = [
  { value: 'tirana', label: 'Tirana' }, { value: 'durres', label: 'Durrës' },
  { value: 'vlore', label: 'Vlorë' },   { value: 'shkoder', label: 'Shkodër' },
]

function getStatusOptions(locale: string): ComboboxOption[] {
  return [
    { value: 'new',         label: cb('status_0', locale) },
    { value: 'in_progress', label: cb('status_1', locale) },
    { value: 'resolved',    label: cb('status_2', locale) },
    { value: 'closed',      label: cb('status_3', locale) },
  ]
}

function getLocationOptions(locale: string): ComboboxOption[] {
  return [
    { value: 'c1', label: cb('loc_0', locale) },
    { value: 'c2', label: cb('loc_1', locale) },
    { value: 'c3', label: cb('loc_2', locale) },
    { value: 'c4', label: cb('loc_3', locale) },
  ]
}

function ComboboxInteractive({
  options, initialValue = '', variant, placeholder, disabled,
}: {
  options: ComboboxOption[]; initialValue?: string; variant?: 'button' | 'input'; placeholder?: string; disabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  return <Combobox options={options} value={value} onChange={setValue} variant={variant} placeholder={placeholder} disabled={disabled} />
}

export const ButtonVariant: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={cb('city_ph', locale)} /></div>)
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const InputVariant: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="input" placeholder={cb('city_search', locale)} /></div>)
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const LongLabelLocaleStress: Story = {
  parameters: {
    docs: { description: { story: '@320: long label truncated in trigger. Select an option — value updates immediately. No horizontal overflow. Use locale toolbar for sq/en/uk/it.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const options = getStatusOptions(locale)
    return (<div className="p-4"><ComboboxInteractive options={options} initialValue="in_progress" variant="button" placeholder={cb('status_ph', locale)} /></div>)
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

export const DropdownOpen: Story = {
  parameters: {
    docs: { description: { story: '@320: open the dropdown — long option labels wrap within dropdown bounds. Use locale toolbar for sq/en/uk/it.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const options = getLocationOptions(locale)
    return (<div className="p-4"><ComboboxInteractive options={options} initialValue="" variant="input" placeholder={cb('search_short', locale)} /></div>)
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

export const NoSelection: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="button" placeholder={cb('no_sel', locale)} /></div>)
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  },
}

export const Disabled: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (<div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={cb('city_ph', locale)} disabled /></div>)
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}
