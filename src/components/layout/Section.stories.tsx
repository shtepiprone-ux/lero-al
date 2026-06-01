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

// ── 14-width canonical coverage — preset widths not covered above ─────────────
// No-preset widths (560 / 680 / 810 / 960 / 1200): open any story in Storybook,
// use browser DevTools responsive mode to set the width manually, and toggle
// locale via the Storybook toolbar. Verify: title wraps, no horizontal overflow.

export const TitleAt375: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <Section
        title="Оренда та продаж нерухомості в Тирані — 375px"
        description="uk locale stress at mobile375; title must wrap, never overflow."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt390: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    globals: { locale: 'it' },
  },
  render: () => (
    <PageShell>
      <Section
        title="Affitto e vendita di immobili a Tirana — 390px"
        description="it locale at mobile390."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt480: Story = {
  parameters: { viewport: { defaultViewport: 'mobile480' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 480px" description="Phablet width; pre-sm: layout.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 768px" description="Tablet md: breakpoint; heading rhythm unchanged.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt1024: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1024' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 1024px" description="Desktop lg: breakpoint.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt1920: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1920' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 1920px" description="Huge desktop; content bounded by container-wide.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt2560: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 2560px" description="4K; container capped at 1408px, centered.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Canonical preset widths (560/680/810/960/1200) — added Task 350-Fix ──────

export const TitleAt560: Story = {
  parameters: { viewport: { defaultViewport: 'canonical560' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 560px" description="Below sm: (640px); pre-breakpoint band.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt680: Story = {
  parameters: { viewport: { defaultViewport: 'canonical680' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 680px" description="Above sm: (640px), below md: (768px).">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt810: Story = {
  parameters: { viewport: { defaultViewport: 'canonical810' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 810px" description="Above md: (768px), below lg: (1024px).">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt960: Story = {
  parameters: { viewport: { defaultViewport: 'canonical960' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 960px" description="Pre-lg: small desktop.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const TitleAt1200: Story = {
  parameters: { viewport: { defaultViewport: 'canonical1200' } },
  render: () => (
    <PageShell>
      <Section title="Available Listings — 1200px" description="Above lg: (1024px), below xl: (1280px).">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}
