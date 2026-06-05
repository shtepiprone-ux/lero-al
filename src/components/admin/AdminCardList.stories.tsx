'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { AdminCardList } from './AdminCardList'
import { Badge } from '@/components/ui/badge'
import { storyT } from '@/stories/_storyI18n'

const acl = (k: string, l = 'en') => storyT(l, `storybook.admin_cardlist.${k}`)

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

const STATE_KEY: Record<string, string> = { open: 'state_open', in_progress: 'state_in_progress', resolved: 'state_resolved' }
const TYPE_KEY: Record<string, string> = { Support: 'type_support', Complaint: 'type_complaint' }

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
  const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? `state_${s}`, locale)
  const localTypeLabel = (t?: string) => t ? acl(TYPE_KEY[t] ?? `type_${t.toLowerCase()}`, locale) : undefined
  const hint = acl('hint', locale)
  const heading = acl('selected', locale)
  const emptyState = acl('empty', locale)
  const ariaLabel = acl('aria_label', locale)

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
    docs: { description: { story: 'Interactive card list. State labels, type labels, hint text — all locale-reactive via toolbar. Click or Enter/Space → "Selected ticket" panel.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <TicketListInteractive rows={makeTickets(locale)} locale={locale} />
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const Static: Story = {
  parameters: {
    docs: { description: { story: 'Static card list — display-only. No onRowClick → no auto-chevron, no hover, no cursor.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? `state_${s}`, locale)
    const localTypeLabel = (t?: string) => t ? acl(TYPE_KEY[t] ?? `type_${t.toLowerCase()}`, locale) : undefined
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
        emptyState={acl('empty', locale)}
      />
    )
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const Compact: Story = {
  parameters: {
    docs: { description: { story: 'Static compact density with explicit Badge trailing.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? `state_${s}`, locale)
    return (
      <AdminCardList
        rows={makeTickets(locale)}
        rowKey={r => r.id}
        card={row => ({
          title: row.subject,
          trailing: <Badge variant={stateVariant(row.state)} className="text-xs shrink-0">{localStateLabel(row.state)}</Badge>,
        })}
        emptyState={acl('empty', locale)}
        compact
      />
    )
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const LegacyReactNode: Story = {
  parameters: {
    docs: { description: { story: 'Static legacy ReactNode card (not StructuredCard) — no auto-chevron.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? `state_${s}`, locale)
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
        emptyState={acl('empty', locale)}
      />
    )
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const Empty: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminCardList rows={[]} rowKey={r => (r as TicketRow).id} card={() => null} emptyState={acl('empty', locale)} />
    )
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const Loading: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <AdminCardList rows={[]} rowKey={() => ''} card={() => null} emptyState={acl('empty', locale)} loading />
    )
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  },
}

export const LocaleStress: Story = {
  parameters: {
    docs: { description: { story: 'uk@320: long Ukrainian ticket subjects must wrap inside card bounds; auto-chevron remains visible.' } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <TicketListInteractive rows={makeStressTickets(locale)} locale={locale} />
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
