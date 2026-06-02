import type { Meta, StoryObj } from '@storybook/react'
import { PageShell } from './PageShell'
import { Section } from './Section'

const meta: Meta<typeof PageShell> = {
  title: 'Layout/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive. Server-safe outermost public/cabinet page content wrapper. Provides container-wide (≤1408px) with optional narrow (max-w-3xl) or form (max-w-xl) inner column. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/design-system.md §4/§5/§7 (Task 345 DS-1).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageShell>

const SAMPLE_BLOCK = (
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

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="Listings" description="Browse available properties">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Reading column" description="Bounded to max-w-3xl, centered inside container-wide.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const Form: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form column" description="Bounded to max-w-xl, centered inside container-wide.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const AsDiv: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell as="div">
      <Section title="Available listings">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const ClassNameMerge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell className="py-4">
      <Section title="Search results">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long Ukrainian title must wrap without overflow. Container padding scales. Use locale toolbar for other locales; viewport toolbar for other widths (320→2560).' } },
  },
  render: () => (
    <PageShell>
      <Section
        title="Оренда та продаж нерухомості в Тирані та по всій Албанії"
        description="Перегляньте доступні варіанти квартир, будинків та комерційної нерухомості."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}
