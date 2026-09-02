'use client'

import { Button, Group, Stack } from '@mantine/core'

interface FilterMultiToggleProps {
  options: readonly { value: string; labelKey: string }[]
  selected: string[]
  onToggle: (value: string) => void
  getLabel: (key: string) => string
  /** Wrapper className — use 'flex-col gap-1.5' for vertical layout */
  className?: string
  /** Explicit vertical/horizontal request (Task 778) — the non-className path for consumers
   *  migrated off Tailwind utility strings. Resolution order below keeps the legacy `className`
   *  sniff working unchanged for `FilterControls.stories.tsx` and any other `className` consumer. */
  orientation?: 'horizontal' | 'vertical'
  /** Accessible name for the toggle-chip group (e.g. the section's own visible label). */
  ariaLabel?: string
}

export function FilterMultiToggle({
  options, selected, onToggle, getLabel, className, orientation, ariaLabel,
}: FilterMultiToggleProps) {
  // `className` is still an external override (`FilterControls.stories.tsx` exercises the vertical
  // branch through this path) — detect that request, or the explicit `orientation` prop (Task 778's
  // `ListingsFilters.tsx`, which passes no `className`), and render the corresponding Mantine
  // primitive instead of a Tailwind flex-col div.
  const vertical = orientation === 'vertical' || (className?.includes('flex-col') ?? false)
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
      <Stack {...rootProps} gap={6} className={className} data-testid="filter-chip-row">
        {buttons}
      </Stack>
    )
  }

  return (
    <Group {...rootProps} gap="xs" wrap="wrap" className={className} data-testid="filter-chip-row">
      {buttons}
    </Group>
  )
}
