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
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive (CLIENT component — owns Sheet open-state). ' +
          'Canonical filter/search/reset row per docs/design-system.md §11.1. ' +
          'At lg:+ all filters render inline; at <lg: all filters collapse behind a single "Filters" Sheet trigger (Decision D1 all-or-nothing). ' +
          'Active-filter count Badge + single global Reset render only when activeCount > 0. ' +
          'Search slot is always in the row. All user-facing text via `labels` prop — zero literal strings. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. ' +
          '(Task 349 DS-4)',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof FilterBar>

// ── Label fixtures per locale ─────────────────────────────────────────────────
const LABELS_EN = { filters: 'Filters', reset: 'Reset all', close: 'Close filters' }
const LABELS_UK = { filters: 'Фільтри', reset: 'Скинути всі', close: 'Закрити фільтри' }

// ── Chip sets per locale ──────────────────────────────────────────────────────
const CHIP_SETS: Record<string, string[]> = {
  en: ['Sale', 'Rent', 'Commercial', 'Studio', '2-br', '3-br', '4-br', '5-br', '6+', 'Office', 'Land'],
  uk: ['Продаж', 'Оренда', 'Комерційна', 'Студія', '2 кімнати', '3 кімнати', '4 кімнати', '5 кімнат', '6+', 'Офіс', 'Земля'],
  sq: ['Shitje', 'Qira', 'Komerciale', 'Studio', '2-dh', '3-dh', '4-dh', '5-dh', '6+', 'Zyrë', 'Tokë'],
  it: ['Vendita', 'Affitto', 'Commerciale', 'Monolocale', '2 locali', '3 locali', '4 locali', '5 locali', '6+', 'Ufficio', 'Terreno'],
}

// ── Section labels for labeled chip variants ──────────────────────────────────
const SECTION_LABELS: Record<string, { active: string; noActive: string; available: string }> = {
  en: { active: 'Active filters', noActive: 'No active filters', available: 'Available filters' },
  uk: { active: 'Активні фільтри', noActive: 'Немає активних фільтрів', available: 'Доступні фільтри' },
  sq: { active: 'Filtra aktive', noActive: 'Nuk ka filtra aktive', available: 'Filtra të disponueshëm' },
  it: { active: 'Filtri attivi', noActive: 'Nessun filtro attivo', available: 'Filtri disponibili' },
}

const SEARCH_EN = <Input placeholder="Search listings..." type="search" className="h-11" />
const SEARCH_UK = <Input placeholder="Пошук оголошень..." type="search" className="h-11" />

// ── Polished content mock ─────────────────────────────────────────────────────
const CONTENT_MOCK = (
  <div className="rounded-2xl border bg-card overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-muted rounded-full w-2/3" />
        <div className="h-2.5 bg-muted/60 rounded-full w-1/2" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
    </div>
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-muted rounded-full w-3/4" />
        <div className="h-2.5 bg-muted/60 rounded-full w-2/5" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
    </div>
  </div>
)

const SAMPLE_CONTENT    = <Section title="Search results">{CONTENT_MOCK}</Section>
const SAMPLE_CONTENT_UK = <Section title="Результати пошуку">{CONTENT_MOCK}</Section>

