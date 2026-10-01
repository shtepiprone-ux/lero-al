'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Stack, Textarea } from '@mantine/core'
import { MantineSelect } from '@/design-system/mantine/patterns'
import { toast } from '@/lib/toast'

export type StatusSelectOption<S extends string> = {
  code: S
  /** Human-readable label. When provided, used directly (preferred in Stories). */
  label?: string
  /** i18n key in the `admin.common.status_control` namespace. Used when `label` is not set. */
  labelKey: string
}

export interface StatusChangeSelectProps<S extends string> {
  currentStatus: S
  statuses: StatusSelectOption<S>[]
  /** A rejection is shown as the error toast; a resolution as the success toast. */
  onSubmit: (next: { toStatus: S; note: string | null }) => Promise<void> | void
  /** Adds an optional note and a submit button that re-submits the current status with the note. */
  enableNote?: boolean
  /** i18n key in `admin.common.status_control` for the note submit button; defaults to `update_status_btn`. */
  submitLabelKey?: string
  disabled?: boolean
  'aria-label'?: string
}

/**
 * Canonical status select (Task 894, GR-0 CREATE): the `select` variant of the legacy `StatusChangeControl`
 * on the canonical `MantineSelect` (bottom sheet below 640px), plus the optional note path. Picking a different
 * status calls `onSubmit({ toStatus, note })`; success shows `status_change_success`, a thrown error shows
 * `status_change_error`. The legacy control stays for `ListingFormShellView` until Task 796 switches it here.
 */
export function StatusChangeSelect<S extends string>({
  currentStatus,
  statuses,
  onSubmit,
  enableNote = false,
  submitLabelKey,
  disabled = false,
  'aria-label': ariaLabel,
}: StatusChangeSelectProps<S>) {
  const t = useTranslations('admin.common.status_control')
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState('')

  const submitLabel = submitLabelKey
    ? t(submitLabelKey as 'update_status_btn')
    : t('update_status_btn')

  const data = statuses.map(s => ({
    value: s.code as string,
    label: s.label ?? t(s.labelKey as 'status_change_label'),
  }))

  async function handleSubmit(toStatus: S) {
    const noteValue = note.trim() || null
    setPending(true)
    try {
      await onSubmit({ toStatus, note: noteValue })
      toast.success(t('status_change_success'))
      setNote('')
    } catch {
      toast.error(t('status_change_error'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Stack gap="sm" data-testid="status-change-control">
      <MantineSelect
        data={data}
        value={currentStatus}
        allowDeselect={false}
        aria-label={ariaLabel}
        disabled={disabled || pending}
        onChange={v => {
          if (!v || v === currentStatus) return
          void handleSubmit(v as S)
        }}
      />

      {enableNote && (
        <Stack gap="xs">
          <Textarea
            value={note}
            onChange={e => setNote(e.currentTarget.value)}
            placeholder={t('status_change_note_placeholder')}
            autosize
            minRows={2}
            disabled={disabled || pending}
          />
          <Button
            size="sm"
            w={{ base: '100%', sm: 'auto' }}
            loading={pending}
            disabled={disabled || pending || !note.trim()}
            onClick={() => { void handleSubmit(currentStatus) }}
          >
            {submitLabel}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
