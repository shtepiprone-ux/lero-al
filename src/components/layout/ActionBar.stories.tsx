import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionBar } from './ActionBar'
import { PageHeader } from './PageHeader'
import { PageShell } from './PageShell'
import { Section } from './Section'

const meta: Meta<typeof ActionBar> = {
  title: 'Layout/ActionBar',
  component: ActionBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive. Server-safe page-level action cluster. Layout-only — no child mutation. ' +
          'ONE-SHARED-HEIGHT CONTRACT: all Button children MUST use size="xl" (h-11 = 44px) per ui-rules.md §15 / ' +
          'docs/design-system.md §11.4. Icon-only actions use size="icon-xl" (also 44px). ' +
          'Action cluster stacks (flex-col, full-width buttons) at <md:, right-aligns md:+. ' +
          'Never overflow-x-auto — toolbars wrap. (Task 348 DS-3)',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ActionBar>

const SAMPLE_CONTENT = (
  <Section title="Search results">
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
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const ManyActionsDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Export</Button>
          <Button size="xl" variant="outline">Import</Button>
          <Button size="xl" variant="outline">Archive</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: single action (AC-7) ───────────────────────────────────────────

export const SingleAction: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: stacked at 320px (AC-7) ────────────────────────────────────────

export const StackedMobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: 5 long-label uk buttons at 320px — must wrap, never scroll (AC-7) ──

export const ManyActionsWrappedUk320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Скасувати та вийти</Button>
          <Button size="xl" variant="outline">Редагувати</Button>
          <Button size="xl" variant="outline">Видалити</Button>
          <Button size="xl" variant="outline">Архівувати</Button>
          <Button size="xl">Зберегти зміни</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: uk long labels at 480px — pre-sm reflow band (AC-7) ─────────────

export const LongLabelsUk480: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile480' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Скасувати та вийти</Button>
          <Button size="xl" variant="outline">Опублікувати оголошення</Button>
          <Button size="xl">Зберегти зміни</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: sq long labels at 320px (AC-7) ─────────────────────────────────

export const LongLabelsSq320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'sq' },
  },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Anulo dhe dil</Button>
          <Button size="xl" variant="outline">Publiko njoftimin</Button>
          <Button size="xl">Ruaj ndryshimet</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: align="start" — left-aligned at md:+ (AC-7) ────────────────────

export const AlignStart: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar align="start">
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: end-aligned at 2560px — cluster stays at right edge, not stranded (AC-7) ──

export const AlignEndDesktop2560: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: start-aligned at 2560px (AC-7) ─────────────────────────────────

export const AlignStartDesktop2560: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar align="start">
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
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
        <ActionBar className="mt-4">
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save — className=mt-4 merged</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Negative: as="nav" renders nav root ──────────────────────────────────────

export const AsNav: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar as="nav">
          <Button size="xl" variant="outline">Back</Button>
          <Button size="xl">Next Step</Button>
        </ActionBar>
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
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Golden path: inside PageHeader action slot at desktop ─────────────────────

export const InsidePageHeader: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          countBadge={<Badge variant="secondary">142</Badge>}
          action={
            <ActionBar>
              <Button size="xl" variant="outline">Edit</Button>
              <Button size="xl">New Listing</Button>
            </ActionBar>
          }
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Golden path: inside PageHeader at mobile 375px — action stacks below title ─

export const InsidePageHeaderMobile375: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Available Listings"
          description="Browse properties for rent and sale across Albania."
          action={
            <ActionBar>
              <Button size="xl" variant="outline">Cancel</Button>
              <Button size="xl">New Listing</Button>
            </ActionBar>
          }
        />
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── 14-width canonical coverage — preset widths not covered above ─────────────
// No-preset widths (560 / 680 / 810 / 960 / 1200): open any story above in
// Storybook, use browser DevTools responsive mode to set the width manually.
// Critical: verify stacking at <md: and inline row at md:+ (768px boundary).

export const StackedAt390: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineAt768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineAt1024: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1024' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

// ── Canonical preset widths (560/680/810/960/1200) — added Task 350-Fix ──────

export const StackedAt560: Story = {
  parameters: { viewport: { defaultViewport: 'canonical560' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const StackedAt680: Story = {
  parameters: { viewport: { defaultViewport: 'canonical680' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineAt810: Story = {
  parameters: { viewport: { defaultViewport: 'canonical810' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">Save Changes</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineAt960: Story = {
  parameters: { viewport: { defaultViewport: 'canonical960' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}

export const InlineAt1200: Story = {
  parameters: { viewport: { defaultViewport: 'canonical1200' } },
  render: () => (
    <PageShell>
      <div className="space-y-6">
        <ActionBar>
          <Button size="xl" variant="outline">Cancel</Button>
          <Button size="xl" variant="outline">Edit</Button>
          <Button size="xl">New Listing</Button>
        </ActionBar>
        {SAMPLE_CONTENT}
      </div>
    </PageShell>
  ),
}
