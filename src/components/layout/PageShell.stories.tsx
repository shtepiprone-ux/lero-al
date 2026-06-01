import type { Meta, StoryObj } from '@storybook/react'
import { PageShell } from './PageShell'
import { Section } from './Section'

const meta: Meta<typeof PageShell> = {
  title: 'Layout/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tier-2 global layout primitive. Server-safe outermost public/cabinet page content wrapper. Provides container-wide (≤1408px) with optional narrow (max-w-3xl) or form (max-w-xl) inner column. See docs/design-system.md §4/§5/§7 (Task 345 DS-1).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageShell>

const SAMPLE_BLOCK = (
  <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
    Page content area
  </div>
)

const WIDE_CONTENT = (
  <Section title="Listings" description="Browse available properties">
    {SAMPLE_BLOCK}
  </Section>
)

// ── Happy path ────────────────────────────────────────────────────────────────

export const WideDefault: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const NarrowDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Reading column" description="Bounded to max-w-3xl, centered inside container-wide.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const FormDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form column" description="Bounded to max-w-xl, centered inside container-wide.">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Narrow/form at 320px (AC-7: no wasted side gutters that clip content) ────

export const NarrowMobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Narrow at 320px">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const FormMobile320: Story = {
  parameters: { viewport: { defaultViewport: 'mobile320' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form at 320px">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Narrow/form at 2560px (AC-7: centered, not full-bleed) ───────────────────

export const NarrowUltrawide: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell container="narrow">
      <Section title="Narrow at 2560px — balanced margins, not full-bleed">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

export const FormUltrawide: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell container="form">
      <Section title="Form at 2560px — balanced margins, not full-bleed">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Wide at 2560px (container cap validation) ────────────────────────────────

export const WideUltrawide: Story = {
  parameters: { viewport: { defaultViewport: 'desktop2560' } },
  render: () => (
    <PageShell>
      <Section title="Wide at 2560px — capped at 1408px, centered">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── as="div" variant (AC: negative flow) ────────────────────────────────────

export const AsDiv: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell as="div">
      <Section title="as=div root element">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── className merge (AC: container-wide must survive after className override) ─

export const ClassNameMerge: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <PageShell className="py-4">
      <Section title="className=py-4 merged — container-wide class retained">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Ukrainian long-locale at 320px ────────────────────────────────────────────

export const LongUkrainianMobile320: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
  },
  render: () => (
    <PageShell>
      <Section
        title="Оренда та продаж нерухомості в Тирані та по всій Албанії"
        description="Перегляньте доступні варіанти квартир, будинків та комерційної нерухомості."
      >
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── Wide at 1920px (HUGE_DESKTOP waste-guard) ────────────────────────────────

export const WideHugeDesktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1920' } },
  render: () => (
    <PageShell>
      <Section title="Wide at 1920px — container still at 1408px cap">
        {SAMPLE_BLOCK}
      </Section>
    </PageShell>
  ),
}

// ── 14-width canonical coverage — preset widths not covered above ─────────────
// Each story below targets one missing canonical viewport preset.
// No-preset widths (560 / 680 / 810 / 960 / 1200): open any story in Storybook
// Canvas, then use browser DevTools responsive mode (Chrome F12 → device toolbar)
// or resize the browser window to each width. Toggle locale via the Storybook
// toolbar (sq / en / uk / it) and verify: no horizontal overflow; container padding
// scales; content wraps correctly.

export const WideAt375: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt390: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt480: Story = {
  parameters: { viewport: { defaultViewport: 'mobile480' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const DesktopAt1024: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1024' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

// ── Canonical preset widths (560/680/810/960/1200) — added Task 350-Fix ──────

export const WideAt560: Story = {
  parameters: { viewport: { defaultViewport: 'canonical560' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt680: Story = {
  parameters: { viewport: { defaultViewport: 'canonical680' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt810: Story = {
  parameters: { viewport: { defaultViewport: 'canonical810' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt960: Story = {
  parameters: { viewport: { defaultViewport: 'canonical960' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}

export const WideAt1200: Story = {
  parameters: { viewport: { defaultViewport: 'canonical1200' } },
  render: () => <PageShell>{WIDE_CONTENT}</PageShell>,
}
