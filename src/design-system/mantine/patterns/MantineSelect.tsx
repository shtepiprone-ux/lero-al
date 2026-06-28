'use client'

import { Select, Drawer, Box, Text, UnstyledButton, Stack, Group } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import type { SelectProps, ComboboxData, ComboboxItem } from '@mantine/core'

// ── Shared bottom-sheet Drawer styles ────────────────────────────────────────
// Canonical P0 bottom-sheet treatment, identical to MantineDialogDrawerPattern (Task 482).
// Batch C overlays (Menu/Popover/Combobox/NavigationMenu) import this constant
// instead of copy-pasting — single source of truth for the bottom-sheet look.
// Justified raw values: drag-handle 2.5rem/0.25rem, 90dvh, 0.5rem padding-bottom
// are P0 bottom-sheet exemptions already used by MantineDialogDrawerPattern.
export const bottomSheetDrawerStyles = {
  content: {
    borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
    maxHeight: '90dvh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: { paddingBottom: 0 },
  body: { flex: 1, overflowY: 'auto' as const, padding: 0 },
  inner: { padding: 0 },
}

// ── Foundation hook ───────────────────────────────────────────────────────────
/**
 * useResponsiveDropdown — shared foundation hook for dropdown → bottom-sheet at <640px.
 *
 * Returns isMobile state + Drawer open/close controls. Batch C overlays (Menu, Popover,
 * Combobox, NavigationMenu) consume this hook alongside bottomSheetDrawerStyles to build
 * the P0 bottom-sheet pattern without copy-pasting either piece.
 *
 * SSR/hydration caveat: isMobile returns false on first render (getInitialValueInEffect=true
 * in Mantine v8 — query evaluated in useEffect after hydration). The Drawer is always closed
 * on SSR so there is no visible flash. Same documented trade-off as MantineDialogDrawerPattern.
 */
export function useResponsiveDropdown() {
  const isMobile = useMediaQuery('(max-width: 40em)')
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)
  return {
    isMobile: isMobile ?? false,
    drawerOpened,
    openDrawer,
    closeDrawer,
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
      <Box
        style={{
          width: '2.5rem',
          height: '0.25rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--mantine-color-gray-3)',
        }}
      />
    </Box>
  )
}

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
 * opens a P0-compliant bottom Drawer:
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
 * Reusable foundation: useResponsiveDropdown() + bottomSheetDrawerStyles (exported from this
 * file) are the shared mechanism Batch C overlays consume without copy-pasting.
 *
 * SSR/hydration: isMobile=false on first render (same caveat as MantineDialogDrawerPattern).
 * Drawer is always closed on SSR; both paths render the same <Select> trigger.
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

      {/* P0 bottom sheet — only rendered on mobile to avoid SSR markup */}
      {isMobile && (
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          position="bottom"
          withCloseButton={false}
          size="auto"
          returnFocus
          title={
            <Box>
              {/* Drag handle — visual swipe affordance */}
              <DragHandle />
              {label && (
                <Text fw={600} size="sm" c="gray.8">
                  {label}
                </Text>
              )}
            </Box>
          }
          styles={bottomSheetDrawerStyles}
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
        </Drawer>
      )}
    </>
  )
}
