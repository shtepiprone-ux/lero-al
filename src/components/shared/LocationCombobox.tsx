'use client'

import { useState, useMemo } from 'react'
import type { KeyboardEventHandler } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { MapPin } from 'lucide-react'
import { Anchor, Button, Flex, TextInput, Text, useMantineTheme } from '@mantine/core'
import { MantineCombobox, MantineAddItemPanel } from '@/design-system/mantine/patterns'
import { cn, capitalize, normalizeSearch } from '@/lib/utils'

export interface LocationOption {
  id: number
  name_al: string
  /** English name — present when the consumer fetches from `getSearchableLocations()`.
   *  Falls back to `name_al` when null/undefined. */
  name_en?: string | null
  type?: string
  region_id?: number | null
}

export interface RegionOption {
  id: number
  name_al: string
  name_en?: string | null
}

/** Resolve the display label for a location based on the active locale.
 *  - en → name_en (fallback name_al); sq → name_al; uk/it → name_al (no data).
 *  Always capitalized via the canonical capitalize() util. */
function resolveLocationLabel(loc: LocationOption, locale: string): string {
  const raw = locale === 'en' ? (loc.name_en ?? loc.name_al) : loc.name_al
  return capitalize(raw)
}

interface Props {
  locations: LocationOption[]
  value: string
  onChange: (id: string | null) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  /** Validation error message (shown below the input) */
  error?: string
  /** When provided together with onAddLocation, shows "+ Додати населений пункт" button */
  regions?: RegionOption[]
  /** Admin callback to persist a new city; receives name + region_id, returns the new id */
  onAddLocation?: (data: { name_al: string; region_id: number }) => Promise<{ id?: number; error?: string }>
  /**
   * Documented no-op (Task 552/553 pattern): `MantineCombobox`'s dropdown/sheet always renders
   * via a portal (`Combobox.Dropdown`'s `withinPortal` defaults `true`; the mobile path is a
   * portaled bottom sheet), so it never clips inside an `overflow:hidden/auto` container
   * regardless of this flag. Kept on the public API only so every existing call site stays
   * byte-identical.
   */
  portal?: boolean
}

export function LocationCombobox({
  locations, value, onChange, onKeyDown, placeholder, className, error,
  regions, onAddLocation,
}: Props) {
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const options = useMemo(() => locations.map(l => {
    const label = resolveLocationLabel(l, locale)

    // Build description: type label + alternate-language name for bi-directional search.
    // Combobox already filters against description — no changes to the Combobox primitive.
    // - en locale: description includes name_al so typing Albanian finds the city too.
    // - sq/uk/it locale: description includes name_en (if present/distinct) so English search works.
    const altName = locale === 'en'
      ? (normalizeSearch(l.name_al) !== normalizeSearch(label) ? l.name_al : undefined)
      : (l.name_en && normalizeSearch(l.name_en) !== normalizeSearch(label) ? l.name_en : undefined)

    const descParts = [l.type, altName].filter(Boolean) as string[]
    const description = descParts.length ? descParts.join(' · ') : undefined

    return { value: String(l.id), label, description }
  }), [locations, locale])

  const regionOptions = useMemo(
    () => (regions ?? []).map(r => ({ value: r.id.toString(), label: resolveLocationLabel(r, locale) })),
    [regions, locale],
  )

  async function handleAdd() {
    if (!addName.trim() || !addRegionId || !onAddLocation) return
    setAdding(true)
    setAddError(null)
    const result = await onAddLocation({ name_al: addName.trim(), region_id: addRegionId })
    setAdding(false)
    if (result.id) {
      onChange(String(result.id))
      setShowAdd(false)
      setAddName('')
      setAddRegionId(null)
    } else {
      // `result.error` is a raw error CODE (e.g. "add_failed"), never a localized user-facing
      // string — surface the generic localized message instead of leaking the code.
      setAddError(tc('error_generic'))
    }
  }

  const canAdd = !!(regions && regions.length > 0 && onAddLocation)
  const resolvedPlaceholder = placeholder ?? tc('all_locations')

  return (
    <div className={cn('location-combobox', className)}>
      <MantineCombobox
        options={options}
        value={value}
        onChange={v => onChange(v || null)}
        variant="input"
        clearLabel={tc('all_locations')}
        icon={<MapPin size={theme.other.iconSize.standard} />}
        placeholder={resolvedPlaceholder}
        error={error}
        onKeyDown={onKeyDown as KeyboardEventHandler<HTMLInputElement> | undefined}
        triggerWidth={{ base: '100%', sm: '100%' }}
        noResultsLabel={tc('no_results')}
        triggerAriaLabel={resolvedPlaceholder}
        sheetTitle={resolvedPlaceholder}
      />

      {canAdd && (
        <>
          {/* §6s text-link toggle (Task 553): brand.7 (Tailwind text-brand-500 mapping), 12px
              (text-theme-xs, cited invoices.html:1647), font-medium, mih=44px touch target while
              staying visually compact. `underline="hover"` is Mantine's own Anchor default
              (zero-override) — resting = no underline, hover = underline, matching the citation. */}
          <Anchor
            component="button"
            type="button"
            fz="xs"
            fw={500}
            c="brand.7"
            mih={theme.other.touchTarget}
            style={{ width: 'fit-content' }}
            onClick={() => setShowAdd(v => !v)}
          >
            + {tc('add_location')}
          </Anchor>
          {showAdd && (
            <MantineAddItemPanel mt="tight">
              <Text size="xs" fw={600}>{tc('new_location')}</Text>
              <TextInput
                value={addName}
                onChange={e => setAddName(e.currentTarget.value)}
                placeholder={tc('location_name_hint')}
                radius="lg"
              />
              <MantineCombobox
                options={regionOptions}
                value={addRegionId?.toString() ?? ''}
                onChange={v => setAddRegionId(v ? Number(v) : null)}
                variant="button"
                placeholder={tc('region')}
                triggerWidth={{ base: '100%', sm: '100%' }}
                noResultsLabel={tc('no_results')}
                triggerAriaLabel={tc('region')}
                sheetTitle={tc('region')}
              />
              {addError && (
                <Text size="xs" c="red.6">{addError}</Text>
              )}
              <Flex direction={{ base: 'column', sm: 'row' }} gap="xs">
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={!addName.trim() || !addRegionId}
                  loading={adding}
                >
                  {tc('add')}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => { setShowAdd(false); setAddError(null) }}
                >
                  {tc('cancel')}
                </Button>
              </Flex>
            </MantineAddItemPanel>
          )}
        </>
      )}
    </div>
  )
}
