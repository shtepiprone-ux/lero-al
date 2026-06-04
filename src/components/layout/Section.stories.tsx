import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './Section'
import { PageShell } from './PageShell'


const SECTION_TEXT: Record<string, Record<string, string>> = {
  avail:    { en: 'Available listings',   sq: 'Njoftimet e disponueshme',  uk: 'Доступні оголошення',       it: 'Annunci disponibili' },
  browse:   { en: 'Browse properties for rent and sale across Albania.', sq: 'Kerkoni prona me qira dhe shitje ne te gjitha Shqiperine.', uk: 'Perehliadaite nerukhomist v orendu ta na prodazh po vsii Albanii.', it: 'Cerca proprieta in affitto e in vendita in tutta l Albania.' },
  first:    { en: 'First section',        sq: 'Seksioni i pare',           uk: 'Pershyi rozdil',            it: 'Prima sezione' },
  second:   { en: 'Second section',       sq: 'Seksioni i dyte',           uk: 'Druhyi rozdil',             it: 'Seconda sezione' },
  narrow:   { en: 'Narrow reading column', sq: 'Kolona e ngushtë e leximit', uk: 'Vuzka kolonka chytannia', it: 'Colonna di lettura stretta' },
  narrow_d: { en: 'Section renders inside max-w-3xl at wide viewports.', sq: 'Seksioni brenda max-w-3xl.', uk: 'Rozdil u max-w-3xl.', it: 'La sezione dentro max-w-3xl.' },
  form:     { en: 'Form column',          sq: 'Kolona e formularit',       uk: 'Kolonka formy',             it: 'Colonna modulo' },
  form_d:   { en: 'Section renders inside max-w-xl centered column.', sq: 'Seksioni brenda max-w-xl.', uk: 'Rozdil u max-w-xl.', it: 'La sezione dentro max-w-xl.' },
  long_t:   { en: 'Available real estate listings for rent and sale across Albania — full catalogue', sq: 'Njoftime te disponueshme per qira dhe shitje ne Shqiperi — katalog i plote', uk: 'Orenda ta prodazh nerukhomost v Tyrani ta po vsii Albanii — povnyi kataloh', it: 'Annunci immobiliari disponibili per affitto e vendita in tutta l Albania' },
  long_d:   { en: 'Browse available apartments, houses and commercial properties with detailed descriptions.', sq: 'Shfletoni pronat e disponueshme me pershkrime te detajuara.', uk: 'Perehriaite dostupni kvartyrni budynky ta komertsiinu nerukhomist.', it: 'Sfoglia appartamenti case e proprieta commerciali con descrizioni dettagliate.' },
  consumer: { en: 'Consumer controls stacking via space-y-* on the shell children.', sq: 'Kontrolli i radhitjes.', uk: 'Keruvannia hrarkhiieiu cherez space-y-*.', it: 'Controllo dello stacking tramite space-y-*.' },
}
const st = (k: string, l = 'en') => SECTION_TEXT[k]?.[l] ?? SECTION_TEXT[k]?.en ?? k

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
