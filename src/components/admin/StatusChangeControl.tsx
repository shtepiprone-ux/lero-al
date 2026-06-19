'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@/components/shared/Combobox'
import { StatusChangeHistory, type HistoryEvent } from '@/components/admin/StatusChangeHistory'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'destructive' | 'info'

export type StatusOption<S extends string> = {
  code: S
  /** Human-readable label. When provided, used directly — no t() call needed (preferred in stories). */
  label?: string
  /** i18n key in admin.common.status_control namespace. Used when `label` is not set. */
  labelKey: string
  badgeVariant: BadgeVariant
  icon?: ReactNode
  destructive?: boolean
}

export type Transition<S extends string> = {
  from: S
  to: S
  /** Human-readable label. When provided, used directly — no t() call needed (preferred in stories). */
  label?: string
  /** i18n key in admin.common.status_control namespace. Used when `label` is not set. */
  labelKey: string
  destructive?: boolean
  requireNote?: boolean
}

export type StatusChangeControlProps<S extends string> = {
  variant: 'select' | 'workflow'
  currentStatus: S
  statuses: StatusOption<S>[]
  transitions?: Transition<S>[]
  historyEvents?: HistoryEvent[]
  onSubmit: (next: { toStatus: S; note: string | null }) => Promise<void> | void
  enableNote?: boolean
  requireNote?: boolean
  submitLabelKey?: string
  disabled?: boolean
  'aria-label'?: string
  /** variant="select" only: render the dropdown open on mount (Storybook/QA evidence only — not for app usage). */
  defaultOpen?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusChangeControl<S extends string>({
  variant,
  currentStatus,
  statuses,
  transitions = [],
  historyEvents = [],
  onSubmit,
  enableNote = false,
  requireNote = false,
  submitLabelKey,
  disabled = false,
  'aria-label': ariaLabel,
  defaultOpen,
}: StatusChangeControlProps<S>) {
  const t = useTranslations('admin.common.status_control')
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<S | null>(null)

  const submitLabel = submitLabelKey
    ? t(submitLabelKey as 'update_status_btn')
    : t('update_status_btn')

  async function handleSubmit(toStatus: S) {
    if (toStatus === currentStatus) return
    const noteValue = note.trim() || null
    setPending(true)
    try {
      await onSubmit({ toStatus, note: noteValue })
      toast.success(t('status_change_success'))
      setNote('')
      setSelectedStatus(null)
    } catch {
      toast.error(t('status_change_error'))
    } finally {
      setPending(false)
    }
  }

  // ── Select variant ─────────────────────────────────────────────────────────

  if (variant === 'select') {
    const options: ComboboxOption[] = statuses.map(s => ({
      value: s.code,
      label: s.label ?? t(s.labelKey as 'status_change_label'),
    }))

    return (
      <div data-testid="status-change-control" className="flex flex-col gap-2" aria-label={ariaLabel}>
        <Combobox
          options={options}
          value={currentStatus}
          onChange={v => {
            const next = v as S
            if (!next || next === currentStatus) return
            startTransition(() => { handleSubmit(next) })
          }}
          variant="button"
          size="sm"
          disabled={disabled || pending}
          defaultOpen={defaultOpen}
        />

        {enableNote && (
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('status_change_note_placeholder')}
              className="min-h-18 text-sm resize-none"
              disabled={disabled || pending}
            />
            <Button
              size="sm"
              onClick={() => {
                const current = currentStatus
                if (current) startTransition(() => { handleSubmit(current) })
              }}
              disabled={disabled || pending || !note.trim()}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {submitLabel}
            </Button>
          </div>
        )}

        {historyEvents.length > 0 && (
          <StatusChangeHistory events={historyEvents} />
        )}
      </div>
    )
  }

  // ── Workflow variant ───────────────────────────────────────────────────────

  const allowedTransitions = transitions.filter(tr => tr.from === currentStatus)
  const isNoteRequired = requireNote || (selectedStatus
    ? (transitions.find(tr => tr.from === currentStatus && tr.to === selectedStatus)?.requireNote ?? false)
    : false)
  const canSubmit = selectedStatus !== null && selectedStatus !== currentStatus
    && (!isNoteRequired || note.trim().length > 0)
    && !disabled
    && !pending

  return (
    <div data-testid="status-change-control" className="rounded-xl border bg-muted/20 p-4 space-y-3" aria-label={ariaLabel}>
      <p className="text-sm font-medium">{t('status_change_label')}</p>

      {allowedTransitions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowedTransitions.map(tr => {
            const isSelected = selectedStatus === tr.to
            const statusOpt = statuses.find(s => s.code === tr.to)
            return (
              <Button
                key={String(tr.to)}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(isSelected ? null : tr.to)}
                disabled={disabled || pending}
                className={cn(
                  'min-h-11 transition-colors gap-1.5 whitespace-normal break-words h-auto',
                  !isSelected && tr.destructive && 'text-destructive border-destructive/40 hover:bg-destructive/10',
                  isSelected && tr.destructive && 'bg-destructive text-destructive-foreground',
                )}
              >
                {statusOpt?.icon}
                {tr.label ?? t(tr.labelKey as 'update_status_btn')}
              </Button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('status_change_no_change')}</p>
      )}

      <Textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={t('status_change_note_placeholder')}
        className="min-h-15 text-sm resize-none"
        disabled={disabled || pending}
        aria-required={isNoteRequired}
      />
      {isNoteRequired && note.trim().length === 0 && selectedStatus && (
        <p className="text-xs text-destructive">{t('status_change_note_required')}</p>
      )}

      <Button
        size="sm"
        onClick={() => { if (selectedStatus) startTransition(() => { handleSubmit(selectedStatus) }) }}
        disabled={!canSubmit}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
        {submitLabel}
      </Button>

      {historyEvents.length > 0 && (
        <StatusChangeHistory events={historyEvents} />
      )}
    </div>
  )
}
