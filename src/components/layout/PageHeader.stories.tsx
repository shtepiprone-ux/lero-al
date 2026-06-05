'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from './PageHeader'
import { PageShell } from './PageShell'
import { Section } from './Section'
import { storyT } from '@/stories/_storyI18n'

const PH_KEY: Record<string, string> = {
  new_lst: 'new_listing', long_t: 'long_title', long_d: 'long_desc', browse_s: 'browse_short',
}
const ph2 = (k: string, l = 'en') => storyT(l, `storybook.pageheader.${PH_KEY[k] ?? k}`)

const meta: Meta<typeof PageHeader> = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive. Server-safe page-level header block (title + optional description/countBadge/action). Sits INSIDE a PageShell; owns no container. Action stacks below <md:, right-aligns md:+. All action buttons are interactive — clicking shows in-canvas feedback. Breakpoints via viewport toolbar; locales via locale toolbar. See docs/design-system.md §9/§6/§7 (Task 347 DS-2).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageHeader>

// ── Polished content mock — skeleton card rows, language-agnostic ─────────────
const CONTENT_MOCK = (
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

const sampleContent = (l: string) => (
  <Section title={ph2('listings', l)} description={ph2('browse_s', l)}>{CONTENT_MOCK}</Section>
)
const COUNT_BADGE = <Badge variant="secondary">142</Badge>

function dl(key: string, locale = 'en'): string {
  return storyT(locale, `storybook.pageheader.${key}`)
}

// ── ActionFeedback — locale-aware in-canvas feedback when an action is clicked ─
function ActionFeedback({ label, locale = 'en' }: { label: string | null; locale?: string }) {
  if (!label) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/40 text-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      <span className="text-muted-foreground">{dl('action', locale)}: </span>
      <strong>{label}</strong>
    </div>
  )
}

// ── PageHeaderStory — stateful wrapper with action feedback ───────────────────
function PageHeaderStory({
  action,
  title,
  description,
  countBadge,
  content,
  locale = 'en',
}: {
  action?: (on: (label: string) => void) => React.ReactNode
  title: string
  description?: string
  countBadge?: React.ReactNode
  content?: React.ReactNode
  locale?: string
}) {
  const [last, setLast] = useState<string | null>(null)
  return (
    <PageShell>
      <div className="space-y-4">
        <PageHeader
          title={title}
          description={description}
          countBadge={countBadge}
          action={action ? action(setLast) : undefined}
        />
        <ActionFeedback label={last} locale={locale} />
        {content ?? sampleContent(locale)}
      </div>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title={ph2("avail",l)} description={ph2("browse",l)} />
        {sampleContent(l)}
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

export const TitleOnly: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title={ph2("avail",l)} />
        {sampleContent(l)}
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

export const WithCountBadge: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title={ph2("avail",l)} description={ph2("browse",l)} countBadge={COUNT_BADGE} />
        {sampleContent(l)}
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

export const WithAction: Story = {
  parameters: {
    docs: { description: { story: 'Single action button in the action slot. size="xl" (44px). Click → in-canvas feedback. Action stacks below header at <md:, right-aligns at md:+.' } }
  },

  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageHeaderStory
      title={ph2("avail",l)}
      description={ph2("browse",l)}
      locale={l}
      action={(on) => (
        <Button size="xl" onClick={() => on(ph2("new_lst",l))}>{ph2("new_lst",l)}</Button>
      )}
    />
    )
  },

  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}

export const WithActions: Story = {
  parameters: {
    docs: { description: { story: 'Three-button action cluster in the action slot — plain flex-wrap div container. Click any button → feedback. At <md: buttons stack full-width.' } }
  },

  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageHeaderStory
      title={ph2('avail', l)}
      description={ph2('browse', l)}
      countBadge={COUNT_BADGE}
      locale={l}
      action={(on) => (
        <div className="flex flex-wrap gap-2">
          <Button size="xl" variant="outline" onClick={() => on(ph2('export',l))}>{ph2('export',l)}</Button>
          <Button size="xl" variant="outline" onClick={() => on(ph2('edit',l))}>{ph2('edit',l)}</Button>
          <Button size="xl" onClick={() => on(ph2('new_lst',l))}>{ph2('new_lst',l)}</Button>
        </div>
      )}
    />
    )
  },

  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}

export const LocaleStress: Story = {
  parameters: {
    docs: { description: { story: 'uk@320: long Ukrainian title + description + action. Title must wrap. Action must be full-width (max-md:w-full). Use viewport toolbar for other widths; locale toolbar for other locales.' } }
  },

  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? "en"
    return (
    <PageHeaderStory
      locale={l}
      title={ph2("long_t",l)}
      description={ph2("long_d",l)}
      action={(on) => (
        <Button size="xl" onClick={() => on(ph2("new_lst",l))}>{ph2("new_lst",l)}</Button>
      )}
      content={
        <Section title={ph2("listings",l)} description={ph2("browse_s",l)}>{CONTENT_MOCK}</Section>
      }
    />
    )
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
