import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { storyT } from '@/stories/_storyI18n'

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

const sel = (k: string, l = 'en') => storyT(l, `storybook.select.${k}`)

// ── City options — proper nouns, locale-neutral ───────────────────────────────
const CITY_ITEMS = [
  { value: 'tirana',  label: 'Tirana' },
  { value: 'durres',  label: 'Durrës' },
  { value: 'vlore',   label: 'Vlorë' },
  { value: 'shkoder', label: 'Shkodër' },
]

function getStatusItems(locale: string) {
  return [
    { value: 'new',         label: sel('status_0', locale) },
    { value: 'in_progress', label: sel('status_1', locale) },
    { value: 'resolved',    label: sel('status_2', locale) },
    { value: 'closed',      label: sel('status_3', locale) },
  ]
}

function getSettlements(locale: string) {
  return {
    placeholder: sel('city_ph', locale),
    cities: [
      { value: 'tirana',  label: sel('city_tirana', locale) },
      { value: 'durres',  label: sel('city_durres', locale) },
      { value: 'vlore',   label: sel('city_vlore', locale) },
      { value: 'shkoder', label: sel('city_shkoder', locale) },
    ],
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS}>
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const NoSelection: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select items={CITY_ITEMS}>
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
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
    docs: { description: { story: '@320: selected long label must be truncated in trigger — no horizontal overflow. Open dropdown: options must wrap. Use locale toolbar for sq/en/uk/it.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const items = getStatusItems(locale)
    return (
      <div className="p-3">
        <Select defaultValue="in_progress" items={items}>
          <SelectTrigger><SelectValue placeholder={sel('status_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {items.map(i => (<SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

export const Disabled: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS} disabled>
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const OutlineVariant: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="p-4 sm:max-w-xs">
        <Select defaultValue="tirana" items={CITY_ITEMS}>
          <SelectTrigger variant="outline"><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {CITY_ITEMS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const MobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: '@320: Select opens as a full-width bottom sheet — edge-to-edge, rounded-t-2xl, drag handle, slide-up. Items ≥44px. Use locale toolbar for sq/en/uk/it.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const items = getStatusItems(locale)
    return (
      <div className="p-3">
        <Select items={items} defaultOpen>
          <SelectTrigger><SelectValue placeholder={sel('status_ph', locale)} /></SelectTrigger>
          <SelectContent>
            {items.map(i => (<SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    )
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

export const SettlementsLocaleStress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Settlement names at 320px. Names are always capitalized. ' +
          'Use the locale toolbar to switch sq/en/uk/it — each locale shows the appropriate settlement label. ' +
          'Trigger value must truncate; no horizontal overflow.',
      },
    }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const data = getSettlements(locale)
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

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
