'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from './button'
import { storyT } from '@/stories/_storyI18n'

// key aliases: old story keys → storybook.button.* message keys
const BTN_KEY: Record<string, string> = {
  save_ch: 'save_changes', delete_lst: 'delete_listing',
  del_forever: 'delete_forever', contact_lg: 'contact_long',
  add_out: 'add',
}

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
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

const L = (key: string, locale = 'en') => storyT(locale, `storybook.button.${BTN_KEY[key] ?? key}`)

// ── Feedback line — shows last-clicked label in canvas (locale-aware) ─────────
function ClickedLabel({ label, locale = 'en' }: { label: string | null; locale?: string }) {
  if (!label) return null
  return (
    <p className="text-xs text-muted-foreground mt-2 px-0.5">
      {L('clicked', locale)}: <strong>{label}</strong>
    </p>
  )
}

// ── Default ──────────────────────────────────────────────────────────────────
export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <Button>{L('save', locale)}</Button>
  },
}

// ── Variants ─────────────────────────────────────────────────────────────────
function AllVariantsDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const v = (key: string) => storyT(locale, `storybook.button.${key}`)
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button variant="default"     onClick={() => setLast(v('variant_primary'))}>{v('variant_primary')}</Button>
        <Button variant="outline"     onClick={() => setLast(v('variant_outline'))}>{v('variant_outline')}</Button>
        <Button variant="secondary"   onClick={() => setLast(v('variant_secondary'))}>{v('variant_secondary')}</Button>
        <Button variant="ghost"       onClick={() => setLast(v('variant_ghost'))}>{v('variant_ghost')}</Button>
        <Button variant="destructive" onClick={() => setLast(v('variant_destructive'))}>{v('variant_destructive')}</Button>
        <Button variant="link"        onClick={() => setLast(v('variant_link'))}>{v('variant_link')}</Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const AllVariants: Story = {
  render: (_, context) => <AllVariantsDemo locale={(context?.globals?.locale as string) ?? 'en'} />,
}

// ── Sizes ─────────────────────────────────────────────────────────────────────
function AllSizesDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const def = storyT(locale, 'storybook.button.size_default')
  // XS/SM/LG/XL are universal size abbreviations — no locale variant needed
  const labels = ['XS', 'SM', def, 'LG', 'XL']
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Button size="xs"      onClick={() => setLast(labels[0])}>{labels[0]}</Button>
        <Button size="sm"      onClick={() => setLast(labels[1])}>{labels[1]}</Button>
        <Button size="default" onClick={() => setLast(labels[2])}>{labels[2]}</Button>
        <Button size="lg"      onClick={() => setLast(labels[3])}>{labels[3]}</Button>
        <Button size="xl"      onClick={() => setLast(labels[4])}>{labels[4]}</Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const AllSizes: Story = {
  render: (_, context) => <AllSizesDemo locale={(context?.globals?.locale as string) ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story:
          'All text sizes (`xs`, `sm`, `default`, `lg`, `xl`) are full-width at <640px and ≥44px tall. ' +
          'Icon-only sizes (`icon`, `icon-xl`, `icon-sm`, `icon-xs`, `icon-lg`) stay compact at all widths.',
      },
    },
  },
}

