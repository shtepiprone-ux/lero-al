'use client'

import type { ReactNode } from 'react'
import { Group, Progress, Stack, Text } from '@mantine/core'

export interface MantineProgressProps {
  /** Progress value 0–100. Clamped to that range (parity with the legacy component's numeric-only contract). */
  value: number
  /** Track+fill height: `sm`=8px, `md`=12px (default), `lg`=16px, `xl`=20px — §6 Progress row. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Rendered left of the value, above the bar (legacy `ProgressLabel`). */
  label?: ReactNode
  /** Rendered right of the label, above the bar, `tabular-nums` (legacy `ProgressValue`). Takes precedence over `showValue`. */
  valueLabel?: ReactNode
  /** Convenience: render `${clampedValue}%` as the value label when `valueLabel` is not supplied. */
  showValue?: boolean
  /** Required when neither `label` nor a value label is visible — the only accessible name for the bar. */
  'aria-label'?: string
}

/**
 * Canonical TailAdmin-conformant progress bar (Task 539 / Epic MM P1.23).
 *
 * Built directly on Mantine's top-level `<Progress>` (single-section — no `Progress.Root`/`.Section`
 * compound needed, this primitive never renders multiple stacked segments). The legacy `progress.tsx`
 * (`ProgressLabel`/`ProgressValue`) renders its label/value row ABOVE the track, not inside it — this
 * wrapper preserves that exact shape: an optional `label`/value `Group` above a full-width `<Progress>`.
 *
 * TailAdmin chrome (§6 Progress row: "track bg gray-200 `#e4e7ec`, fill brand, `rounded-full` (pill),
 * track heights 8/12/16/20px (sm/md/lg/xl), fill height = track height") is achieved with **zero raw
 * hex/px in this file** — `theme.components.Progress` (theme.ts) supplies `radius:'pill'` + the
 * 8/12/16/20 size-to-height mapping; Mantine's own defaults already resolve track color to
 * `gray-2`/`#e4e7ec` and fill color to `theme.primaryColor` ('brand') with no override needed (verified
 * against `node_modules/@mantine/core/styles/Progress.css`, not assumed).
 *
 * a11y: Mantine's `ProgressSection` already renders `role="progressbar"` +
 * `aria-valuenow/valuemin/valuemax/valuetext` (verified in `Progress.mjs`/`ProgressSection.mjs`, not
 * assumed) and forwards `aria-label`. This wrapper only decides WHEN `aria-label` is the bar's sole
 * accessible name — when no visible label/value row is rendered.
 *
 * SSR-deterministic: `value` comes entirely from props, no client-only branch, no `useEffect`-gated
 * first render — unlike the overlay primitives, there is no `isMobile`/hydration caveat here.
 *
 * Mobile <640 gate: full-width at every breakpoint (`w="100%"`), the SAME at `<640` as `≥640` — this is
 * a non-interactive DISPLAY element (not an overlay, not a focusable control), so the bottom-sheet/
 * touch-target/full-width-Button rules do not apply (documented exemption, Task 539 §7).
 */
export function MantineProgress({
  value,
  size = 'md',
  label,
  valueLabel,
  showValue,
  'aria-label': ariaLabel,
}: MantineProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const resolvedValueLabel = valueLabel ?? (showValue ? `${clamped}%` : undefined)
  const hasVisibleLabelRow = !!label || resolvedValueLabel !== undefined

  return (
    <Stack gap={6} w="100%">
      {hasVisibleLabelRow && (
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          {label && (
            <Text size="sm" fw={500} c="gray.7" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {label}
            </Text>
          )}
          {resolvedValueLabel !== undefined && (
            <Text size="sm" c="gray.5" ml="auto" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {resolvedValueLabel}
            </Text>
          )}
        </Group>
      )}
      <Progress value={clamped} size={size} w="100%" aria-label={hasVisibleLabelRow ? undefined : ariaLabel} />
    </Stack>
  )
}
