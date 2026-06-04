'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AdminCardList } from './AdminCardList'
import { Badge } from '@/components/ui/badge'
import { storyT } from '@/stories/_storyI18n'

type TicketRow = {
  id: string
  subject: string
  state: string
  type?: string
  updated?: string
}

function stateVariant(state: string): 'warning' | 'info' | 'success' | 'neutral' {
  if (state === 'open') return 'warning'
  if (state === 'in_progress') return 'info'
  if (state === 'resolved') return 'success'
  return 'neutral'
}

const STATE_LABELS: Record<string, Record<string, string>> = {
  en: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' },
  uk: { open: 'Відкрито', in_progress: 'В обробці', resolved: 'Вирішено' },
  sq: { open: 'Hapur', in_progress: 'Në procesim', resolved: 'Zgjidhur' },
  it: { open: 'Aperto', in_progress: 'In lavorazione', resolved: 'Risolto' },
}

const TYPE_LABELS: Record<string, Record<string, string>> = {
  en: { Support: 'Support', Complaint: 'Complaint' },
  uk: { Support: 'Підтримка', Complaint: 'Скарга' },
  sq: { Support: 'Mbështetje', Complaint: 'Ankesë' },
  it: { Support: 'Supporto', Complaint: 'Reclamo' },
}

const HINT_TEXT: Record<string, string> = {
  en: 'Click a row — or focus it and press Enter / Space — to see the selected state.',
  uk: 'Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан.',
  sq: 'Klikoni një rresht ose fokusojeni dhe shtypni Enter / Space për të parë gjendjen e zgjedhur.',
  it: 'Fai clic su una riga oppure mettila a fuoco e premi Enter / Space per vedere lo stato selezionato.',
}

const SELECTED_HEADING: Record<string, string> = {
  en: 'Selected ticket', uk: 'Вибраний тікет', sq: 'Rreshti i zgjedhur', it: 'Ticket selezionato',
}

const EMPTY_STATE_TEXT: Record<string, string> = {
  en: 'No tickets found.', uk: 'Немає тікетів.', sq: 'Nuk ka tike.', it: 'Nessun ticket.',
}

const ARIA_LABELS: Record<string, string> = {
  en: 'Support tickets', uk: 'Тікети підтримки', sq: 'Bileta mbështetëse', it: 'Ticket di supporto',
}

// TicketListInteractive accepts locale as a plain prop (NO useGlobals — only render context may access globals)
function TicketListInteractive({
  rows,
  locale,
  compact,
}: {
  rows: TicketRow[]
  locale: string
  compact?: boolean
}) {
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const localStateLabel = (s: string) => STATE_LABELS[locale]?.[s] ?? s
  const localTypeLabel = (t?: string) => t ? (TYPE_LABELS[locale]?.[t] ?? t) : undefined
  const hint = HINT_TEXT[locale] ?? HINT_TEXT.en
  const heading = SELECTED_HEADING[locale] ?? SELECTED_HEADING.en
  const emptyState = EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en
  const ariaLabel = ARIA_LABELS[locale] ?? ARIA_LABELS.en

  return (
    <div className="space-y-4">
      <AdminCardList
        rows={rows}
        rowKey={r => r.id}
        card={row => ({
          title: row.subject,
          subtitle: (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={stateVariant(row.state)} className="text-xs">
                {localStateLabel(row.state)}
              </Badge>
              {localTypeLabel(row.type) && (
                <span className="text-xs text-muted-foreground">{localTypeLabel(row.type)}</span>
              )}
            </div>
          ),
          meta: row.updated
            ? <span className="text-xs text-muted-foreground mt-0.5">{row.updated}</span>
            : undefined,
        })}
        onRowClick={setSelected}
        emptyState={emptyState}
        ariaLabel={ariaLabel}
        compact={compact}
      />
      {selected ? (
        <div className="rounded-xl border bg-card p-4 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{heading}</p>
          <p className="text-sm font-medium break-words">{selected.subject}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={stateVariant(selected.state)} className="text-xs">
              {localStateLabel(selected.state)}
            </Badge>
            {localTypeLabel(selected.type) && (
              <span className="text-xs text-muted-foreground">{localTypeLabel(selected.type)}</span>
            )}
            {selected.updated && <span className="text-xs text-muted-foreground">{selected.updated}</span>}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic px-1">{hint}</p>
      )}
    </div>
  )
}

