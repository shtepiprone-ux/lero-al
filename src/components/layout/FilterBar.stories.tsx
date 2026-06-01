import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
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
          '`flex flex-wrap items-center gap-2`; at lg:+ all filters render inline; at <lg: all filters ' +
          'collapse behind a single "Filters" Sheet trigger (Decision D1 all-or-nothing). ' +
          'Active-filter count Badge + single global Reset render only when activeCount > 0. ' +
          'At lg:+ Badge + Reset are inline end-aligned; at <lg: Badge is on the trigger, Reset in SheetFooter (Decision D2). ' +
          'Search slot is always in the row (min-w-0 flex-1). ' +
          'All user-facing text via `labels` prop — zero literal strings. No overflow-x-auto. ' +
          '(Task 349 DS-4)',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof FilterBar>

// ── Label fixtures per locale ─────────────────────────────────────────────────
const LABELS_EN = { filters: 'Filters', reset: 'Reset all', close: 'Close filters' }
const LABELS_SQ = { filters: 'Filtrat', reset: 'Pastro të gjitha', close: 'Mbyll filtrat' }
const LABELS_UK = { filters: 'Фільтри', reset: 'Скинути всі', close: 'Закрити фільтри' }
const LABELS_IT = { filters: 'Filtri', reset: 'Azzera tutto', close: 'Chiudi filtri' }

// ── Sample filter chips (opaque to FilterBar) ─────────────────────────────────
function FilterChips({ count = 3, locale = 'en' }: { count?: number; locale?: string }) {
  const chipSets: Record<string, string[]> = {
    en: ['Sale', 'Rent', 'Commercial', 'Studio', '2-br', '3-br', '4-br', '5-br', '6+', 'Office', 'Land'],
    sq: ['Shitje', 'Qira', 'Komerciale', 'Studio', '2-dh', '3-dh', '4-dh', '5-dh', '6+', 'Zyrë', 'Tokë'],
    uk: ['Продаж', 'Оренда', 'Комерційна', 'Студія', '2 кімнати', '3 кімнати', '4 кімнати', '5 кімнат', '6+', 'Офіс', 'Земля'],
    it: ['Vendita', 'Affitto', 'Commerciale', 'Monolocale', '2 locali', '3 locali', '4 locali', '5 locali', '6+', 'Ufficio', 'Terreno'],
  }
  const chips = chipSets[locale] ?? chipSets.en
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.slice(0, count).map((label) => (
        <Button key={label} size="sm" variant="outline">{label}</Button>
      ))}
    </div>
  )
}

// ── Sample search input ───────────────────────────────────────────────────────
const SEARCH_EN = <Input placeholder="Search listings..." type="search" />
const SEARCH_UK = <Input placeholder="Пошук оголошень..." type="search" />
const SEARCH_SQ = <Input placeholder="Kërko njoftimi..." type="search" />
const SEARCH_IT = <Input placeholder="Cerca annunci..." type="search" />

// ── Shared page wrapper ───────────────────────────────────────────────────────
const SAMPLE_CONTENT = (
  <Section title="Search results">
    <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      Page content area
    </div>
  </Section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ── Happy path — positive flows ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// AC-1, AC-2, AC-3: desktop inline layout, 3 filters, search, 2 active → Badge + Reset inline
export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={3} />}
          search={SEARCH_EN}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// AC-3: lg boundary — inline at exactly 1024px
export const DesktopLgBoundary1024: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1024' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={5} />}
          search={SEARCH_EN}
          activeCount={3}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// AC-9: 2560px waste guard — inline mode, filters + search + reset, no stretch
export const Desktop2560: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} />}
          search={SEARCH_EN}
          activeCount={1}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// AC-9: 1920px wide monitor
export const Desktop1920: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1920' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} />}
          search={SEARCH_EN}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: zero active (AC-2, AC-10) — no Badge, no Reset anywhere ─────────
