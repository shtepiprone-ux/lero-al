'use client'

import { useMemo, useState } from 'react'
import { Box, Flex, ScrollArea, SegmentedControl, Text, useMantineTheme } from '@mantine/core'
import {
  tiraneYesterday,
  validateCustomRange,
  type CustomRangeValidation,
  type PeriodSelection,
} from '@/lib/dashboard/period'
import { RangeDatePicker, type DateRange } from './RangeDatePicker'

export type DashboardPeriodError = Exclude<CustomRangeValidation, 'ok'>

export interface DashboardPeriodControlLabels {
  label7d: string
  label30d: string
  labelCustom: string
  /** `RangeDatePicker` trigger placeholder while no custom range is chosen. */
  rangePlaceholder: string
  /** Accessible name of the segmented group, e.g. "Period". */
  scopeLabel: string
  /** Localized message per `validateCustomRange` code. */
  errors: Record<DashboardPeriodError, string>
}

export interface MantineDashboardPeriodControlProps {
  value: PeriodSelection
  /** Called with a typed selection. For `custom` it is called ONLY with a range that passed
   * `validateCustomRange`; an invalid range shows its error and never reaches this callback.
   * The consumer owns the URL (`serializePeriod`). */
  onChange: (next: PeriodSelection) => void
  /** The server's request time (ISO), so server and client agree on "yesterday" at hydration. */
  now: string
  labels: DashboardPeriodControlLabels
}

type Segment = PeriodSelection['kind']

const EMPTY_RANGE: DateRange = { from: undefined, to: undefined }

/** `'YYYY-MM-DD'` → a local-midnight `Date`, which is what `RangeDatePicker` compares against. */
function localDateOf(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Canonical dashboard period selector (spec v3.3 §4, §16.3, §17.3): the themed `SegmentedControl`
 * (7 days · 30 days · Custom) plus, for Custom, the existing `RangeDatePicker` reused as-is.
 *
 * - The picker's `maxDate` is yesterday in `Europe/Tirane`, so today (an incomplete day) cannot be
 *   selected.
 * - A picked range is checked with `validateCustomRange` (≤ 90 days, ordered, real dates); on a
 *   failure the localized message shows in a `role="alert"` `Text` and `onChange` is NOT called. The
 *   rejected range stays visible in the trigger so the user sees what was refused.
 * - Below `sm` the segmented control stretches to the full width and, when long labels overflow,
 *   swipe-scrolls — the canonical mobile pattern of `Mantine/Primitives/SegmentedControl`
 *   (`ScrollArea` + responsive `miw`).
 * - Keyboard: the segments are a radio group (arrow keys); the picker trigger is a focusable input.
 *
 * `'use client'`: local segment/range/error state and `useMantineTheme` (trigger width role).
 *
 * Production consumers: 853 (ADM-10), 854 (AGT-03–05, AGT-08–11).
 */
export function MantineDashboardPeriodControl({
  value,
  onChange,
  now,
  labels,
}: MantineDashboardPeriodControlProps) {
  const theme = useMantineTheme()
  const nowDate = useMemo(() => new Date(now), [now])
  const maxDate = useMemo(() => localDateOf(tiraneYesterday(nowDate)), [nowDate])

  // Custom mode opens on the user's own choice; a `custom` value from the URL also shows it.
  const [customOpen, setCustomOpen] = useState(false)
  const [pending, setPending] = useState<DateRange | null>(null)
  const [error, setError] = useState<DashboardPeriodError | null>(null)

  const segment: Segment = customOpen || value.kind === 'custom' ? 'custom' : value.kind
  const range: DateRange =
    pending ?? (value.kind === 'custom' ? { from: value.from, to: value.to } : EMPTY_RANGE)

  function handleSegment(next: string) {
    if (next === 'custom') {
      setCustomOpen(true)
      return
    }
    setCustomOpen(false)
    setPending(null)
    setError(null)
    onChange({ kind: next as '7d' | '30d' })
  }

  function handleRange(next: DateRange) {
    setPending(next)
    if (!next.from || !next.to) {
      setError(null)
      return
    }
    const result = validateCustomRange(next.from, next.to, nowDate)
    if (result !== 'ok') {
      setError(result)
      return
    }
    setError(null)
    onChange({ kind: 'custom', from: next.from, to: next.to })
  }

  return (
    <Flex direction="column" gap="xs" align={{ base: 'stretch', sm: 'flex-end' }}>
      <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
        <SegmentedControl
          miw={{ base: '100%', sm: 'auto' }}
          aria-label={labels.scopeLabel}
          value={segment}
          onChange={handleSegment}
          data={[
            { value: '7d', label: labels.label7d },
            { value: '30d', label: labels.label30d },
            { value: 'custom', label: labels.labelCustom },
          ]}
        />
      </ScrollArea>

      {segment === 'custom' && (
        <Box w={{ base: '100%', sm: theme.other.boxSize.compactTrigger }}>
          <RangeDatePicker
            value={range}
            onChange={handleRange}
            maxDate={maxDate}
            placeholder={labels.rangePlaceholder}
          />
        </Box>
      )}

      {error && (
        <Text c="red.7" size="xs" role="alert">
          {labels.errors[error]}
        </Text>
      )}
    </Flex>
  )
}
