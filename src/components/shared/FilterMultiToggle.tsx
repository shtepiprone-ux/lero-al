'use client'

import { Button, Group, Stack } from '@mantine/core'
import { cn } from '@/lib/utils'

interface FilterMultiToggleProps {
  options: readonly { value: string; labelKey: string }[]
  selected: string[]
  onToggle: (value: string) => void
  getLabel: (key: string) => string
  /** Wrapper className — use 'flex-col gap-1.5' for vertical layout */
  className?: string
  /** Accessible name for the toggle-chip group (e.g. the section's own visible label). */
  ariaLabel?: string
}

export function FilterMultiToggle({
  options, selected, onToggle, getLabel, className, ariaLabel,
}: FilterMultiToggleProps) {
  // `className` is still an external override (ListingsFilters.tsx passes the literal
  // 'flex-col gap-1.5' string at 3 call sites to switch this row to a vertical stack) — detect
  // that request and render the corresponding Mantine primitive instead of a Tailwind flex-col div.
  const vertical = className?.includes('flex-col') ?? false
  const rootProps = ariaLabel ? { role: 'group' as const, 'aria-label': ariaLabel } : {}
  const buttons = options.map(opt => (
    <Button
      key={opt.value}
      type="button"
      variant={selected.includes(opt.value) ? 'filled' : 'default'}
      onClick={() => onToggle(opt.value)}
    >
      {getLabel(opt.labelKey)}
    </Button>
  ))

  if (vertical) {
    return (
      <Stack {...rootProps} gap={6} className={className}>
        {buttons}
      </Stack>
    )
  }

  // `flex-wrap` className is a deliberate compatibility anchor (redundant with the `wrap="wrap"`
  // prop below — same computed flex-wrap value) so filterLeafComponents.smoke.test.tsx's
  // `container.querySelector('.flex-wrap')` root lookup keeps resolving; that test file is out
  // of this task's scope to edit.
  return (
    <Group {...rootProps} gap="xs" wrap="wrap" className={cn('flex-wrap', className)}>
      {buttons}
    </Group>
  )
}