// ═══════════════════════════════════════════════════════════════════════════════

export const ZeroActiveDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={3} />}
          search={SEARCH_EN}
          activeCount={0}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ZeroActiveMobile: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={3} />}
          search={SEARCH_EN}
          activeCount={0}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: 10+ filters at <lg: — Sheet collapse (AC-3, AC-10) ─────────────
// ═══════════════════════════════════════════════════════════════════════════════

// 10+ filters at 768 — trigger visible, row must not overflow
export const ManyFilters10PlusAt768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={10} />}
          search={SEARCH_EN}
          activeCount={4}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// 10+ filters at 390 — trigger visible, row must not overflow
export const ManyFilters10PlusAt390: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={10} />}
          search={SEARCH_EN}
          activeCount={4}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: uk@320 longest-locale overflow stress (AC-10, AC-15) ────────────
// ═══════════════════════════════════════════════════════════════════════════════

// MANDATORY: "Фільтри"/"Скинути всі" + long chip labels at 320 must wrap/fit, no horizontal overflow
export const UkLongLabels320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={5} locale="uk" />}
          search={SEARCH_UK}
          activeCount={3}
          onReset={fn()}
          labels={LABELS_UK}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// uk at 375 (common iPhone)
export const UkLongLabels375: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={5} locale="uk" />}
          search={SEARCH_UK}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_UK}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: search-only — no filters (AC-10) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Search input alone fills the row (min-w-0 flex-1); no empty chip area; Sheet trigger shown on mobile
export const SearchOnlyDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<div />}
          search={SEARCH_EN}
          activeCount={0}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const SearchOnlyMobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<div />}
          search={SEARCH_EN}
          activeCount={0}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: Reset interaction (AC-10) — clicking Reset calls onReset ─────────
// ═══════════════════════════════════════════════════════════════════════════════

// onReset is an action arg (fn()). Clicking Reset at lg:+ calls it inline; at <lg: opens Sheet → Reset
export const ResetInteractionDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  args: { onReset: fn() },
  render: (args) => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} />}
          search={SEARCH_EN}
          activeCount={3}
          onReset={args.onReset}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// Reset in SheetFooter at mobile — user opens Sheet then clicks Reset
export const ResetInteractionMobile390: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  args: { onReset: fn() },
  render: (args) => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={5} />}
          search={SEARCH_EN}
          activeCount={2}
          onReset={args.onReset}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: Sheet open at 320 — full-height, close ≥44px, no horizontal overflow (AC-10)
// ═══════════════════════════════════════════════════════════════════════════════

// User clicks the "Filters" trigger → Sheet slides in from left; content reachable; close button ≥44px
export const SheetOpenAt320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={6} />}
          search={SEARCH_EN}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_EN}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Negative: className merge (AC-1) ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const ClassNameMerge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={3} />}
          search={SEARCH_EN}
          activeCount={1}
          onReset={fn()}
          labels={LABELS_EN}
          className="mb-4 rounded-lg border p-3"
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Locale variants — sq/it/uk inline at desktop (AC-9, AC-15) ───────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const InlineSq1440: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    globals: { locale: 'sq' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} locale="sq" />}
          search={SEARCH_SQ}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_SQ}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineIt1440: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    globals: { locale: 'it' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} locale="it" />}
          search={SEARCH_IT}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_IT}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineUk1440: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} locale="uk" />}
          search={SEARCH_UK}
          activeCount={3}
          onReset={fn()}
          labels={LABELS_UK}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Mobile locale variants at 375px ──────────────────────────────────────────

export const MobileSq375: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    globals: { locale: 'sq' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} locale="sq" />}
          search={SEARCH_SQ}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_SQ}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const MobileIt375: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    globals: { locale: 'it' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <FilterBar
          filters={<FilterChips count={4} locale="it" />}
          search={SEARCH_IT}
          activeCount={2}
          onReset={fn()}
          labels={LABELS_IT}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}
