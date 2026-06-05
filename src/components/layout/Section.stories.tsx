import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './Section'
import { PageShell } from './PageShell'
import { storyT } from '@/stories/_storyI18n'

const st = (k: string, l = 'en') => storyT(l, `storybook.section.${k}`)

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
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('avail',l)} description={st('browse',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const TitleOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('avail',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const DescriptionOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section description={st('browse',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
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
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <div className="space-y-8">
        <Section title={st('first',l)} description={st('consumer',l)}>{SAMPLE_BLOCK}</Section>
        <Section title={st('second',l)}>{SAMPLE_BLOCK}</Section>
        <Section>{SAMPLE_BLOCK}</Section>
      </div>
    </PageShell>
    )
  },
}

export const InsideNarrow: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="narrow">
      <Section title={st('narrow',l)} description={st('narrow_d',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const InsideForm: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="form">
      <Section title={st('form',l)} description={st('form_d',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: long title + description wrap without overflow. Use locale toolbar for sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('long_t', l)} description={st('long_d', l)}>
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
    )
  },
}
