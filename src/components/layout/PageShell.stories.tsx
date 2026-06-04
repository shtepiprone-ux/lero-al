import type { Meta, StoryObj } from '@storybook/react'
import { PageShell } from './PageShell'
import { Section } from './Section'


const PS_TEXT: Record<string, Record<string, string>> = {
  listings: { en: 'Listings',                   sq: 'Njoftimet',                  uk: 'Оголошення',                  it: 'Annunci' },
  browse:   { en: 'Browse available properties', sq: 'Shfleto pronat e disponueshme', uk: 'Переглянути доступну нерухомість', it: 'Sfoglia le proprietà disponibili' },
  reading:  { en: 'Reading column',             sq: 'Kolona e leximit',           uk: 'Колонка читання',             it: 'Colonna di lettura' },
  reading_d:{ en: 'Bounded to max-w-3xl, centered inside container-wide.', sq: 'E kufizuar ne max-w-3xl.', uk: 'Obmezhennia do max-w-3xl.', it: 'Limitata a max-w-3xl.' },
  form:     { en: 'Form column',                sq: 'Kolona e formularit',        uk: 'Колонка форми',               it: 'Colonna modulo' },
  form_d:   { en: 'Bounded to max-w-xl, centered inside container-wide.', sq: 'E kufizuar ne max-w-xl.', uk: 'Obmezhennia do max-w-xl.', it: 'Limitata a max-w-xl.' },
  avail:    { en: 'Available listings',         sq: 'Njoftimet e disponueshme',   uk: 'Доступні оголошення',         it: 'Annunci disponibili' },
  search_r: { en: 'Search results',             sq: 'Rezultate te kerkimit',      uk: 'Результати пошуку',           it: 'Risultati ricerca' },
  long_t:   { en: 'Available real estate for rent and sale across Albania', sq: 'Njoftime per qira dhe shitje ne Shqiperi', uk: 'Orenda ta prodazh nerukhomost v Albanii', it: 'Immobili disponibili per affitto e vendita in Albania' },
  long_d:   { en: 'Browse available apartments, houses and commercial properties.', sq: 'Shfletoni pronat e disponueshme.', uk: 'Perehliadte dostupni kvartyrny budynky ta komertsiinu nerukhomist.', it: 'Sfoglia appartamenti case e proprieta commerciali.' },
}
const ps = (k: string, l = 'en') => PS_TEXT[k]?.[l] ?? PS_TEXT[k]?.en ?? k

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
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={ps('listings',l)} description={ps('browse',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="narrow">
      <Section title={ps('reading',l)} description={ps('reading_d',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const Form: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="form">
      <Section title={ps('form',l)} description={ps('form_d',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const AsDiv: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell as="div">
      <Section title={ps('avail',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const ClassNameMerge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell className="py-4">
      <Section title={ps('search_r',l)}>{SAMPLE_BLOCK}</Section>
    </PageShell>
    )
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: long title wraps without overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for all widths.' } },
  },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={ps('long_t', l)} description={ps('long_d', l)}>
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
    )
  },
}
