import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './Section'
import { PageShell } from './PageShell'

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive. Server-safe titled content block that sits inside a PageShell. Renders no container of its own. Optional title (h2) + description (p) with heading→body rhythm. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/design-system.md §5/§6/§7 (Task 345 DS-1).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Section>

const SAMPLE_BLOCK = (
  <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
    Section body content
  </div>
)

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const WithTitleAndDescription: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="Available listings" description="Browse properties for rent and sale across Albania.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const TitleOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="Available listings">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const DescriptionOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section description="Browse properties for rent and sale across Albania.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const EmptyHeading: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section>{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const Stacked: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-8">
        <Section title="First section" description="Consumer controls stacking via space-y-* on the shell children.">{SAMPLE_BLOCK}</Section>
        <Section title="Second section">{SAMPLE_BLOCK}</Section>
        <Section>{SAMPLE_BLOCK}</Section>
      </div>
    </PageShell>
  ),
}

export const InsideNarrow: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Narrow reading column" description="Section renders inside max-w-3xl at wide viewports.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const InsideForm: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form column" description="Section renders inside max-w-xl centered column.">{SAMPLE_BLOCK}</Section>
    </PageShell>
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long Ukrainian title + description must wrap without overflow. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => (
    <PageShell>
      <Section
        title="Оренда та продаж нерухомості в Тирані та по всій Албанії — повний каталог"
        description="Перегляньте доступні варіанти квартир, будинків та комерційної нерухомості з детальними описами та фотографіями."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}
