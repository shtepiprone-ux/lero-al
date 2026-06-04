'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterBar } from './FilterBar'
import { PageShell } from './PageShell'
import { Section } from './Section'

const meta: Meta<typeof FilterBar> = {
  title: 'Layout/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive (CLIENT component — owns Sheet open-state). ' +
          'Canonical filter/search/reset row per docs/design-system.md §11.1. ' +
          'Desktop (≥1024): Row 1 = search (full width) → Row 2 = activeFilters + count + Reset → Row 3 = availableFilters. ' +
          'Tablet (640–1023): Sheet trigger + search inline; filters collapse to Sheet. ' +
          'Mobile (<640): Sheet trigger + search stacked full-width; Sheet for filters. ' +
          'Labels via `labels` prop only — zero literal strings. ' +
          '(Task 374 slot model: search · activeFilters · availableFilters · legacy filters)',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof FilterBar>

// ── Label fixtures per locale ─────────────────────────────────────────────────
const LABELS_EN = { filters: 'Filters', reset: 'Reset all', close: 'Close filters' }
const LABELS_UK = { filters: 'Фільтри', reset: 'Скинути всі', close: 'Закрити фільтри' }
const LABELS_SQ = { filters: 'Filtra', reset: 'Rivendos të gjitha', close: 'Mbyll filtrat' }
const LABELS_IT = { filters: 'Filtri', reset: 'Azzera tutto', close: 'Chiudi filtri' }

// ── Chip sets per locale ──────────────────────────────────────────────────────
const CHIP_SETS: Record<string, string[]> = {
  en: ['Sale', 'Rent', 'Commercial', 'Studio', '2-br', '3-br', '4-br', '5-br', '6+', 'Office', 'Land'],
  uk: ['Продаж', 'Оренда', 'Комерційна', 'Студія', '2 кімнати', '3 кімнати', '4 кімнати', '5 кімнат', '6+', 'Офіс', 'Земля'],
  sq: ['Shitje', 'Qira', 'Komerciale', 'Studio', '2-dh', '3-dh', '4-dh', '5-dh', '6+', 'Zyrë', 'Tokë'],
  it: ['Vendita', 'Affitto', 'Commerciale', 'Monolocale', '2 locali', '3 locali', '4 locali', '5 locali', '6+', 'Ufficio', 'Terreno'],
}

// ── Content mock ──────────────────────────────────────────────────────────────
const CONTENT_MOCK = (
  <div className="rounded-2xl border bg-card overflow-hidden">
    {[0, 1].map(i => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
        <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3.5 bg-muted rounded-full w-2/3" />
          <div className="h-2.5 bg-muted/60 rounded-full w-1/2" />
        </div>
        <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
      </div>
    ))}
  </div>
)

function SearchInput({ placeholder }: { placeholder: string }) {
  return <Input placeholder={placeholder} type="search" className="h-11" />
}

// ── Per-locale labels and section titles ──────────────────────────────────────
const LABELS_BY_LOCALE: Record<string, { filters: string; reset: string; close: string }> = {
  en: LABELS_EN, uk: LABELS_UK, sq: LABELS_SQ, it: LABELS_IT,
}

const SECTION_TITLES: Record<string, string> = {
  en: 'Search results', uk: 'Результати пошуку', sq: 'Rezultate të kërkimit', it: 'Risultati di ricerca',
}

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  en: 'Search listings…', uk: 'Пошук оголошень…', sq: 'Kërko njoftimet…', it: 'Cerca annunci…',
}

// ── FilterBarDemo — locale passed as prop from story render context ───────────
function FilterBarDemo({
  locale = 'en',
  totalChips = 6,
  initialActiveCount = 0,
}: {
  locale?: string
  totalChips?: number
  initialActiveCount?: number
}) {
  const chips = (CHIP_SETS[locale] ?? CHIP_SETS.en).slice(0, totalChips)
  const [active, setActive] = useState<string[]>(() => chips.slice(0, initialActiveCount))
  const activeChips = chips.filter(c => active.includes(c))
  const availableChips = chips.filter(c => !active.includes(c))
  const labels = LABELS_BY_LOCALE[locale] ?? LABELS_BY_LOCALE.en
  const sectionTitle = SECTION_TITLES[locale] ?? SECTION_TITLES.en
  const searchPlaceholder = SEARCH_PLACEHOLDERS[locale] ?? SEARCH_PLACEHOLDERS.en

  function toggle(chip: string) {
    setActive(prev => prev.includes(chip) ? prev.filter(v => v !== chip) : [...prev, chip])
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          search={<SearchInput placeholder={searchPlaceholder} />}
          activeFilters={
            activeChips.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {activeChips.map(chip => (
                  <Button key={chip} size="xl" variant="default" onClick={() => toggle(chip)}>
                    {chip}
                  </Button>
                ))}
              </div>
            ) : undefined
          }
          availableFilters={
            <div className="flex flex-wrap gap-3">
              {availableChips.map(chip => (
                <Button key={chip} size="xl" variant="outline" onClick={() => toggle(chip)}>
                  {chip}
                </Button>
              ))}
            </div>
          }
          activeCount={activeChips.length}
          onReset={activeChips.length > 0 ? () => setActive([]) : undefined}
          labels={labels}
        />
        <Section title={sectionTitle}>{CONTENT_MOCK}</Section>
      </div>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Stories ───────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Desktop ≥1024: Row 1 = search full-width · Row 2 = active chips + count + Reset · Row 3 = available filters. 2 pre-active. Use locale toolbar — chips, labels, search placeholder all update.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={2} />
  },
}

export const NoActiveFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: '0 active: no count, no Reset. Row 3 = available filters only. Click any filter → it moves to Row 2 active.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={0} />
  },
}

export const WithActiveFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: '3 of 6 pre-active. Row 2 = active + count(3) + Reset. Row 3 = available. Reset clears all → Row 2 empties, everything moves to Row 3.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={6} initialActiveCount={3} />
  },
}

export const TabletStack: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet768' },
    docs: { description: { story: '640–1023 band: Sheet trigger inline with search (not stacked). Desktop hierarchy hidden. Sheet opens with active+available sections.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={1} />
  },
}

export const MobileStack: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    docs: { description: { story: '<640: Sheet trigger full-width, search full-width, stacked. Desktop hierarchy hidden. Open Sheet → active + available filters inside.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={2} />
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: 'uk@320: longest-locale stress. Sheet trigger + search full-width at 320. Ukrainian labels wrap in Sheet. No h-scroll.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={3} />
  },
}

export const ManyFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: '11 chips: at ≥1024 active row wraps correctly; available row wraps. Reset + count always adjacent to active row.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <FilterBarDemo locale={locale} totalChips={11} initialActiveCount={3} />
  },
}

export const AllLocalesDesktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Four locale instances at desktop — verify hierarchy correct in sq/en/uk/it.' } },
  },
  render: () => (
    <div className="space-y-8">
      <FilterBarDemo locale="sq" totalChips={4} initialActiveCount={1} />
      <FilterBarDemo locale="en" totalChips={4} initialActiveCount={1} />
      <FilterBarDemo locale="uk" totalChips={4} initialActiveCount={1} />
      <FilterBarDemo locale="it" totalChips={4} initialActiveCount={1} />
    </div>
  ),
}
