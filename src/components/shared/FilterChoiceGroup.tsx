'use client'

import { Button, Group, Stack } from '@mantine/core'

export interface FilterChoiceOption {
  value: string
  labelKey: string
}

interface SharedProps {
  options: readonly FilterChoiceOption[]
  getLabel: (key: string) => string
  /** Wrapper className — use 'flex-col gap-1.5' for vertical layout */
  className?: string
  /** Explicit vertical/horizontal request (Task 778) — the non-className path for consumers
   *  migrated off Tailwind utility strings. Resolution order below keeps the legacy `className`
   *  sniff working unchanged for `FilterControls.stories.tsx` and any other `className` consumer. */
  orientation?: 'horizontal' | 'vertical'
  /** Accessible name for the toggle-chip group (e.g. the section's own visible label). */
  ariaLabel?: string
  /** Selected-state variant (Task 781R: `property_type` uses `light`; everything else `filled`). */
  variant?: 'filled' | 'light'
  /** Label alignment inside each button (Task 781R: `property_type` is left-aligned). */
  justify?: 'center' | 'flex-start'
}

export interface FilterChoiceGroupMultipleProps extends SharedProps {
  mode: 'multiple'
  selected: string[]
  onToggle: (value: string) => void
}

export interface FilterChoiceGroupSingleProps extends SharedProps {
  mode: 'single'
  selected: string
  onChange: (value: string) => void
  /** Rendered first, ahead of `options`, when supplied (e.g. an "All" entry). */
  allOption?: FilterChoiceOption
  /** Clicking the already-active option reverts selection to `allOption?.value ?? ''` instead of
   *  re-firing the same value. Off by default — matches `type`'s original no-deselect contract. */
  allowDeselect?: boolean
}

export type FilterChoiceGroupProps = FilterChoiceGroupMultipleProps | FilterChoiceGroupSingleProps

/**
 * Canonical single/multi-select toggle-button group (Task 781R — generalized from the
 * multi-select-only `FilterMultiToggle`).
 *
 * `mode="multiple"`: byte-identical to the former `FilterMultiToggle` contract — `selected` is an
 * array, `onToggle(value)` fires on every click, the caller owns add/remove semantics. Existing
 * consumers (`ListingsFilters.tsx`'s condition/layout_features/heating/wall_type/offer_type/
 * purchase_conditions, `FiltersPanel.tsx`'s same six) are unchanged beyond the explicit `mode`.
 *
 * `mode="single"`: `selected` is the single current value (`''` = none/all). `allOption`, when
 * given, is prepended to `options` as its own button (e.g. `{ value: '', labelKey: 'all' }`).
 * `allowDeselect` controls whether re-clicking the active option clears it back to
 * `allOption?.value ?? ''` — `type`/`market_type` (no deselect) vs `property_type` (deselect) per
 * their original, distinct contracts.
 *
 * Layout: horizontal renders a wrapping Mantine `Group` (`wrap="wrap"`) — each button sizes to its
 * own label and wraps onto a new row by the CONTAINER's real rendered width (flexbox), never a
 * viewport media query. This replaces three inline `SimpleGrid` compositions in
 * `ListingsFilters.tsx` whose responsive `cols` breakpoints keyed off viewport width, not the
 * drawer's own ~320px rendered width — forcing long labels (e.g. "Новобудова") into a
 * too-narrow fixed column at any viewport ≥640px regardless of the drawer's real width.
 */
export function FilterChoiceGroup(props: FilterChoiceGroupProps) {
  const {
    options, getLabel, className, orientation, ariaLabel,
    variant = 'filled', justify = 'center',
  } = props
  const vertical = orientation === 'vertical' || (className?.includes('flex-col') ?? false)
  const rootProps = ariaLabel ? { role: 'group' as const, 'aria-label': ariaLabel } : {}

  const allOptions = props.mode === 'single' && props.allOption ? [props.allOption, ...options] : options

  const isSelected = (value: string) =>
    props.mode === 'multiple' ? props.selected.includes(value) : props.selected === value

  const handleClick = (value: string) => {
    if (props.mode === 'multiple') {
      props.onToggle(value)
      return
    }
    const target = props.allowDeselect && props.selected === value
      ? (props.allOption?.value ?? '')
      : value
    props.onChange(target)
  }

  const buttons = allOptions.map(opt => (
    <Button
      key={opt.value}
      type="button"
      variant={isSelected(opt.value) ? variant : 'default'}
      justify={justify}
      onClick={() => handleClick(opt.value)}
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
