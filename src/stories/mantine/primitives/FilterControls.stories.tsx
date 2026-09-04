import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { FilterRoomsRow } from '@/components/shared/FilterRoomsRow'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 554/556 precedent): the rendered-assert harness
 * (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under
 * `--mantine-only` to stories whose title matches this exact prefix. These three leaf filter
 * sub-components (Task 566) are presentational forwarders consumed by `FiltersPanel`/
 * `ListingsFilters` — this title is a display-grouping choice for gate enforcement, not a
 * taxonomy claim.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/FilterControls',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

// Task 724R: mirrors the real production CONDITIONS constant (@/modules/listings/constants) —
// the previous 2-entry demo array undercounted the real chip-set size, which matters now that
// the gate's chip-set exemption (check-stories-rendered.mjs, V2 route b) requires N≥3 siblings
// to tell a toggle-chip row apart from a single CTA.
const CONDITION_OPTIONS = [
  { value: 'new_build', labelKey: 'condition_new_build' },
  { value: 'good', labelKey: 'condition_good' },
  { value: 'needs_repair', labelKey: 'condition_needs_repair' },
  { value: 'needs_renovation', labelKey: 'condition_needs_renovation' },
  { value: 'under_construction', labelKey: 'condition_under_construction' },
] as const

function RangeInputsDemo({ minPlaceholder, maxPlaceholder }: { minPlaceholder: string; maxPlaceholder: string }) {
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('120000')
  return (
    <FilterRangeInputs
      minValue={minValue}
      maxValue={maxValue}
      onMinChange={setMinValue}
      onMaxChange={setMaxValue}
      minPlaceholder={minPlaceholder}
      maxPlaceholder={maxPlaceholder}
    />
  )
}

function MultiToggleDemo({
  getLabel, ariaLabel, orientation,
}: { getLabel: (key: string) => string; ariaLabel: string; orientation?: 'horizontal' | 'vertical' }) {
  const [selected, setSelected] = useState<string[]>(['good'])
  return (
    <FilterChoiceGroup
      mode="multiple"
      options={CONDITION_OPTIONS}
      selected={selected}
      getLabel={getLabel}
      ariaLabel={ariaLabel}
      orientation={orientation}
      onToggle={value =>
        setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
      }
    />
  )
}

const LISTING_TYPE_OPTIONS = [
  { value: 'sale', labelKey: 'sale' },
  { value: 'rent', labelKey: 'rent' },
] as const

// Task 781R — mode="single": type/market_type-shaped consumer (no deselect on re-click).
function SingleChoiceDemo({ getLabel, ariaLabel }: { getLabel: (key: string) => string; ariaLabel: string }) {
  const [selected, setSelected] = useState('sale')
  return (
    <FilterChoiceGroup
      mode="single"
      options={LISTING_TYPE_OPTIONS}
      allOption={{ value: '', labelKey: 'all' }}
      selected={selected}
      onChange={setSelected}
      getLabel={getLabel}
      ariaLabel={ariaLabel}
    />
  )
}

// Task 781R — mode="single" + allowDeselect + variant="light" + justify="flex-start":
// property_type-shaped consumer (re-clicking the active option clears it).
function SingleChoiceDeselectDemo({ getLabel, ariaLabel }: { getLabel: (key: string) => string; ariaLabel: string }) {
  const [selected, setSelected] = useState('sale')
  return (
    <FilterChoiceGroup
      mode="single"
      options={LISTING_TYPE_OPTIONS}
      allOption={{ value: '', labelKey: 'all' }}
      selected={selected}
      onChange={setSelected}
      allowDeselect
      variant="light"
      justify="flex-start"
      getLabel={getLabel}
      ariaLabel={ariaLabel}
    />
  )
}

function RoomsRowDemo({ ariaLabel }: { ariaLabel: string }) {
  const [selected, setSelected] = useState<string[]>(['3'])
  return (
    <FilterRoomsRow
      selected={selected}
      ariaLabel={ariaLabel}
      onToggle={value =>
        setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
      }
    />
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.filtercontrols.${key}`)
    const getLabel = (key: string) => t(key)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* FilterRangeInputs — §6e TextInput ×2, even-split row, h-11 */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterRangeInputs — Mantine TextInput ×2 (§6e chrome, h-11, even-split row)
            </Text>
            <RangeInputsDemo minPlaceholder={t('price_min')} maxPlaceholder={t('price_max')} />
          </Stack>

          {/* FilterChoiceGroup mode="multiple" — Mantine Button toggles (§6a chrome, filled=selected / default=unselected).
              Task 624: this annotation used to render as visible <Text>, leaking as a hardcoded
              English string in every locale — kept as a source comment only, never rendered. */}
          <Stack gap="xs">
            <MultiToggleDemo getLabel={getLabel} ariaLabel={storyT(locale, 'common.condition')} />
          </Stack>

          {/* FilterChoiceGroup mode="multiple" (vertical branch, Task 752R) — the same component
              with `orientation="vertical"`, the exact prop the live ListingsFilters.tsx
              mobile-drawer call sites pass (Task 778's non-className path; Task 784 corrected
              this story to match — it previously exercised the legacy className sniff, which no
              current production call site uses). No story previously exercised this branch (Task
              752 note); this is the coverage gap that let the justify="flex-start"
              label-centering regression ship. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterChoiceGroup — vertical branch (mobile filters drawer, orientation=&quot;vertical&quot;)
            </Text>
            <MultiToggleDemo
              getLabel={getLabel}
              ariaLabel={`${storyT(locale, 'common.condition')} (vertical)`}
              orientation="vertical"
            />
          </Stack>

          {/* FilterRoomsRow — §6a Button toggles over room counts, one pre-selected */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterRoomsRow — Mantine Button toggles over room counts (5 → &quot;5+&quot;)
            </Text>
            <RoomsRowDemo ariaLabel={storyT(locale, 'common.rooms_label')} />
          </Stack>

          {/* FilterChoiceGroup mode="single" (Task 781R) — the type/market_type-shaped consumer:
              allOption present, allowDeselect absent (re-clicking the active option is a no-op). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterChoiceGroup — mode=&quot;single&quot; (no deselect, filled/centered — type/market_type)
            </Text>
            <SingleChoiceDemo
              getLabel={key => (key === 'all' ? storyT(locale, 'common.all') : storyT(locale, `listing.${key}`))}
              ariaLabel={storyT(locale, 'common.listing_type')}
            />
          </Stack>

          {/* FilterChoiceGroup mode="single" + allowDeselect + variant="light" + justify="flex-start"
              (Task 781R) — the property_type-shaped consumer: re-clicking the active option clears it. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterChoiceGroup — mode=&quot;single&quot; allowDeselect, variant=&quot;light&quot; justify=&quot;flex-start&quot; (property_type)
            </Text>
            <SingleChoiceDeselectDemo
              getLabel={key => (key === 'all' ? storyT(locale, 'common.all') : storyT(locale, `listing.${key}`))}
              ariaLabel={storyT(locale, 'common.property_type')}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
