import type { Meta, StoryObj } from '@storybook/react'
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
          'Tier-2 global layout primitive. Server-safe page-level header block (title + optional description/countBadge/action). Sits INSIDE a PageShell; owns no container. Action stacks below <md:, right-aligns md:+. See docs/design-system.md §9/§6/§7 (Task 347 DS-2).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageHeader>

// ── Canonical slot fixtures ───────────────────────────────────────────────────

const ACTION = <Button>New Listing</Button>

// 3-button cluster used for the 320px and 2560px action-cluster stress stories
const ACTION_CLUSTER = (
  <div className="flex flex-wrap gap-2">
    <Button variant="outline">Export</Button>
    <Button variant="outline">Edit</Button>
    <Button>New Listing</Button>
  </div>
)

const COUNT_BADGE = <Badge variant="secondary">142</Badge>

const SAMPLE_CONTENT = (
  <Section title="Listings" description="Browse available properties">
    <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
      Page content area
    </div>
  </Section>
)

// ── Happy path ────────────────────────────────────────────────────────────────

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

export const WithAction: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          action={ACTION}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const FullHeader: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          countBadge={COUNT_BADGE}
          action={ACTION}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: title only (AC-6) ───────────────────────────────────────────────

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

// ── Negative: title + countBadge (AC-6) ───────────────────────────────────────

export const TitleWithCountBadge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader title="Available Listings" countBadge={COUNT_BADGE} />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: 3-button action cluster stacked at 320px — no overflow (AC-6) ──

export const ActionStacked320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: 3-button cluster right-aligned at 2560px — not stranded (AC-6) ─

export const ActionAlignedDesktop2560: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: uk@320 long-title wrap — must wrap, never overflow (AC-6) ──────

export const LongUkTitleMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Оренда та продаж нерухомості в Тирані та по всій Албанії — повний каталог"
          description="Перегляньте доступні варіанти квартир, будинків та комерційної нерухомості з детальними описами."
          action={ACTION}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: countBadge + long uk title at 320px — badge must not push overflow (AC-6) ──

export const CountBadgeUkMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Оренда та продаж нерухомості в Тирані та по всій Албанії"
          countBadge={COUNT_BADGE}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: Albanian long-locale at 320px ───────────────────────────────────

export const LongSqTitleMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'sq' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Qira dhe shitje e pronave në Tiranë dhe në të gjithë Shqipërinë"
          description="Shfleto variantet e disponueshme të apartamenteve, shtëpive dhe pronave tregtare."
          action={ACTION}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: as="div" renders div root (AC-6) ────────────────────────────────

export const AsDiv: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          as="div"
          title="Available Listings — as=div root element"
          description="Root element is a div, not a header."
          action={ACTION}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: className merge — defaults must survive the override ────────────

export const ClassNameMerge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — className=mb-2 merged"
          description="Flex layout classes must be retained alongside the extra className."
          action={ACTION}
          className="mb-2"
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Huge desktop 1920px (waste guard) ────────────────────────────────────────

export const HugeDesktop1920: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1920' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings at 1920px"
          description="Action must remain right-aligned; title must not stretch awkwardly."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Golden path: inside PageShell at standard desktop ─────────────────────────

export const InsidePageShell: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        <Section title="Search results" description="Showing 142 listings">
          <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Listing grid here
          </div>
        </Section>
      </div>
    </PageShell>
  ),
}

// ── Golden path: inside PageShell at mobile 375px ─────────────────────────────

export const InsidePageShellMobile375: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          action={ACTION}
        />
        <Section title="Search results">
          <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
            Listing grid here
          </div>
        </Section>
      </div>
    </PageShell>
  ),
}

// ── 14-width canonical coverage — preset widths not covered above ─────────────
// No-preset widths (560 / 680 / 810 / 960 / 1200): open any story above in
// Storybook, use browser DevTools responsive mode to set the width manually.
// Critical: verify action stacks below title at <md: and goes inline at md:+ (768px).

export const ActionStackedAt390: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 390px"
          description="Action stacks below title at <md: widths."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ActionStackedAt480: Story = {
  parameters: { viewport: { defaultViewport: 'mobile480' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 480px"
          description="Action still stacks at 480px (below md: 768px boundary)."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ActionInlineAt768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 768px"
          description="md: boundary — action switches from stacked to inline row."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const DesktopAt1024: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1024' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 1024px"
          description="lg: breakpoint; action fully inline, right-aligned."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Canonical preset widths (560/680/810/960/1200) — added Task 350-Fix ──────

export const ActionStackedAt560: Story = {
  parameters: { viewport: { defaultViewport: 'canonical560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 560px"
          description="Below sm: (640px); action stacks (<md: 768px boundary)."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ActionStackedAt680: Story = {
  parameters: { viewport: { defaultViewport: 'canonical680' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 680px"
          description="Above sm: (640px), below md: (768px); action still stacks."
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ActionInlineAt810: Story = {
  parameters: { viewport: { defaultViewport: 'canonical810' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 810px"
          description="Above md: (768px); action is inline row."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ActionInlineAt960: Story = {
  parameters: { viewport: { defaultViewport: 'canonical960' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 960px"
          description="Pre-lg: desktop; action inline, right-aligned."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const DesktopAt1200: Story = {
  parameters: { viewport: { defaultViewport: 'canonical1200' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings — 1200px"
          description="Above lg: (1024px), below xl: (1280px); full desktop layout."
          countBadge={COUNT_BADGE}
          action={ACTION_CLUSTER}
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}
