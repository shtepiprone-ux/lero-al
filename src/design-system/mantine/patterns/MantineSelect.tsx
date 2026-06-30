'use client'

import { Select, Box, Text, UnstyledButton, Stack, Group } from '@mantine/core'
import type { SelectProps, ComboboxData, ComboboxItem } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet } from './responsiveBottomSheet'

// ── Internal helpers ──────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{
        width: '1rem',
        height: '1rem',
        flexShrink: 0,
        color: 'var(--mantine-color-brand-7)',
      }}
    >
      <path
        d="M3 8L6.5 11.5L13 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function flattenData(data: ComboboxData | undefined): ComboboxItem[] {
  if (!data) return []
  const items: ComboboxItem[] = []
  for (const d of data) {
    if (typeof d === 'string') {
      items.push({ value: d, label: d })
    } else if ('group' in d) {
      for (const item of d.items) {
        if (typeof item === 'string') items.push({ value: item, label: item })
        else items.push(item as ComboboxItem)
      }
    } else {
      items.push(d as ComboboxItem)
    }
  }
  return items
}

// ── MantineSelect ─────────────────────────────────────────────────────────────

export interface MantineSelectProps extends SelectProps {}

/**
 * Canonical P0-compliant responsive Select.
 *
 * ONE component for all consumers — no "plain Select vs bottom-sheet Select" choice.
 * Responsive by default: anchored dropdown at ≥640px (desktop), full-width bottom sheet
 * at <640px (mobile). The §6d themed chrome is preserved on both paths.
 *
 * Desktop (≥640px): standard themed <Select> — gray-2 border / shadow-xs / brand focus ring /
 * 44px min-height / disabled whole-control fade (label + field + chevron). No API change.
 *
 * Mobile (<640px): the same themed <Select> serves as the trigger (§6d chrome preserved).
 * Its anchored dropdown is suppressed via `dropdownOpened={false}`; `onDropdownOpen` instead
 * opens a P0-compliant ResponsiveBottomSheet (from the Task 514 single-source foundation):
 *   - Anchored to the bottom edge, edge-to-edge (inner padding 0)
 *   - Rounded top corners only (radius lg on top, 0 on bottom)
 *   - Drag handle centered at top of sheet
 *   - ≤90dvh with internal vertical scroll
 *   - ≥44px touch targets on every option row
 *   - Long sq/en/uk/it labels wrap (whitespace-normal break-word), never clip, no h-scroll@320
 *   - Closes on backdrop tap + Esc; returnFocus=true
 *   - Disabled: trigger shows §6d disabled fade, tapping does NOT open the sheet
 *
 * Selecting an option closes the sheet and fires the same onChange as on desktop.
 * All SelectProps are forwarded unchanged — no consumer API break.
 *
 * Foundation: useResponsiveDropdown() + ResponsiveBottomSheet live in
 * ./responsiveBottomSheet.tsx — single source consumed by all Batch C overlays.
 *
 * SSR/hydration: isMobile=false on first render (same caveat as MantineDialogDrawerPattern).
 * Sheet is always closed on SSR; both paths render the same <Select> trigger.
 */
export function MantineSelect({
  value,
  onChange,
  data,
  label,
  placeholder,
  description,
  error,
  disabled,
  ...rest
}: MantineSelectProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()
  const items = flattenData(data)

  const handleOptionSelect = (val: string) => {
    const item = items.find(i => i.value === val)
    onChange?.(val, item ?? { value: val, label: val })
    closeDrawer()
  }

  return (
    <>
      <Select
        {...rest}
        value={value}
        onChange={onChange}
        data={data}
        label={label}
        placeholder={placeholder}
        description={description}
        error={error}
        disabled={disabled}
        // P0 full-width at <640px; auto on desktop
        w={{ base: '100%', sm: 'auto' }}
        // Mobile: suppress anchored dropdown; openDrawer on open-intent.
        // Desktop: undefined = uncontrolled (normal Select dropdown behavior).
        dropdownOpened={isMobile ? false : undefined}
        onDropdownOpen={isMobile && !disabled ? openDrawer : undefined}
      />

      {/* P0 bottom sheet — rendered via shared foundation (Task 514) */}
      {isMobile && (
        <ResponsiveBottomSheet
          opened={drawerOpened}
          onClose={closeDrawer}
          title={label}
        >
          <Stack gap={0}>
            {items.length === 0 ? (
              /* Empty state: show placeholder text */
              <Box py="md" px="md">
                <Text size="sm" c="gray.5" ta="center">
                  {placeholder ?? ''}
                </Text>
              </Box>
            ) : (
              items.map(item => (
                <UnstyledButton
                  key={item.value}
                  onClick={() => {
                    if (!item.disabled) handleOptionSelect(item.value)
                  }}
                  disabled={item.disabled}
                  w="100%"
                  mih="2.75rem"
                  py="sm"
                  px="md"
                  style={{ opacity: item.disabled ? 0.5 : 1 }}
                >
                  <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                    <Text
                      size="sm"
                      c={value === item.value ? 'brand.7' : 'gray.8'}
                      fw={value === item.value ? 500 : 400}
                      style={{
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        minWidth: 0,
                      }}
                    >
                      {item.label}
                    </Text>
                    {value === item.value && <CheckIcon />}
                  </Group>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ResponsiveBottomSheet>
      )}
    </>
  )
}
