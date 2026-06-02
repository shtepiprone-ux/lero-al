'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Canonical button. Always use this instead of raw `<button>`. ' +
          'All buttons in stories are interactive — clicking shows in-canvas feedback. ' +
          'See docs/ui-rules.md §3 for size/variant governance.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-xl', 'icon-sm', 'icon-xs'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// ── Story-level demo feedback labels (Storybook-only, not production copy) ────
const DL: Record<string, Record<string, string>> = {
  clicked: { en: 'Clicked', sq: 'Klikuar', uk: 'Натиснуто', it: 'Cliccato' },
}
function dl(key: string, locale = 'en'): string {
  return DL[key]?.[locale] ?? DL[key]?.en ?? key
}

// ── Feedback line — shows last-clicked label in canvas (locale-aware) ─────────
function ClickedLabel({ label, locale = 'en' }: { label: string | null; locale?: string }) {
  if (!label) return null
  return (
    <p className="text-xs text-muted-foreground mt-2 px-0.5">
      {dl('clicked', locale)}: <strong>{label}</strong>
    </p>
  )
}

// ── Default ──────────────────────────────────────────────────────────────────
export const Default: Story = {
  args: {
    children: 'Save listing',
    onClick: () => {},
  },
}

// ── Variants ─────────────────────────────────────────────────────────────────
function AllVariantsDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button variant="default"      onClick={() => setLast('Primary')}>Primary</Button>
        <Button variant="outline"      onClick={() => setLast('Outline')}>Outline</Button>
        <Button variant="secondary"    onClick={() => setLast('Secondary')}>Secondary</Button>
        <Button variant="ghost"        onClick={() => setLast('Ghost')}>Ghost</Button>
        <Button variant="destructive"  onClick={() => setLast('Destructive')}>Destructive</Button>
        <Button variant="link"         onClick={() => setLast('Link')}>Link</Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const AllVariants: Story = {
  render: () => <AllVariantsDemo />,
}

// ── Sizes ─────────────────────────────────────────────────────────────────────
function AllSizesDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Button size="xs"      onClick={() => setLast('XS')}>XS</Button>
        <Button size="sm"      onClick={() => setLast('SM')}>SM</Button>
        <Button size="default" onClick={() => setLast('Default')}>Default</Button>
        <Button size="lg"      onClick={() => setLast('LG')}>LG</Button>
        <Button size="xl"      onClick={() => setLast('XL — Mobile safe')}>XL — Mobile safe</Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const AllSizes: Story = {
  render: () => <AllSizesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Use `size="xl"` (44px) for all mobile-reachable buttons. ' +
          'Sizes below xl are for desktop-only contexts.',
      },
    },
  },
}

// ── Mobile safe ───────────────────────────────────────────────────────────────
function MobileSafeDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <Button size="xl" onClick={() => setLast('Contact agent')}>Contact agent</Button>
      <ClickedLabel label={last} />
    </div>
  )
}

export const MobileSafe: Story = {
  render: () => <MobileSafeDemo />,
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: '`size="xl"` is 44px — the minimum touch target for mobile. ' +
               'ALWAYS use for mobile-reachable primary actions.',
      },
    },
  },
}

// ── With icons ────────────────────────────────────────────────────────────────
function WithIconDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setLast('Add listing')}><Plus /> Add listing</Button>
        <Button variant="outline" onClick={() => setLast('Add listing (outline)')}><Plus /> Add listing</Button>
        <Button variant="destructive" onClick={() => setLast('Delete')}><Trash2 /> Delete</Button>
        <Button disabled><Loader2 className="animate-spin" /> Saving…</Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const WithIcon: Story = {
  render: () => <WithIconDemo />,
}

// ── Icon-only buttons ─────────────────────────────────────────────────────────
function IconOnlyDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="icon"    variant="outline" aria-label="Add"              onClick={() => setLast('Add')}><Plus /></Button>
        <Button size="icon-xl" variant="outline" aria-label="Add (mobile safe)" onClick={() => setLast('Add (mobile safe)')}><Plus /></Button>
        <Button size="icon-sm" variant="ghost"   aria-label="Delete"           onClick={() => setLast('Delete')}><Trash2 /></Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const IconOnly: Story = {
  render: () => <IconOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons MUST have `aria-label`. Use `size="icon-xl"` (44px) for mobile.',
      },
    },
  },
}

