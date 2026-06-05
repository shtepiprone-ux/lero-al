import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PageShell } from './PageShell'
import { Section } from './Section'
import { storyT } from '@/stories/_storyI18n'

const ps = (k: string, l = 'en') => storyT(l, `storybook.pageshell.${k}`)

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
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell>
      <Section title={ps('listings',l)} description={ps('browse',l)}>{SAMPLE_BLOCK}</Section>
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

export const Narrow: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="narrow">
      <Section title={ps('reading',l)} description={ps('reading_d',l)}>{SAMPLE_BLOCK}</Section>
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

export const Form: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell container="form">
      <Section title={ps('form',l)} description={ps('form_d',l)}>{SAMPLE_BLOCK}</Section>
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

export const AsDiv: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell as="div">
      <Section title={ps('avail',l)}>{SAMPLE_BLOCK}</Section>
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

export const ClassNameMerge: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
    <PageShell className="py-4">
      <Section title={ps('search_r',l)}>{SAMPLE_BLOCK}</Section>
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
    docs: { description: { story: '@320: long title wraps without overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for all widths.' } }
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

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