// ── FilterBarDemo — interactive: chips toggle, count + reset reactive ──────────
function FilterBarDemo({
  locale = 'en',
  chipCount = 4,
  initialActive = [],
  labels,
  search,
  children,
}: {
  locale?: string
  chipCount?: number
  initialActive?: string[]
  labels: { filters: string; reset: string; close: string }
  search: React.ReactNode
  children: React.ReactNode
}) {
  const [active, setActive] = useState<string[]>(initialActive)
  const chips = (CHIP_SETS[locale] ?? CHIP_SETS.en).slice(0, chipCount)

  function toggle(chip: string) {
    setActive(prev => prev.includes(chip) ? prev.filter(v => v !== chip) : [...prev, chip])
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={
            <div className="flex flex-wrap items-start gap-2">
              {chips.map(chip => (
                <Button key={chip} size="xl"
                  variant={active.includes(chip) ? 'default' : 'outline'}
                  onClick={() => toggle(chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
          }
          search={search}
          activeCount={active.length}
          onReset={active.length > 0 ? () => setActive([]) : undefined}
          labels={labels}
        />
        {children}
      </div>
    </PageShell>
  )
}

// ── FilterBarDemoLabeled — active/available labeled sections ──────────────────
function FilterBarDemoLabeled({
  locale = 'en',
  initialActive = [],
  availableCount = 5,
  labels,
  search,
  children,
}: {
  locale?: string
  initialActive?: string[]
  availableCount?: number
  labels: { filters: string; reset: string; close: string }
  search: React.ReactNode
  children: React.ReactNode
}) {
  const [active, setActive] = useState<string[]>(initialActive)
  const allChips = CHIP_SETS[locale] ?? CHIP_SETS.en
  const l = SECTION_LABELS[locale] ?? SECTION_LABELS.en
  const availableChips = allChips.filter(c => !active.includes(c)).slice(0, availableCount)

  function toggle(chip: string) {
    setActive(prev => prev.includes(chip) ? prev.filter(v => v !== chip) : [...prev, chip])
  }

  const filtersNode = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {active.length > 0 ? l.active : l.noActive}
        </p>
        {active.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {active.map(chip => (
              <Button key={chip} size="xl" variant="default" onClick={() => toggle(chip)}>{chip}</Button>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {l.available}
        </p>
        <div className="flex flex-wrap gap-2">
          {availableChips.map(chip => (
            <Button key={chip} size="xl" variant="outline" onClick={() => toggle(chip)}>{chip}</Button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={filtersNode}
          search={search}
          activeCount={active.length}
          onReset={active.length > 0 ? () => setActive([]) : undefined}
          labels={labels}
        />
        {children}
      </div>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Desktop inline: chips + search + Reset. 2 pre-active. Click chips to toggle. Click Reset → active count goes to 0, Reset hidden.' } },
  },
  render: () => (
    <FilterBarDemo locale="en" chipCount={3} initialActive={['Sale', 'Studio']} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemo>
  ),
}

export const NoActiveFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: '0 active: no Badge, no Reset anywhere. Click any chip to activate — badge appears and count increments.' } },
  },
  render: () => (
    <FilterBarDemo locale="en" chipCount={4} initialActive={[]} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemo>
  ),
}

export const WithActiveFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: '3 of 5 chips pre-active. Badge count visible. Reset button shown. Click chips to toggle; click Reset to clear all.' } },
  },
  render: () => (
    <FilterBarDemo locale="en" chipCount={5} initialActive={['Sale', 'Studio', 'Commercial']} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemo>
  ),
}

export const SheetOpenMobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    docs: { description: { story: 'Mobile Sheet mode: 2 pre-active in labeled Active/Available sections. Open "Filters" trigger → Sheet shows sections. Click chips to toggle. Reset in footer clears all. Close ≥44px.' } },
  },
  render: () => (
    <FilterBarDemoLabeled locale="en" initialActive={['Sale', 'Studio']} availableCount={5} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemoLabeled>
  ),
}

export const ManyAvailableFewActive: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    docs: { description: { story: '9 options, 2 pre-active. Active vs available sections clearly separated. Click to toggle; Reset to clear.' } },
  },
  render: () => (
    <FilterBarDemoLabeled locale="en" initialActive={['Sale', 'Studio']} availableCount={7} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemoLabeled>
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: longest-locale stress. Long Ukrainian chip labels must not overflow. Sheet trigger + search stacked full-width. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <FilterBarDemo locale="uk" chipCount={5} initialActive={['Продаж', 'Студія', 'Оренда']} labels={LABELS_UK} search={SEARCH_UK}>
      {SAMPLE_CONTENT_UK}
    </FilterBarDemo>
  ),
}

export const ManyFilters: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: {
      description: {
        story:
          'Many filter chips (11): at desktop the cluster wraps into aligned rows ' +
          '(`flex-wrap items-start gap-2`); search and badge stay top-aligned with the ' +
          'first chip row (`sm:items-start` on outer container). ' +
          'Odd number of chips (11): last row is left-aligned, no scattered stragglers. ' +
          'At <lg: all chips collapse behind the Sheet trigger (Decision D1). ' +
          'Use viewport toolbar to verify 320/375/768/1280.',
      },
    },
  },
  render: () => (
    <FilterBarDemo locale="en" chipCount={11} initialActive={['Sale', 'Studio', 'Commercial']} labels={LABELS_EN} search={SEARCH_EN}>
      {SAMPLE_CONTENT}
    </FilterBarDemo>
  ),
}