// ── Disabled ──────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  args: { disabled: true, children: 'Submit' },
}

// ── Control-row rhythm — one-row-one-height contract ─────────────────────────
function ControlRowDesktopDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="xl" variant="destructive" onClick={() => setLast('Delete')}>Delete</Button>
        <Button size="xl" variant="ghost"       onClick={() => setLast('Export')}>Export</Button>
        <Button size="xl" variant="outline"     onClick={() => setLast('Cancel')}>Cancel</Button>
        <Button size="xl"                       onClick={() => setLast('Save changes')}>Save changes</Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const ControlRowRhythm_Desktop: Story = {
  render: () => <ControlRowDesktopDemo />,
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: {
      description: {
        story:
          'One-row-one-height proof: primary, secondary (outline), ghost/tertiary, and destructive, all at size="xl" (h-11 = 44px). ' +
          'In the same DS control row, no action button may be visually taller or shorter than its siblings.',
      },
    },
  },
}

function ControlRowMobile320Demo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div>
      <div className="flex flex-col gap-2 w-full px-3">
        <Button size="xl" variant="destructive" className="w-full" onClick={() => setLast('Delete listing')}>Delete listing</Button>
        <Button size="xl" variant="ghost"       className="w-full" onClick={() => setLast('Export')}>Export</Button>
        <Button size="xl" variant="outline"     className="w-full" onClick={() => setLast('Cancel')}>Cancel</Button>
        <Button size="xl"                       className="w-full" onClick={() => setLast('Save changes')}>Save changes</Button>
      </div>
      <ClickedLabel label={last} />
    </div>
  )
}

export const ControlRowRhythm_Stacked: Story = {
  render: () => <ControlRowMobile320Demo />,
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: {
      description: {
        story:
          '320px: all four action types at size="xl" (44px). ' +
          'On mobile inside a flex-col action container or a page-level action slot, they stack full-width. ' +
          'Ghost/tertiary visual style is allowed; hit area must still be 44px.',
      },
    },
  },
}

// ── Long locale label (Ukrainian stress test) ─────────────────────────────────
function LongLocaleLabelDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3 max-w-xs">
      <Button size="xl" onClick={() => setLast('Зв\'яжіться з агентом')}>
        Зв&apos;яжіться з агентом нерухомості
      </Button>
      <Button size="xl" variant="outline" onClick={() => setLast('Переглянути оренду')}>
        Переглянути всі оголошення про оренду нерухомості
      </Button>
      <ClickedLabel label={last} locale="uk" />
    </div>
  )
}

export const LongLocaleLabel: Story = {
  render: () => <LongLocaleLabelDemo />,
  parameters: {
    globals: { locale: 'uk' },
    docs: {
      description: {
        story: 'Ukrainian labels — significantly longer than English. Buttons must wrap gracefully. "Натиснуто:" prefix is Ukrainian.',
      },
    },
  },
}

// ── Locale stress — full-width at mobile + uk label fit ───────────────────────
function LocaleStressDemo() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="w-full px-4 flex flex-col gap-3">
      <Button size="xl" onClick={() => setLast('primary')}>
        Зв&apos;яжіться з агентом нерухомості
      </Button>
      <Button size="xl" variant="outline" onClick={() => setLast('outline')}>
        Переглянути всі оголошення про оренду
      </Button>
      <Button size="xl" variant="secondary" onClick={() => setLast('secondary')}>
        Зберегти пошук та отримувати сповіщення
      </Button>
      <Button size="xl" variant="destructive" onClick={() => setLast('destructive')}>
        Видалити оголошення назавжди
      </Button>
      <ClickedLabel label={last} locale="uk" />
    </div>
  )
}

export const LocaleStress: Story = {
  render: () => <LocaleStressDemo />,
  parameters: {
    globals: { locale: 'uk' },
    viewport: { defaultViewport: 'mobile320' },
    docs: {
      description: {
        story:
          'Ukrainian labels at 320px: `size="xl"` buttons are full-width (`max-sm:w-full`) and ' +
          'long labels fit without overflow (`max-sm:whitespace-normal max-sm:break-words`). ' +
          'At ≥640px buttons revert to content-width. Натиснуто = "Clicked".',
      },
    },
  },
}
