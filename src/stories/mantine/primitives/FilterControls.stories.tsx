import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterMultiToggle } from '@/components/shared/FilterMultiToggle'
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

function MultiToggleDemo({ getLabel, ariaLabel }: { getLabel: (key: string) => string; ariaLabel: string }) {
  const [selected, setSelected] = useState<string[]>(['good'])
  return (
    <FilterMultiToggle
      options={CONDITION_OPTIONS}
      selected={selected}
      getLabel={getLabel}
      ariaLabel={ariaLabel}
      onToggle={value =>
        setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
      }
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

          {/* FilterMultiToggle — Mantine Button toggles (§6a chrome, filled=selected / default=unselected).
              Task 624: this annotation used to render as visible <Text>, leaking as a hardcoded
              English string in every locale — kept as a source comment only, never rendered. */}
          <Stack gap="xs">
            <MultiToggleDemo getLabel={getLabel} ariaLabel={storyT(locale, 'common.condition')} />
          </Stack>

          {/* FilterRoomsRow — §6a Button toggles over room counts, one pre-selected */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              FilterRoomsRow — Mantine Button toggles over room counts (5 → &quot;5+&quot;)
            </Text>
            <RoomsRowDemo ariaLabel={storyT(locale, 'common.rooms_label')} />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
