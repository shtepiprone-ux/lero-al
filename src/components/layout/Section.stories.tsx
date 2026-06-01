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
          'Tier-2 global layout primitive. Server-safe titled content block that sits inside a PageShell. Renders no container of its own. Optional title (h2) + description (p) with heading→body rhythm. See docs/design-system.md §5/§6/§7 (Task 345 DS-1).',
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

// ── Happy path ────────────────────────────────────────────────────────────────

export const WithTitleAndDescription: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="Available listings" description="Browse properties for rent and sale across Albania.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Negative: title only (AC-7) ───────────────────────────────────────────────

export const TitleOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="Available listings">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Negative: description only (AC-7) ────────────────────────────────────────

export const DescriptionOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section description="Browse properties for rent and sale across Albania.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Negative: no title, no description — children only, no empty wrapper (AC-7) ──

export const EmptyHeading: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section>
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Negative: uk@320 long-title wrap — must wrap, never overflow (AC-7) ──────

export const LongUkTitleMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
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

// ── Stacked sections — consumer space-y-* pattern ────────────────────────────

export const StackedSections: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-8">
        <Section title="First section" description="Consumer controls stacking via space-y-* on the shell children.">
          {SAMPLE_BLOCK}
        </Section>
        <Section title="Second section">
          {SAMPLE_BLOCK}
        </Section>
        <Section>
          {SAMPLE_BLOCK}
        </Section>
      </div>
    </PageShell>
  ),
}

// ── Inside narrow PageShell (reading column context) ─────────────────────────

export const InsideNarrowShell: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Narrow reading column" description="Section renders inside max-w-3xl at wide viewports.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Inside form PageShell ─────────────────────────────────────────────────────

export const InsideFormShell: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form column" description="Section renders inside max-w-xl centered column.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Albanian long-locale at 320px ─────────────────────────────────────────────

export const LongSqTitleMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'sq' },
  },
  render: () => (
    <PageShell>
      <Section
        title="Qira dhe shitje e pronave në Tiranë dhe në të gjithë Shqipërinë"
        description="Shfleto variantet e disponueshme të apartamenteve, shtëpive dhe pronave tregtare."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── className passthrough ─────────────────────────────────────────────────────

export const WithClassName: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <Section title="With custom className" className="bg-muted/20 p-4 rounded-lg">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}
