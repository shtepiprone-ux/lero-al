import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Section } from './Section'
import { PageShell } from './PageShell'
import { storyT } from '@/stories/_storyI18n'

const st = (k: string, l = 'en') => storyT(l, `storybook.section.${k}`)

function sampleBlock(locale: string) {
  return (
    <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
      {st('sample', locale)}
    </div>
  )
}

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

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const WithTitleAndDescription: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('avail',l)} description={st('browse',l)}>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const TitleOnly: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('avail',l)}>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const DescriptionOnly: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section description={st('browse',l)}>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const EmptyHeading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const Stacked: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <div className="space-y-8">
        <Section title={st('first',l)} description={st('consumer',l)}>{sampleBlock(l)}</Section>
        <Section title={st('second',l)}>{sampleBlock(l)}</Section>
        <Section>{sampleBlock(l)}</Section>
      </div>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const InsideNarrow: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="narrow">
      <Section title={st('narrow',l)} description={st('narrow_d',l)}>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const InsideForm: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="form">
      <Section title={st('form',l)} description={st('form_d',l)}>{sampleBlock(l)}</Section>
    </PageShell>
    )
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  },
}

export const LocaleStress: Story = {
  parameters: {
    docs: { description: { story: '@320: long title + description wrap without overflow. Use locale toolbar for sq/en/uk/it.' } }
  },

  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={st('long_t', l)} description={st('long_d', l)}>
        {sampleBlock(l)}
      </Section>
    </PageShell>
    )
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