// ── Mobile safe ───────────────────────────────────────────────────────────────
function MobileSafeDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const label = L('contact', locale)
  return (
    <div>
      <Button size="xl" onClick={() => setLast(label)}>{label}</Button>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const TouchSafe: Story = {
  render: (_, context) => <MobileSafeDemo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: {
      description: {
        story: 'All text sizes are mobile-safe: `max-sm:w-full` (full-width at <640px), ' +
               '`max-sm:min-h-11` (≥44px touch target). `size="xl"` shown here — same contract applies to sm/default/lg.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}

// ── With icons ────────────────────────────────────────────────────────────────
function WithIconDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lAdd = L('add', locale)
  const lDel = L('delete', locale)
  const lSav = L('saving', locale)
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setLast(lAdd)}><Plus /> {lAdd}</Button>
        <Button variant="outline" onClick={() => setLast(lAdd)}><Plus /> {lAdd}</Button>
        <Button variant="destructive" onClick={() => setLast(lDel)}><Trash2 /> {lDel}</Button>
        <Button disabled><Loader2 className="animate-spin" /> {lSav}</Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const WithIcon: Story = {
  render: (_, context) => <WithIconDemo locale={(context?.globals?.locale as string) ?? 'en'} />,
}

// ── Icon-only buttons ─────────────────────────────────────────────────────────
function IconOnlyDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lAdd = L('add', locale)
  const lDel = L('delete', locale)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="icon"    variant="outline" aria-label={lAdd}  onClick={() => setLast(lAdd)}><Plus /></Button>
        <Button size="icon-xl" variant="outline" aria-label={lAdd}  onClick={() => setLast(lAdd)}><Plus /></Button>
        <Button size="icon-sm" variant="ghost"   aria-label={lDel}  onClick={() => setLast(lDel)}><Trash2 /></Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const IconOnly: Story = {
  render: (_, context) => <IconOnlyDemo locale={(context?.globals?.locale as string) ?? 'en'} />,
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
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <Button disabled>{L('submit', locale)}</Button>
  },
}

// ── Control-row rhythm — one-row-one-height contract ─────────────────────────
function ControlRowDesktopDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lDel = L('delete', locale); const lExp = L('export', locale)
  const lCan = L('cancel', locale); const lSav = L('save_ch', locale)
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="xl" variant="destructive" onClick={() => setLast(lDel)}>{lDel}</Button>
        <Button size="xl" variant="ghost"       onClick={() => setLast(lExp)}>{lExp}</Button>
        <Button size="xl" variant="outline"     onClick={() => setLast(lCan)}>{lCan}</Button>
        <Button size="xl"                       onClick={() => setLast(lSav)}>{lSav}</Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const ControlRowRhythm_Inline: Story = {
  render: (_, context) => <ControlRowDesktopDemo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: {
      description: {
        story:
          'One-row-one-height proof: primary, secondary (outline), ghost/tertiary, and destructive, all at size="xl" (h-11 = 44px). ' +
          'In the same DS control row, no action button may be visually taller or shorter than its siblings.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}

function ControlRowMobile320Demo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lDel = L('delete_lst', locale); const lExp = L('export', locale)
  const lCan = L('cancel', locale); const lSav = L('save_ch', locale)
  return (
    <div>
      <div className="flex flex-col gap-2 w-full px-3">
        <Button size="xl" variant="destructive" onClick={() => setLast(lDel)}>{lDel}</Button>
        <Button size="xl" variant="ghost"       onClick={() => setLast(lExp)}>{lExp}</Button>
        <Button size="xl" variant="outline"     onClick={() => setLast(lCan)}>{lCan}</Button>
        <Button size="xl"                       onClick={() => setLast(lSav)}>{lSav}</Button>
      </div>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const ControlRowRhythm_Stacked: Story = {
  render: (_, context) => <ControlRowMobile320Demo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: {
      description: {
        story:
          '320px: all four action types at size="xl" (44px). ' +
          'Full-width is automatic via `max-sm:w-full` in the primitive — no manual `className="w-full"` needed.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

// ── Long locale label stress ───────────────────────────────────────────────────
function LongLocaleLabelDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lCont = L('contact_lg', locale)
  const lBrow = L('browse_rent', locale)
  const lSave = L('save_search', locale)
  return (
    <div className="flex flex-col gap-3 max-w-xs">
      <p className="text-xs text-muted-foreground font-medium">size=xl</p>
      <Button size="xl" onClick={() => setLast('xl')}>{lCont}</Button>
      <p className="text-xs text-muted-foreground font-medium">size=lg</p>
      <Button size="lg" variant="outline" onClick={() => setLast('lg')}>{lBrow}</Button>
      <p className="text-xs text-muted-foreground font-medium">size=default</p>
      <Button size="default" onClick={() => setLast('default')}>{lCont}</Button>
      <p className="text-xs text-muted-foreground font-medium">size=sm</p>
      <Button size="sm" variant="secondary" onClick={() => setLast('sm')}>{lSave}</Button>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const LongLocaleLabel: Story = {
  render: (_, context) => <LongLocaleLabelDemo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: {
      description: {
        story: 'Long locale labels at 375px — all text sizes must wrap gracefully, never clip. ' +
               'Full-width is automatic at <640px for `xl`, `lg`, `default`, `sm`. Use locale toolbar to switch language.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}

// ── Locale stress — full-width at mobile + long label fit ─────────────────────
function LocaleStressDemo({ locale }: { locale: string }) {
  const [last, setLast] = useState<string | null>(null)
  const lCont = L('contact_lg', locale)
  const lBrow = L('browse_rent', locale)
  const lSave = L('save_search', locale)
  const lDel  = L('del_forever', locale)
  return (
    <div className="w-full px-4 flex flex-col gap-3">
      <p className="text-xs text-muted-foreground font-medium">size=xl</p>
      <Button size="xl" onClick={() => setLast('xl-primary')}>{lCont}</Button>
      <Button size="xl" variant="outline" onClick={() => setLast('xl-outline')}>{lBrow}</Button>
      <p className="text-xs text-muted-foreground font-medium mt-1">size=lg</p>
      <Button size="lg" onClick={() => setLast('lg-primary')}>{lCont}</Button>
      <Button size="lg" variant="outline" onClick={() => setLast('lg-outline')}>{lBrow}</Button>
      <p className="text-xs text-muted-foreground font-medium mt-1">size=default</p>
      <Button size="default" onClick={() => setLast('default-primary')}>{lCont}</Button>
      <Button size="default" variant="secondary" onClick={() => setLast('default-secondary')}>{lSave}</Button>
      <p className="text-xs text-muted-foreground font-medium mt-1">size=sm</p>
      <Button size="sm" onClick={() => setLast('sm-primary')}>{lCont}</Button>
      <Button size="sm" variant="destructive" onClick={() => setLast('sm-destructive')}>{lDel}</Button>
      <ClickedLabel label={last} locale={locale} />
    </div>
  )
}

export const LocaleStress: Story = {
  render: (_, context) => <LocaleStressDemo locale={(context?.globals?.locale as string) ?? 'en'} />,

  parameters: {
    docs: {
      description: {
        story:
          '@320: ALL text sizes (`xl`, `lg`, `default`, `sm`) are full-width (`max-sm:w-full`) ' +
          'and long labels wrap without overflow. Each size is ≥44px tall (`max-sm:min-h-11`). ' +
          'Use locale toolbar — labels switch between sq/en/uk/it. At ≥640px buttons revert to content-width.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
