'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from './PageHeader'
import { PageShell } from './PageShell'
import { Section } from './Section'

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

const SAMPLE_CONTENT = <Section title="Listings" description="Browse available properties">{CONTENT_MOCK}</Section>
const COUNT_BADGE = <Badge variant="secondary">142</Badge>

// ── Story-level demo feedback labels (Storybook-only, not production copy) ────
const DL: Record<string, Record<string, string>> = {
  action: { en: 'Action', sq: 'Veprimi', uk: 'Дія', it: 'Azione' },
}
function dl(key: string, locale = 'en'): string {
  return DL[key]?.[locale] ?? DL[key]?.en ?? key
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
        {content ?? SAMPLE_CONTENT}
      </div>
    </PageShell>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title="Available Listings" description="Browse properties for rent and sale across Albania." />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const TitleOnly: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title="Available Listings" />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const WithCountBadge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title="Available Listings" description="Browse properties for rent and sale across Albania." countBadge={COUNT_BADGE} />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const WithAction: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Single action button in the action slot. size="xl" (44px). Click → in-canvas feedback. Action stacks below header at <md:, right-aligns at md:+.' } },
  },
  render: () => (
    <PageHeaderStory
      title="Available Listings"
      description="Browse properties for rent and sale across Albania."
      action={(on) => (
        <Button size="xl" onClick={() => on('New Listing')}>New Listing</Button>
      )}
    />
  ),
}

export const WithActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Three-button action cluster in the action slot — plain flex-wrap div container. Click any button → feedback. At <md: buttons stack full-width.' } },
  },
  render: () => (
    <PageHeaderStory
      title="Available Listings"
      description="Browse properties for rent and sale across Albania."
      countBadge={COUNT_BADGE}
      action={(on) => (
        <div className="flex flex-wrap gap-2">
          <Button size="xl" variant="outline" onClick={() => on('Export')}>Export</Button>
          <Button size="xl" variant="outline" onClick={() => on('Edit')}>Edit</Button>
          <Button size="xl" onClick={() => on('New Listing')}>New Listing</Button>
        </div>
      )}
    />
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long Ukrainian title + description + action. Title must wrap. Action must be full-width (max-md:w-full). Use viewport toolbar for other widths; locale toolbar for other locales.' } },
  },
  render: () => (
    <PageHeaderStory
      locale="uk"
      title="Оренда та продаж нерухомості в Тирані та по всій Албанії — повний каталог"
      description="Перегляньте доступні варіанти квартир, будинків та комерційної нерухомості з детальними описами."
      action={(on) => (
        <Button size="xl" onClick={() => on('Нове оголошення')}>Нове оголошення</Button>
      )}
      content={
        <Section title="Оголошення" description="Перегляд доступної нерухомості">{CONTENT_MOCK}</Section>
      }
    />
  ),
}
