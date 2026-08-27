'use client'

import { useEffect, useMemo, useState, type KeyboardEventHandler, type ReactNode } from 'react'
import {
  Box,
  Combobox,
  Group,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useCombobox,
  type TextInputProps,
} from '@mantine/core'
import { normalizeSearch } from '@/lib/utils'
import { useResponsiveDropdown, ResponsiveBottomSheet } from './responsiveBottomSheet'

export interface MantineComboboxOption {
  value: string
  /** Shown in the trigger. Also used in the dropdown/sheet if `dropdownLabel` is absent. */
  label: string
  /** Shown in the dropdown/sheet row only — can differ from `label` (e.g. localized long form). */
  dropdownLabel?: string
  /** Right-aligned secondary text in the row. */
  description?: string
  /** Extra text matched against on filter — never displayed. */
  searchText?: string
}

export interface MantineComboboxProps {
  options: MantineComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Validation error shown below the field (§6e — field only; label stays gray, per §6e). */
  error?: ReactNode
  /** Leading icon inside the trigger. */
  icon?: ReactNode
  /**
   * `'input'`  — searchable text-input trigger; typing filters (default).
   * `'button'` — compact click-to-open trigger; optional in-dropdown search via `searchable`.
   */
  variant?: 'input' | 'button'
  /** `variant="button"` only: adds a search field INSIDE the dropdown/sheet (not on the trigger). */
  searchable?: boolean
  /** Placeholder for the in-dropdown search field (`variant="button"` + `searchable`, or the mobile sheet's own search field for `variant="input"`). */
  searchPlaceholder?: string
  /** Non-filtered "clear" row pinned at the top. Selecting it fires `onChange('')`. */
  clearLabel?: string
  /** Localized "no results" text — the primitive does not own an i18n hook (matches every other Mantine pattern in this codebase); the consumer supplies it. */
  noResultsLabel: string
  /** `aria-label` for `variant="button"` when the trigger has no visible text (icon-only is NOT expected for this primitive — pass a label regardless). */
  triggerAriaLabel?: string
  /** Optional title shown at the top of the mobile bottom sheet. */
  sheetTitle?: ReactNode
  /**
   * Override the trigger's width (defaults to `{ base: '100%', sm: 'auto' }` — full-width `<640`,
   * content-width on desktop, per clause 11). Pass a fixed value or a responsive object, e.g.
   * `{ base: '100%', sm: '100%' }` to keep the trigger at the width of its wrapper on desktop too
   * (Task 551). Omit to keep the existing default — this prop changes nothing when absent.
   */
  triggerWidth?: TextInputProps['w']
  /**
   * `variant="input"` only: `inputMode` passed to BOTH the desktop trigger `<TextInput>` and the
   * mobile sheet's own search field (e.g. `"numeric"` for numeric-typeahead consumers). Default
   * `undefined` — this prop changes nothing when absent (Task 552).
   */
  inputMode?: TextInputProps['inputMode']
  /**
   * `variant="input"` only: fired with the raw typed value on every keystroke, from BOTH the
   * desktop trigger and the mobile sheet's own search field. When provided, the primitive does
   * NOT fire its own `onChange('')` on keystroke — the consumer becomes the single source of
   * on-type commits (internal `search`/filtering still updates as usual, and selecting an option
   * still commits normally). Absent → byte-identical to today (Task 552).
   */
  onInputChange?: (raw: string) => void
  /**
   * `variant="input"` only: passed to the DESKTOP trigger `<TextInput>` only (never the mobile
   * sheet's search field, where Enter should filter/commit a location, not navigate away). Fires
   * after the primitive's own keystroke handling. Use for e.g. Enter-to-search passthroughs
   * (Task 553). Default `undefined` — this prop changes nothing when absent.
   */
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  /**
   * Minimum pixel width for the DESKTOP anchored dropdown only (the mobile path is already a
   * full-width bottom sheet, unaffected). Use when the trigger is much narrower than its dropdown
   * content (e.g. a compact fixed-width `variant="button"` trigger with long localized option
   * rows — Task 556). Default `undefined` — this prop changes nothing when absent.
   */
  dropdownMinWidth?: number
  /**
   * Passed straight through to Mantine's `Combobox` (which defaults it to `true`). Set `false`
   * when this combobox is rendered INSIDE another floating layer whose `closeOnClickOutside`
   * would otherwise tear that layer down: Mantine's `Popover` closes via `useClickOutside`, which
   * tests `event.composedPath().includes(dropdownNode)` on `mousedown` — a portalled option list
   * is a SIBLING of the outer dropdown in `[data-mantine-shared-portal-node]`, never a
   * descendant, so pressing an option reads as an outside click and closes the outer layer
   * (Task 773 — `RangeDatePicker`'s in-calendar month/year selectors). Default `undefined` —
   * this prop changes nothing when absent (Mantine's own `true` still applies).
   */
  withinPortal?: boolean
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: 'var(--mantine-color-brand-7)' }}
    >
      <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function filterOptions(options: MantineComboboxOption[], query: string): MantineComboboxOption[] {
  const q = query ? normalizeSearch(query) : ''
  if (!q) return options
  return options.filter(
    (o) =>
      normalizeSearch(o.label).includes(q) ||
      (o.dropdownLabel && normalizeSearch(o.dropdownLabel).includes(q)) ||
      (o.description && normalizeSearch(o.description).includes(q)) ||
      (o.searchText && normalizeSearch(o.searchText).includes(q)),
  )
}

