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
    docs: {
      description: {
        component:
          'Canonical searchable/button combobox primitive. variant="input" for long lists (searchable); variant="button" for short static lists ≤8 items (click-to-open). ' +
          'All stories are interactive: selecting an option updates the displayed value in the trigger. ' +
          'Trigger selected value uses flex-1 min-w-0 truncate — no horizontal overflow at any canonical width. ' +
          'Dropdown items use break-words — long Ukrainian labels wrap, never clip. ' +
          'Portal mode clamps dropdown to viewport right edge. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Combobox>

const SHORT_OPTIONS: ComboboxOption[] = [
  { value: 'tirana', label: 'Tirana' },
  { value: 'durres', label: 'Durrës' },
  { value: 'vlore', label: 'Vlorë' },
  { value: 'shkoder', label: 'Shkodër' },
]

const UK_OPTIONS: ComboboxOption[] = [
  { value: 'new', label: 'Нова заявка на розгляд' },
  { value: 'in_progress', label: 'В обробці адміністратором' },
  { value: 'resolved', label: 'Вирішено успішно' },
  { value: 'closed', label: 'Закрито без вирішення' },
]

const UK_LOCATION_OPTIONS: ComboboxOption[] = [
  { value: 'c1', label: 'Тирана, центральний район міста' },
  { value: 'c2', label: 'Дуррес, приморська зона відпочинку' },
  { value: 'c3', label: 'Вльора, узбережжя Адріатичного моря' },
  { value: 'c4', label: 'Шкодер, озерний район на півночі' },
]

function ComboboxInteractive({
  options,
  initialValue = '',
  variant,
  placeholder,
  disabled,
}: {
  options: ComboboxOption[]
  initialValue?: string
  variant?: 'button' | 'input'
  placeholder?: string
  disabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <Combobox
      options={options}
      value={value}
      onChange={setValue}
      variant={variant}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const ButtonVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <ComboboxInteractive options={SHORT_OPTIONS} initialValue="tirana" variant="button" placeholder="Select city" />
    </div>
  ),
}

export const InputVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <ComboboxInteractive options={SHORT_OPTIONS} initialValue="" variant="input" placeholder="Search city..." />
    </div>
  ),
}

export const LongLabelLocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long label truncated in trigger. Select an option — displayed value updates immediately. No horizontal overflow. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <div className="p-3">
      <ComboboxInteractive options={UK_OPTIONS} initialValue="in_progress" variant="button" placeholder="Виберіть статус" />
    </div>
  ),
}

export const DropdownOpen: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: open the dropdown — long option labels must wrap within dropdown bounds; no overflow. Selecting closes the dropdown and updates the trigger.' } },
  },
  render: () => (
    <div className="p-3">
      <ComboboxInteractive options={UK_LOCATION_OPTIONS} initialValue="" variant="input" placeholder="Пошук..." />
    </div>
  ),
}

export const NoSelection: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <div className="p-3">
      <ComboboxInteractive options={SHORT_OPTIONS} initialValue="" variant="button" placeholder="Select a city..." />
    </div>
  ),
}

export const Disabled: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <ComboboxInteractive options={SHORT_OPTIONS} initialValue="tirana" variant="button" disabled />
    </div>
  ),
}
