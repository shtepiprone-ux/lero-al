'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AdminCardList } from './AdminCardList'
import { Badge } from '@/components/ui/badge'

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

function stateLabel(state: string) {
  if (state === 'open') return 'Open'
  if (state === 'in_progress') return 'In progress'
  if (state === 'resolved') return 'Resolved'
  return state
}

const STATE_LABELS: Record<string, Record<string, string>> = {
  en: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' },
  uk: { open: 'Відкрито', in_progress: 'В обробці', resolved: 'Вирішено' },
  sq: { open: 'Hapur', in_progress: 'Në progres', resolved: 'Zgjidhur' },
  it: { open: 'Aperto', in_progress: 'In corso', resolved: 'Risolto' },
}

const HINT_TEXT: Record<string, string> = {
  en: 'Click a row — or focus it and press Enter / Space — to see the selected state.',
  uk: 'Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан.',
  sq: 'Klikoni një rresht ose fokusojeni dhe shtypni Enter / Space për të parë gjendjen e zgjedhur.',
  it: 'Fai clic su una riga oppure mettila a fuoco e premi Enter / Space per vedere lo stato selezionato.',
}

const SELECTED_HEADING: Record<string, string> = {
  en: 'Selected ticket',
  uk: 'Вибраний тікет',
  sq: 'Rreshti i zgjedhur',
  it: 'Ticket selezionato',
}

function TicketListInteractive({
  rows,
  emptyState,
  ariaLabel,
  compact,
  locale = 'en',
}: {
  rows: TicketRow[]
  emptyState: string
  ariaLabel?: string
  compact?: boolean
  locale?: string
}) {
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const localStateLabel = (s: string) => STATE_LABELS[locale]?.[s] ?? stateLabel(s)
  const hint = HINT_TEXT[locale] ?? HINT_TEXT.en
  const heading = SELECTED_HEADING[locale] ?? SELECTED_HEADING.en

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
              {row.type && <span className="text-xs text-muted-foreground">{row.type}</span>}
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
            {selected.type && <span className="text-xs text-muted-foreground">{selected.type}</span>}
            {selected.updated && <span className="text-xs text-muted-foreground">{selected.updated}</span>}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic px-1">{hint}</p>
      )}
    </div>
  )
}

const TICKETS: TicketRow[] = [
  { id: '1', subject: 'Unable to edit my listing after publishing', state: 'open',        type: 'Support',   updated: '2026-05-31' },
  { id: '2', subject: 'User reported for fake property photos',     state: 'in_progress', type: 'Complaint', updated: '2026-05-30' },
  { id: '3', subject: 'Payment dispute for rental deposit',         state: 'resolved',    type: 'Support',   updated: '2026-05-29' },
]

const UK_TICKETS: TicketRow[] = [
  { id: '1', subject: 'Не можу відредагувати оголошення після публікації — довга назва тікету для тесту переносу рядків', state: 'open' },
  { id: '2', subject: 'Скарга на користувача за підроблені фотографії нерухомості в Тирані', state: 'in_progress' },
]

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
// ── Canonical scenario stories — breakpoints via viewport toolbar ─────────────
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Interactive card list. Auto-chevron in trailing (no manual trailing needed). Click or Enter/Space → "Selected ticket" panel. Use viewport toolbar for other widths.' } },
  },
  render: () => <TicketListInteractive rows={TICKETS} emptyState="No tickets found." ariaLabel="Support tickets" locale="en" />,
}

export const Static: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static card list — display-only. No onRowClick → no auto-chevron, no hover, no cursor. Compare Default (interactive) to see the affordance difference.' } },
  },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        subtitle: (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={stateVariant(row.state)} className="text-xs">{stateLabel(row.state)}</Badge>
            {row.type && <span className="text-xs text-muted-foreground">{row.type}</span>}
          </div>
        ),
        meta: row.updated ? <span className="text-xs text-muted-foreground mt-0.5">{row.updated}</span> : undefined,
      })}
      emptyState="No tickets found."
    />
  ),
}

export const Compact: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static compact density with explicit Badge trailing (takes precedence over auto-chevron).' } },
  },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => ({
        title: row.subject,
        trailing: <Badge variant={stateVariant(row.state)} className="text-xs shrink-0">{stateLabel(row.state)}</Badge>,
      })}
      emptyState="No tickets."
      compact
    />
  ),
}

export const LegacyReactNode: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Static legacy ReactNode card (not StructuredCard) — no auto-chevron. No onRowClick.' } },
  },
  render: () => (
    <AdminCardList
      rows={TICKETS}
      rowKey={r => r.id}
      card={row => (
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm min-w-0 break-words">{row.subject}</p>
          <Badge variant={stateVariant(row.state)} className="text-xs shrink-0 ml-2">{stateLabel(row.state)}</Badge>
        </div>
      )}
      emptyState="No tickets found."
    />
  ),
}

export const Empty: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList rows={[]} rowKey={r => (r as TicketRow).id} card={() => null} emptyState="No support tickets found." />
  ),
}

export const Loading: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
  render: () => (
    <AdminCardList rows={[]} rowKey={() => ''} card={() => null} emptyState="No tickets." loading />
  ),
}

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    globals: { locale: 'uk' },
    docs: { description: { story: 'uk@320: long Ukrainian ticket subjects must wrap inside card bounds; auto-chevron remains visible. Use locale toolbar for other locales; viewport toolbar for other widths.' } },
  },
  render: () => <TicketListInteractive rows={UK_TICKETS} emptyState="Немає тікетів." ariaLabel="Список тікетів" locale="uk" />,
}