/**
 * Canonical P0-compliant responsive searchable combobox (Task 537 / Epic MM P1.21).
 *
 * Built on Mantine's LOW-LEVEL `Combobox` primitive family (`Combobox.Target`/`.Dropdown`/
 * `.Options`/`.Option`/`.Search`/`.Empty` + `useCombobox`) — NOT the higher-level `<Select>`
 * (as `MantineSelect` uses). Decision (owner-confirmed, Task 537 STOP-and-ASK #1): the legacy
 * `Combobox.tsx` supports a `variant="button"` trigger with an OPTIONAL search field rendered
 * INSIDE the dropdown (not on the trigger) — a pattern Mantine's `<Select searchable>` cannot
 * express (its search field IS the trigger). Mantine's own low-level `Combobox` primitive is
 * architected exactly for this "custom target + optional in-dropdown search" composition
 * (`Combobox.Target` wraps an arbitrary element; `Combobox.Search` is a separate compound
 * placed inside `Combobox.Dropdown`) — reusing it, rather than forking two different
 * implementations per variant, keeps ONE component/one behavior for all future consumers.
 *
 * `<640` reuses the shared `responsiveBottomSheet` foundation (Task 514, same as
 * `MantineSelect`/`MantinePopover`) — NOT Mantine's own `Combobox.Dropdown` (a Popover), which
 * is desktop-anchored positioning, not the P0 bottom-sheet contract. The mobile sheet renders
 * its OWN option-row list (mirroring `MantineSelect`'s mobile sheet) rather than trying to
 * reposition the SAME popup via CSS, matching the established Batch-C pattern (separate mobile
 * rendering, not literal DOM repositioning of one node — see `MantineTooltip`/`MantineDrawer`).
 * For `variant="input"` — and for `variant="button"` when `searchable` — the mobile sheet also
 * gets its own search field at the top, since typing-to-filter must stay reachable on mobile to
 * remain behaviorally at parity with legacy `Combobox.tsx` (that component's own mobile bottom
 * sheet is literally the SAME `<input>` CSS-repositioned to the bottom — a DOM mechanism this
 * primitive cannot replicate via a portal-rendered `Drawer`, so a separate mobile search field
 * is the parity-preserving equivalent, not a regression).
 *
 * TailAdmin chrome — every value cited, nothing invented:
 * - Trigger (`variant="input"`): a real Mantine `<TextInput>` — inherits §6d/§6e resting/focus/
 *   error/disabled chrome for free via the EXISTING `.mantine-TextInput-input` rules in
 *   `input-chrome.css` (Task 505/527/528). Zero new CSS needed for this path.
 * - Trigger (`variant="button"`): a `<TextInput readOnly>` — same §6d/§6e chrome, click-only
 *   instead of type-to-filter (this is what "compact, non-typing trigger" means once the input
 *   is read-only: it still looks like a themed Select-style trigger, just doesn't accept text).
 * - In-dropdown search field (`Combobox.Search`, `variant="button"`+`searchable`) and the
 *   mobile sheet's own search field: styled via a new `.mantine-Combobox-search` rule added to
 *   `input-chrome.css`, reusing the EXACT §6e resting/focus token values verbatim (Task 537
 *   STOP-and-ASK #4, option A — no new §6x extraction needed, this is not a new value, only an
 *   additional selector consuming the same existing tokens).
 * - Dropdown/sheet items: §6l item chrome (14px / gray-7 / ~10×12 padding / `lg` radius),
 *   matching the existing `Menu`/`MantineSelect` item convention exactly.
 * - "No results" row: §6l/§6d muted convention (14px gray-5), matching `MantineSelect`'s
 *   existing mobile empty-state `<Text size="sm" c="gray.5">` pattern.
 *
 * `portal` mode (legacy prop for rendering inside `overflow:hidden` containers, e.g. admin
 * tables) is DEFERRED to the Phase-2 task that first needs it (Task 537 STOP-and-ASK #2,
 * owner-pre-authorized default path) — Mantine's `Combobox` already renders its dropdown via a
 * `Popover`/portal by default (`withinPortal` defaults `true`), so this primitive does not clip
 * inside a scroll container out of the box. `dropdownMinWidth` (Task 556 STOP-and-ASK #2, owner
 * Option A) covers the first Phase-2 consumer that needs it — a compact fixed-width trigger
 * (`PhoneField`'s country selector) whose dropdown content is wider than the trigger itself.
 *
 * Task 773 adds the opt-OUT (`withinPortal={false}`) rather than the legacy opt-in: portalling is
 * still the right default for the clipping case above, but it is the WRONG default when this
 * primitive is nested inside another floating layer — see the `withinPortal` prop doc below.
 */
