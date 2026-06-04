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

// ── Locale maps for story fixture labels (Storybook-only, not production copy) ─
const PAGE_TITLES: Record<string, Record<string, string>> = {
  listings: { en: 'Listings',      sq: 'Njoftimet',       uk: 'Оголошення',       it: 'Annunci' },
  users:    { en: 'Users',         sq: 'Përdoruesit',     uk: 'Користувачі',      it: 'Utenti' },
}
const PAGE_SUBTITLES: Record<string, Record<string, string>> = {
  users: { en: 'Manage platform accounts', sq: 'Administroni llogaritë', uk: 'Керування акаунтами', it: 'Gestisci gli account' },
}
const ACTION_LABELS: Record<string, Record<string, string>> = {
  new_listing: { en: 'New listing',  sq: 'Njoftim i ri',    uk: 'Нове оголошення',  it: 'Nuovo annuncio' },
  new_user:    { en: 'New user',     sq: 'Përdorues i ri',  uk: 'Новий користувач', it: 'Nuovo utente' },
  export:      { en: 'Export',       sq: 'Eksporto',        uk: 'Експорт',          it: 'Esporta' },
  edit_sel:    { en: 'Edit selected',sq: 'Ndrysho zgjedhjen',uk: 'Редагувати вибране',it: 'Modifica selezione' },
}

const t = (map: Record<string, string>, locale: string) => map[locale] ?? map.en

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — locale from render context ───────────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminPageShell title={t(PAGE_TITLES.listings, locale)} countBadge={{ value: 127 }}>
        {CONTENT_MOCK}
      </AdminPageShell>
    )
  },
}

export const WithTabs: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Canonical Tabs primitive in filterBar slot. Click tabs to switch active state.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminShellDemo
        title={t(PAGE_TITLES.listings, locale)}
        countBadge={{ value: 127 }}
        actionLabel={t(ACTION_LABELS.new_listing, locale)}
        locale={locale}
        showFilterBar
        showActions={false}
      />
    )
  },
}

export const WithActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Action slot: size="xl" (44px). Click button → in-canvas feedback.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminShellDemo
        title={t(PAGE_TITLES.users, locale)}
        subtitle={t(PAGE_SUBTITLES.users, locale)}
        countBadge={{ value: 843 }}
        actionLabel={t(ACTION_LABELS.new_user, locale)}
        locale={locale}
      />
    )
  },
}

export const WithTabsAndActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Full pattern: title + count + actions + canonical tabs.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminShellDemo
        title={t(PAGE_TITLES.users, locale)}
        subtitle={t(PAGE_SUBTITLES.users, locale)}
        countBadge={{ value: 843 }}
        actionLabel={t(ACTION_LABELS.new_user, locale)}
        locale={locale}
        showFilterBar
      />
    )
  },
}

export const MultipleActions: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1440' },
    docs: { description: { story: 'Multiple page-level actions: all size="xl" (44px). At <md: actions stack full-width.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MultiActionShellDemo
        title={t(PAGE_TITLES.listings, locale)}
        countBadge={{ value: 243 }}
        actions={[
          { label: t(ACTION_LABELS.export, locale), variant: 'ghost' },
          { label: t(ACTION_LABELS.edit_sel, locale), variant: 'outline' },
          { label: t(ACTION_LABELS.new_listing, locale) },
        ]}
      />
    )
  },
}

export const NoHeader: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminPageShell filterBar={<FilterTabsCanonical locale={locale} />}>
        {CONTENT_MOCK}
      </AdminPageShell>
    )
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: 'uk@320: full-width action + Ukrainian canonical tabs. Use locale toolbar to switch; viewport toolbar for widths.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminShellDemo
        title={t(PAGE_TITLES.listings, locale)}
        subtitle={t(PAGE_SUBTITLES.users, locale)}
        countBadge={{ value: 127 }}
        actionLabel={t(ACTION_LABELS.new_listing, locale)}
        locale={locale}
        showFilterBar
      />
    )
  },
}