function makeTickets(locale: string): TicketRow[] {
  return [
    { id: '1', subject: storyT(locale, 'storybook.tickets.subject_0'), state: 'open',        type: 'Support',   updated: '2026-05-31' },
    { id: '2', subject: storyT(locale, 'storybook.tickets.subject_1'), state: 'in_progress', type: 'Complaint', updated: '2026-05-30' },
    { id: '3', subject: storyT(locale, 'storybook.tickets.subject_2'), state: 'resolved',    type: 'Support',   updated: '2026-05-29' },
  ]
}

function makeStressTickets(locale: string): TicketRow[] {
  return [
    { id: '1', subject: storyT(locale, 'storybook.tickets.stress_0'), state: 'open' },
    { id: '2', subject: storyT(locale, 'storybook.tickets.stress_1'), state: 'in_progress' },
  ]
}

const meta: Meta = {
  title: 'Admin/AdminCardList',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical card-row list for workflow-heavy admin surfaces. ' +
          'Interactive contract: `onRowClick` → cursor-pointer, hover:bg-muted/30, role="button", tabIndex=0, Enter/Space keyboard activation. ' +
          'Auto-ChevronRight affordance: when `onRowClick` is set and StructuredCard provides no `trailing`, AdminCardList automatically renders a ChevronRight. ' +
          'Do NOT manually add trailing: <ChevronRight /> — the primitive handles this. ' +
          'Explicit `trailing` (e.g. a Badge) takes precedence over auto-chevron. ' +
          'Static stories (no onRowClick): no hover, no cursor, no chevron. ' +
          'Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ════════════════════════════════════════════════════════════════════════════════
// ── Canonical scenario stories — locale via render context, not hardcoded ──────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Interactive card list. State labels, type labels, hint text — all locale-reactive via toolbar. Click or Enter/Space → "Selected ticket" panel.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <TicketListInteractive rows={makeTickets(locale)} locale={locale} />
  },
}

export const Static: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static card list — display-only. No onRowClick → no auto-chevron, no hover, no cursor.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => STATE_LABELS[locale]?.[s] ?? s
    const localTypeLabel = (t?: string) => t ? (TYPE_LABELS[locale]?.[t] ?? t) : undefined
    return (
      <AdminCardList
        rows={makeTickets(locale)}
        rowKey={r => r.id}
        card={row => ({
          title: row.subject,
          subtitle: (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={stateVariant(row.state)} className="text-xs">{localStateLabel(row.state)}</Badge>
              {localTypeLabel(row.type) && <span className="text-xs text-muted-foreground">{localTypeLabel(row.type)}</span>}
            </div>
          ),
          meta: row.updated ? <span className="text-xs text-muted-foreground mt-0.5">{row.updated}</span> : undefined,
        })}
        emptyState={EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en}
      />
    )
  },
}

export const Compact: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static compact density with explicit Badge trailing.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => STATE_LABELS[locale]?.[s] ?? s
    return (
      <AdminCardList
        rows={makeTickets(locale)}
        rowKey={r => r.id}
        card={row => ({
          title: row.subject,
          trailing: <Badge variant={stateVariant(row.state)} className="text-xs shrink-0">{localStateLabel(row.state)}</Badge>,
        })}
        emptyState={EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en}
        compact
      />
    )
  },
}

export const LegacyReactNode: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static legacy ReactNode card (not StructuredCard) — no auto-chevron.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => STATE_LABELS[locale]?.[s] ?? s
    return (
      <AdminCardList
        rows={makeTickets(locale)}
        rowKey={r => r.id}
        card={row => (
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm min-w-0 break-words">{row.subject}</p>
            <Badge variant={stateVariant(row.state)} className="text-xs shrink-0 ml-2">{localStateLabel(row.state)}</Badge>
          </div>
        )}
        emptyState={EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en}
      />
    )
  },
}

export const Empty: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminCardList rows={[]} rowKey={r => (r as TicketRow).id} card={() => null} emptyState={EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en} />
    )
  },
}

export const Loading: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminCardList rows={[]} rowKey={() => ''} card={() => null} emptyState={EMPTY_STATE_TEXT[locale] ?? EMPTY_STATE_TEXT.en} loading />
    )
  },
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: 'uk@320: long Ukrainian ticket subjects must wrap inside card bounds; auto-chevron remains visible.' } },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <TicketListInteractive rows={makeStressTickets(locale)} locale={locale} />
  },
}
