'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AdminPageShell } from './AdminPageShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Story-level demo feedback labels (Storybook-only, not production copy) ────
const DL: Record<string, Record<string, string>> = {
  action:  { en: 'Action',   sq: 'Veprimi',   uk: 'Дія',      it: 'Azione' },
  viewing: { en: 'Viewing',  sq: 'Duke parë', uk: 'Перегляд', it: 'Visualizzazione' },
}
function dl(key: string, locale = 'en'): string {
  return DL[key]?.[locale] ?? DL[key]?.en ?? key
}

const meta: Meta<typeof AdminPageShell> = {
  title: 'Admin/AdminPageShell',
  component: AdminPageShell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical admin page wrapper. Provides responsive header (title + countBadge + actions), optional filter bar slot, and content area. ' +
          'One-shared-height contract: all action buttons in the actions slot use size="xl" (h-11 = 44px). ' +
          'Filter tabs in the filterBar slot use the canonical Tabs primitive from @/components/ui/tabs. ' +
          'At <md:, action slot becomes max-md:w-full so actions fill the column (full-width on mobile). ' +
          'Action buttons show in-canvas feedback when clicked. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. ' +
          'See docs/admin-ux-rules.md (Epic HH Phase 2, Task 306).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AdminPageShell>

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
    <div className="flex items-center gap-3 px-4 py-3 border-b">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-muted rounded-full w-3/4" />
        <div className="h-2.5 bg-muted/60 rounded-full w-2/5" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
    </div>
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-muted rounded-full w-1/2" />
        <div className="h-2.5 bg-muted/60 rounded-full w-3/5" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
    </div>
  </div>
)

// ── Tab options per locale (Storybook-only, not production copy) ──────────────
const TAB_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  en: [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }],
  uk: [{ value: 'all', label: 'Усі' }, { value: 'active', label: 'Активні' }, { value: 'pending', label: 'Очікують' }],
  sq: [{ value: 'all', label: 'Të gjitha' }, { value: 'active', label: 'Aktive' }, { value: 'pending', label: 'Në pritje' }],
  it: [{ value: 'all', label: 'Tutti' }, { value: 'active', label: 'Attivi' }, { value: 'pending', label: 'In attesa' }],
}

// ── FilterTabsCanonical — canonical Tabs primitive for the filterBar slot ─────
// Uses Tabs/TabsList/TabsTrigger from @/components/ui/tabs (Base UI).
// Stateful: clicking a tab updates the "Viewing:" panel below.
function FilterTabsCanonical({ locale = 'en' }: { locale?: string }) {
  const options = TAB_OPTIONS[locale] ?? TAB_OPTIONS.en
  const [value, setValue] = useState(options[0]?.value ?? 'all')
  return (
    <Tabs value={value} onValueChange={(v) => v && setValue(v)}>
      <TabsList>
        {options.map(opt => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

// ── ActionFeedback — locale-aware in-canvas feedback block ───────────────────
function ActionFeedback({ label, locale = 'en' }: { label: string; locale?: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/40 text-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      <span className="text-muted-foreground">{dl('action', locale)}: </span>
      <strong>{label}</strong>
    </div>
  )
}

// ── AdminShellDemo — shared interactive wrapper ────────────────────────────────
function AdminShellDemo({
  title,
  subtitle,
  countBadge,
  actionLabel,
  locale = 'en',
  showFilterBar = false,
  showActions = true,
}: {
  title?: string
  subtitle?: string
  countBadge?: { value: number }
  actionLabel: string
  locale?: string
  showFilterBar?: boolean
  showActions?: boolean
}) {
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div>
      <AdminPageShell
        title={title}
        subtitle={subtitle}
        countBadge={countBadge}
        actions={showActions ? (
          <Button size="xl" onClick={() => setLastAction(actionLabel)}>
            <Plus />{actionLabel}
          </Button>
        ) : undefined}
        filterBar={showFilterBar ? <FilterTabsCanonical locale={locale} /> : undefined}
      >
        {CONTENT_MOCK}
      </AdminPageShell>
      {lastAction && <ActionFeedback label={lastAction} locale={locale} />}
    </div>
  )
}

// ── MultiActionShellDemo — wrapper for stories with multiple action buttons ────
function MultiActionShellDemo({
  title,
  countBadge,
  actions,
}: {
  title?: string
  countBadge?: { value: number }
  actions: Array<{ label: string; variant?: 'default' | 'outline' | 'ghost' }>
}) {
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div>
      <AdminPageShell
        title={title}
        countBadge={countBadge}
        actions={
          <>
            {actions.map(({ label, variant = 'default' }) => (
              <Button
                key={label}
                size="xl"
                variant={variant}
                onClick={() => setLastAction(label)}
              >
                {label === 'New listing' || label === 'New user' ? <><Plus />{label}</> : label}
              </Button>
            ))}
          </>
        }
      >
        {CONTENT_MOCK}
      </AdminPageShell>
      {lastAction && <ActionFeedback label={lastAction} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <AdminPageShell title="Listings" countBadge={{ value: 127 }}>
      {CONTENT_MOCK}
    </AdminPageShell>
  ),
}

export const WithTabs: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Canonical Tabs primitive in filterBar slot. Click tabs to switch active state. Tabs use TabsList/TabsTrigger from @/components/ui/tabs.' } },
  },
  render: () => (
    <AdminShellDemo
      title="Listings"
      countBadge={{ value: 127 }}
      actionLabel="New listing"
      showFilterBar
      showActions={false}
    />
  ),
}

export const WithActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Action slot: size="xl" (44px). Click button → in-canvas feedback.' } },
  },
  render: () => (
    <AdminShellDemo
      title="Users"
      subtitle="Manage platform accounts"
      countBadge={{ value: 843 }}
      actionLabel="New user"
    />
  ),
}

export const WithTabsAndActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Full pattern: title + count + actions + canonical tabs. Click action → feedback. Click tabs to switch.' } },
  },
  render: () => (
    <AdminShellDemo
      title="Users"
      subtitle="Manage platform accounts"
      countBadge={{ value: 843 }}
      actionLabel="New user"
      showFilterBar
    />
  ),
}

export const MultipleActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Multiple page-level actions: all size="xl" (44px). Click any button → in-canvas feedback. At <md: actions stack full-width.' } },
  },
  render: () => (
    <MultiActionShellDemo
      title="Listings"
      countBadge={{ value: 243 }}
      actions={[
        { label: 'Export', variant: 'ghost' },
        { label: 'Edit selected', variant: 'outline' },
        { label: 'New listing' },
      ]}
    />
  ),
}

export const NoHeader: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: () => (
    <AdminPageShell filterBar={<FilterTabsCanonical locale="en" />}>
      {CONTENT_MOCK}
    </AdminPageShell>
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: full-width action + Ukrainian canonical tabs. Long Ukrainian labels must fit. Use locale toolbar to switch locale; viewport toolbar for widths.' } },
  },
  render: () => (
    <AdminShellDemo
      title="Оголошення"
      subtitle="Керування оголошеннями платформи"
      countBadge={{ value: 127 }}
      actionLabel="Нове оголошення"
      locale="uk"
      showFilterBar
    />
  ),
}
