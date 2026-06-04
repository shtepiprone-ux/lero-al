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
          'Base-UI Select primitive. **Canonical usage:** always pass `items` to `<Select>` (= `SelectRoot`) ' +
          'so the trigger can resolve value→label without requiring the dropdown to open first. ' +
          '`items` shape: `Array<{ value: string; label: string }>`. ' +
          'SelectTrigger uses w-full max-w-full min-w-0 so it fills its container without horizontal overflow. ' +
          'SelectItem text uses break-words — long labels wrap inside the dropdown. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ── City options — proper nouns, locale-neutral ───────────────────────────────
const CITY_ITEMS = [
  { value: 'tirana',  label: 'Tirana' },
  { value: 'durres',  label: 'Durrës' },
  { value: 'vlore',   label: 'Vlorë' },
  { value: 'shkoder', label: 'Shkodër' },
]

// ── Long-label status options per locale (for locale stress stories) ──────────
const STATUS_ITEMS: Record<string, { value: string; label: string }[]> = {
  en: [
    { value: 'new',         label: 'New request awaiting administrator review' },
    { value: 'in_progress', label: 'In progress — being reviewed by the administration team' },
    { value: 'resolved',    label: 'Successfully resolved after review' },
    { value: 'closed',      label: 'Closed without resolution' },
  ],
  sq: [
    { value: 'new',         label: 'Kërkesë e re në pritje të shqyrtimit nga administratori' },
    { value: 'in_progress', label: 'Në procesim — duke u shqyrtuar nga ekipi i administrimit' },
    { value: 'resolved',    label: 'Zgjidhur me sukses pas shqyrtimit' },
    { value: 'closed',      label: 'Mbyllur pa zgjidhje' },
  ],
  uk: [
    { value: 'new',         label: 'Нова заявка на розгляд адміністратором' },
    { value: 'in_progress', label: 'В обробці — перевіряється командою адміністраторів' },
    { value: 'resolved',    label: 'Вирішено успішно після перевірки' },
    { value: 'closed',      label: 'Закрито без вирішення' },
  ],
  it: [
    { value: 'new',         label: 'Nuova richiesta in attesa di revisione' },
    { value: 'in_progress', label: 'In lavorazione — in revisione dal team di amministrazione' },
    { value: 'resolved',    label: 'Risolto con successo dopo la revisione' },
    { value: 'closed',      label: 'Chiuso senza risoluzione' },
  ],
}

// ── Per-locale placeholders ───────────────────────────────────────────────────
const PLACEHOLDERS: Record<string, Record<string, string>> = {
  city:   { en: 'Select city',    sq: 'Zgjidh qytetin',    uk: 'Виберіть місто',    it: 'Seleziona città' },
  status: { en: 'Select status',  sq: 'Zgjidh statusin',   uk: 'Виберіть статус',   it: 'Seleziona stato' },
}
const ph = (k: string, l = 'en') => PLACEHOLDERS[k]?.[l] ?? PLACEHOLDERS[k]?.en ?? k

// ── Settlement labels per locale (for SettlementsLocaleStress) ────────────────
const SETTLEMENTS_BY_LOCALE: Record<string, { placeholder: string; cities: { value: string; label: string }[] }> = {
  en: {
    placeholder: 'Select city',
    cities: [
      { value: 'tirana',  label: 'Tirana' }, { value: 'durres', label: 'Durrës' },
      { value: 'vlore',   label: 'Vlorë'  }, { value: 'shkoder', label: 'Shkodër' },
    ],
  },
  sq: {
    placeholder: 'Zgjidh qytetin',
    cities: [
      { value: 'tirana',  label: 'Tirana' }, { value: 'durres', label: 'Durrës' },
      { value: 'vlore',   label: 'Vlorë'  }, { value: 'shkoder', label: 'Shkodër' },
    ],
  },
  uk: {
    placeholder: 'Виберіть місто',
    cities: [
      { value: 'tirana',  label: 'Тирана' }, { value: 'durres', label: 'Дуррес' },
      { value: 'vlore',   label: 'Вльора' }, { value: 'shkoder', label: 'Шкодер' },
    ],
  },
  it: {
    placeholder: 'Seleziona città',
    cities: [
      { value: 'tirana',  label: 'Tirana' }, { value: 'durres', label: 'Durrës' },
      { value: 'vlore',   label: 'Valona' }, { value: 'shkoder', label: 'Scutari' },
    ],
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS}>
          <SelectTrigger><SelectValue placeholder={ph('city', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const NoSelection: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select items={CITY_ITEMS}>
          <SelectTrigger><SelectValue placeholder={ph('city', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const LongLabelLocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: selected long label must be truncated in trigger — no horizontal overflow. Open dropdown: options must wrap. Use locale toolbar for sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const items = STATUS_ITEMS[locale] ?? STATUS_ITEMS.en
    return (
      <div className="p-3">
        <Select defaultValue="in_progress" items={items}>
          <SelectTrigger><SelectValue placeholder={ph('status', locale)} /></SelectTrigger>
          <SelectContent>
            {items.map(i => (<SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const Disabled: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS} disabled>
          <SelectTrigger><SelectValue placeholder={ph('city', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const OutlineVariant: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS}>
          <SelectTrigger variant="outline"><SelectValue placeholder={ph('city', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const MobileBottomSheet: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: Select opens as a full-width bottom sheet — edge-to-edge, rounded-t-2xl, drag handle, slide-up. Items ≥44px. Use locale toolbar for sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const items = STATUS_ITEMS[locale] ?? STATUS_ITEMS.en
    return (
      <div className="p-3">
        <Select items={items}>
          <SelectTrigger><SelectValue placeholder={ph('status', locale)} /></SelectTrigger>
          <SelectContent>
            {items.map(i => (<SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const SettlementsLocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: {
      description: {
        story:
          'Settlement names at 320px. Names are always capitalized. ' +
          'Use the locale toolbar to switch sq/en/uk/it — each locale shows the appropriate settlement label. ' +
          'Trigger value must truncate; no horizontal overflow.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const data = SETTLEMENTS_BY_LOCALE[locale] ?? SETTLEMENTS_BY_LOCALE.en
    return (
      <div className="p-3">
        <Select defaultValue="tirana" items={data.cities}>
          <SelectTrigger><SelectValue placeholder={data.placeholder} /></SelectTrigger>
          <SelectContent>
            {data.cities.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
}