export function MantineCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  icon,
  variant = 'input',
  searchable = false,
  searchPlaceholder,
  clearLabel,
  noResultsLabel,
  triggerAriaLabel,
  sheetTitle,
  triggerWidth,
  inputMode,
  onInputChange,
  onKeyDown,
  dropdownMinWidth,
  withinPortal,
}: MantineComboboxProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const [search, setSearch] = useState('')
  const [sheetSearch, setSheetSearch] = useState('')
  const selected = options.find((o) => o.value === value)

  // Reset search when the value is cleared externally (parity with legacy Combobox.tsx).
  useEffect(() => {
    if (!value) setSearch('')
  }, [value])

  // Reset the mobile sheet's own search whenever it closes (fresh state on re-open — Negative
  // flow "double-open / re-entry").
  useEffect(() => {
    if (!drawerOpened) setSheetSearch('')
  }, [drawerOpened])

  const desktopQuery = variant === 'input' ? search : search
  const desktopFiltered = useMemo(() => filterOptions(options, desktopQuery), [options, desktopQuery])
  const sheetQuery = variant === 'input' || searchable ? sheetSearch : ''
  const sheetFiltered = useMemo(() => filterOptions(options, sheetQuery), [options, sheetQuery])

  const handleSelect = (val: string) => {
    onChange(val)
    setSearch('')
    setSheetSearch('')
    combobox.closeDropdown()
    closeDrawer()
  }

  const renderDesktopOption = (opt: MantineComboboxOption) => (
    <Combobox.Option value={opt.value} key={opt.value} active={value === opt.value}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        {/* Plain span (not <Text>) — inherits font-size/color from the themed `.mantine-Combobox-option`
            element (theme.ts Combobox.styles.option, §6l 14px/gray-7), matching the established
            Menu.Item pattern (MantineDropdownMenu renders `{item.label}` bare, no Text wrapper). */}
        <span style={{ wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 0 }}>
          {opt.dropdownLabel ?? opt.label}
        </span>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          {opt.description && (
            <Text size="xs" c="gray.5">
              {opt.description}
            </Text>
          )}
          {value === opt.value && <CheckIcon />}
        </Group>
      </Group>
    </Combobox.Option>
  )

  const triggerCommonProps = {
    placeholder,
    disabled,
    error,
    leftSection: icon,
    rightSection: <Combobox.Chevron />,
    w: triggerWidth ?? ({ base: '100%', sm: 'auto' } as const),
    radius: 'lg' as const,
  }

  return (
    <Box>
      <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal={withinPortal}>
        <Combobox.Target targetType={variant === 'input' ? 'input' : 'button'}>
          {variant === 'input' ? (
            <TextInput
              {...triggerCommonProps}
              value={selected ? selected.label : search}
              onChange={(e) => {
                const raw = e.currentTarget.value
                setSearch(raw)
                if (!onInputChange) onChange('')
                combobox.openDropdown()
                combobox.updateSelectedOptionIndex()
                onInputChange?.(raw)
              }}
              inputMode={inputMode}
              onClick={() => {
                if (disabled) return
                if (isMobile) openDrawer()
                else combobox.openDropdown()
              }}
              onFocus={() => {
                if (!isMobile) combobox.openDropdown()
              }}
              onBlur={() => combobox.closeDropdown()}
              onKeyDown={onKeyDown}
              readOnly={isMobile}
            />
          ) : (
            <TextInput
              {...triggerCommonProps}
              value={selected ? selected.label : ''}
              readOnly
              aria-label={triggerAriaLabel}
              onClick={() => {
                if (disabled) return
                if (isMobile) openDrawer()
                else combobox.toggleDropdown()
              }}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
          )}
        </Combobox.Target>

        {!isMobile && (
          <Combobox.Dropdown style={dropdownMinWidth ? { minWidth: dropdownMinWidth } : undefined}>
            {variant === 'button' && searchable && (
              <Combobox.Search
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder={searchPlaceholder}
              />
            )}
            {/* Desktop scroll cap (Task 552): long lists (e.g. YearCombobox's ~80 years) render
                unbounded without this — `Combobox.Options` carries no default max-height, unlike
                `MantineSelect` (Mantine's own `<Select>`, whose built-in `maxDropdownHeight`
                resolves to 220px, empirically measured via a rendered long-list `getComputedStyle`
                proof, NOT the legacy `Combobox.tsx`'s unrelated 224px `max-h-56`). Matches the
                sibling canonical primitive rather than inventing a new value. */}
            <Combobox.Options mah={220} style={{ overflowY: 'auto' }}>
              {clearLabel && (
                <Combobox.Option value="" key="__clear__" active={value === ''}>
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <span style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {clearLabel}
                    </span>
                    {value === '' && <CheckIcon />}
                  </Group>
                </Combobox.Option>
              )}
              {desktopFiltered.length === 0 ? (
                <Combobox.Empty>
                  <Text size="sm" c="gray.5">
                    {noResultsLabel}
                  </Text>
                </Combobox.Empty>
              ) : (
                desktopFiltered.map(renderDesktopOption)
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        )}
      </Combobox>

      {isMobile && (
        <ResponsiveBottomSheet opened={drawerOpened} onClose={closeDrawer} title={sheetTitle}>
          <Stack gap={0}>
            {(variant === 'input' || searchable) && (
              <Box px="md" pb="sm">
                <TextInput
                  value={sheetSearch}
                  onChange={(e) => {
                    const raw = e.currentTarget.value
                    setSheetSearch(raw)
                    if (variant === 'input') onInputChange?.(raw)
                  }}
                  placeholder={searchPlaceholder ?? placeholder}
                  radius="lg"
                  inputMode={variant === 'input' ? inputMode : undefined}
                />
              </Box>
            )}
            {clearLabel && (
              <UnstyledButton
                onClick={() => handleSelect('')}
                w="100%"
                mih="2.75rem"
                py="sm"
                px="md"
              >
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Text
                    size="sm"
                    c={value === '' ? 'brand.7' : 'gray.7'}
                    fw={value === '' ? 500 : 400}
                    style={{ wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 0 }}
                  >
                    {clearLabel}
                  </Text>
                  {value === '' && <CheckIcon />}
                </Group>
              </UnstyledButton>
            )}
            {sheetFiltered.length === 0 ? (
              <Box py="md" px="md">
                <Text size="sm" c="gray.5" ta="center">
                  {noResultsLabel}
                </Text>
              </Box>
            ) : (
              sheetFiltered.map((opt) => (
                <UnstyledButton
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  w="100%"
                  mih="2.75rem"
                  py="sm"
                  px="md"
                >
                  <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                    <Text
                      size="sm"
                      c={value === opt.value ? 'brand.7' : 'gray.7'}
                      fw={value === opt.value ? 500 : 400}
                      style={{ wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 0 }}
                    >
                      {opt.dropdownLabel ?? opt.label}
                    </Text>
                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                      {opt.description && (
                        <Text size="xs" c="gray.5">
                          {opt.description}
                        </Text>
                      )}
                      {value === opt.value && <CheckIcon />}
                    </Group>
                  </Group>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ResponsiveBottomSheet>
      )}
    </Box>
  )
}
