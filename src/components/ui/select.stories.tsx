import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

const meta: Meta = {
  title: 'Primitives/Select',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base-UI Select primitive. SelectTrigger uses w-full max-w-full min-w-0 so it fills its container without horizontal overflow. ' +
          'SelectItem text uses break-words — long Ukrainian labels wrap inside the dropdown. ' +
          'SelectContent uses w-(--anchor-width) overflow-x-hidden to stay within trigger bounds. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const UK_ITEMS = [
  { value: 'new', label: 'Нова заявка на розгляд адміністратором' },
  { value: 'in_progress', label: 'В обробці — перевіряється командою адміністраторів' },
  { value: 'resolved', label: 'Вирішено успішно після перевірки' },
  { value: 'closed', label: 'Закрито без вирішення' },
]

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <Select defaultValue="tirana">
        <SelectTrigger>
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tirana">Tirana</SelectItem>
          <SelectItem value="durres">Durrës</SelectItem>
          <SelectItem value="vlore">Vlorë</SelectItem>
          <SelectItem value="shkoder">Shkodër</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const NoSelection: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tirana">Tirana</SelectItem>
          <SelectItem value="durres">Durrës</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const LongLabelLocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: selected Ukrainian label must be truncated in trigger — no horizontal overflow. Open dropdown: options must wrap. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <div className="p-3">
      <Select defaultValue="in_progress">
        <SelectTrigger>
          <SelectValue placeholder="Виберіть статус" />
        </SelectTrigger>
        <SelectContent>
          {UK_ITEMS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Disabled: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <Select defaultValue="tirana" disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tirana">Tirana</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const OutlineVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <div className="max-w-xs p-4">
      <Select defaultValue="tirana">
        <SelectTrigger variant="outline">
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tirana">Tirana</SelectItem>
          <SelectItem value="durres">Durrës</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

// ── Locale settlement parity (Task 364) ──────────────────────────────────────
// Settlement labels must be capitalized regardless of DB storage.
// The canonical capitalize() from @/lib/utils ensures this in LocationCombobox.
// This story demonstrates correct capitalized settlement labels across locales.

const SETTLEMENTS_BY_LOCALE: Record<string, { placeholder: string; cities: { value: string; label: string }[] }> = {
  en: {
    placeholder: 'Select city',
    cities: [
      { value: 'tirana',   label: 'Tirana' },
      { value: 'durres',   label: 'Durrës' },
      { value: 'vlore',    label: 'Vlorë' },
      { value: 'shkoder',  label: 'Shkodër' },
    ],
  },
  sq: {
    placeholder: 'Zgjidh qytetin',
    cities: [
      { value: 'tirana',   label: 'Tirana' },
      { value: 'durres',   label: 'Durrës' },
      { value: 'vlore',    label: 'Vlorë' },
      { value: 'shkoder',  label: 'Shkodër' },
    ],
  },
  uk: {
    placeholder: 'Виберіть місто',
    cities: [
      { value: 'tirana',   label: 'Тирана' },
      { value: 'durres',   label: 'Дуррес' },
      { value: 'vlore',    label: 'Вльора' },
      { value: 'shkoder',  label: 'Шкодер' },
    ],
  },
  it: {
    placeholder: 'Seleziona città',
    cities: [
      { value: 'tirana',   label: 'Tirana' },
      { value: 'durres',   label: 'Durrës' },
      { value: 'vlore',    label: 'Valona' },
      { value: 'shkoder',  label: 'Scutari' },
    ],
  },
}

export const SettlementsLocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: {
      description: {
        story:
          'Settlement names at 320px, uk locale. Names are always capitalized (capitalize() util in LocationCombobox). ' +
          'Use the locale toolbar to switch sq/en/it — each locale shows the appropriate settlement label. ' +
          'At sq: `name_al`. At en: `name_en ?? name_al`. At uk/it: `name_al` (no data, fallback). ' +
          'Trigger value must truncate; no horizontal overflow.',
      },
    },
  },
  render: () => {
    const locale = 'uk' as keyof typeof SETTLEMENTS_BY_LOCALE
    const data = SETTLEMENTS_BY_LOCALE[locale] ?? SETTLEMENTS_BY_LOCALE.en
    return (
      <div className="p-3">
        <Select defaultValue="tirana">
          <SelectTrigger>
            <SelectValue placeholder={data.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {data.cities.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}
