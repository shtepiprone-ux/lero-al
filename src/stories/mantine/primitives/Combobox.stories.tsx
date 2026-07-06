import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineCombobox, type MantineComboboxOption } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Combobox',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function ControlledInput({ options, ...rest }: { options: MantineComboboxOption[] } & Omit<
  Parameters<typeof MantineCombobox>[0],
  'options' | 'value' | 'onChange'
>) {
  const [value, setValue] = useState('')
  return <MantineCombobox options={options} value={value} onChange={setValue} {...rest} />
}

// Numeric typeahead demo (Task 552, block 9): `onInputChange` + `inputMode="numeric"` — typing a
// full valid year live-commits it (mirrors `YearCombobox`'s own sanitize/validate logic), not just
// selecting from the dropdown/sheet.
function NumericTypeaheadDemo({ options, ...rest }: { options: MantineComboboxOption[] } & Omit<
  Parameters<typeof MantineCombobox>[0],
  'options' | 'value' | 'onChange' | 'onInputChange' | 'inputMode' | 'variant'
>) {
  const [value, setValue] = useState('')
  return (
    <MantineCombobox
      options={options}
      value={value}
      onChange={setValue}
      onInputChange={(raw) => {
        const digits = raw.replace(/\D/g, '').slice(0, 4)
        const match = options.find((o) => o.value === digits)
        setValue(match ? match.value : '')
      }}
      inputMode="numeric"
      variant="input"
      {...rest}
    />
  )
}

// Enter-to-search demo (Task 553, block 10): `onKeyDown` reaches ONLY the desktop trigger (never
// the mobile sheet's search field, where Enter should filter/commit, not navigate away) — mirrors
// HeroSearch/LocationCombobox's Enter-runs-search contract.
function EnterKeyDemo({ options, firedLabel, ...rest }: { options: MantineComboboxOption[]; firedLabel: string } & Omit<
  Parameters<typeof MantineCombobox>[0],
  'options' | 'value' | 'onChange' | 'onKeyDown'
>) {
  const [value, setValue] = useState('')
  const [fired, setFired] = useState(false)
  return (
    <Stack gap="xs">
      <MantineCombobox
        options={options}
        value={value}
        onChange={setValue}
        onKeyDown={(e) => { if (e.key === 'Enter') setFired(true) }}
        {...rest}
      />
      {fired && (
        <Text size="xs" c="brand.7" fw={500}>
          {firedLabel}
        </Text>
      )}
    </Stack>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const options: MantineComboboxOption[] = [
      { value: 'tirana', label: t('combobox_option_tirana') },
      { value: 'durres', label: t('combobox_option_durres') },
      { value: 'vlore', label: t('combobox_option_vlore') },
      { value: 'shkoder', label: t('combobox_option_shkoder') },
      {
        value: 'saranda',
        label: t('combobox_option_saranda'),
        description: t('combobox_option_saranda_desc'),
      },
      { value: 'long', label: t('combobox_option_long') },
    ]

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — variant="input" resting: §6d/§6e chrome (gray-3 border / shadow-xs / brand focus /
              gray-4 placeholder / 44px). Click/tap the field to open — ≥640 anchored dropdown,
              <640 full-width bottom sheet with its own search field. This is the gate's scripted
              open-trigger target (first input/button in DOM order). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              variant=&quot;input&quot; resting — §6d/§6e chrome; type to filter (desktop) or tap to
              open the sheet (mobile, own search field); ≥640 anchored dropdown, &lt;640 full-width
              bottom sheet
            </Text>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              clearLabel={t('combobox_clear_label')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 2 — variant="button" + searchable: compact trigger, search field lives INSIDE the
              dropdown/sheet (not on the trigger). §6x: search field reuses §6e input chrome
              verbatim (Task 537 STOP-and-ASK #4, option A). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              variant=&quot;button&quot; + searchable — compact trigger; search field renders INSIDE
              the dropdown/sheet, not on the trigger; trigger label stays put while filtering
            </Text>
            <ControlledInput
              options={options}
              variant="button"
              searchable
              placeholder={t('combobox_placeholder')}
              searchPlaceholder={t('combobox_search_placeholder')}
              triggerAriaLabel={t('combobox_trigger_aria')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 3 — variant="button" without searchable: compact trigger, static list, no search field */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              variant=&quot;button&quot; (no search) — compact trigger; static list, no search field
              anywhere
            </Text>
            <ControlledInput
              options={options}
              variant="button"
              placeholder={t('combobox_placeholder')}
              triggerAriaLabel={t('combobox_trigger_aria')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 4 — error: red-6 border, no shadow, ring cleared; label stays gray (§6e) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — red-6 border / no shadow; message renders below in red; label color does NOT
              turn red (§6e)
            </Text>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              error={t('combobox_error')}
            />
          </Stack>

          {/* 5 — disabled: whole control faded (§6e); tap/type does NOT open the dropdown/sheet */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (label + field + chevron → opacity 0.5); tap/type does
              NOT open the dropdown/sheet at any width
            </Text>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              disabled
            />
          </Stack>

          {/* 6 — empty / no results: filter yields 0 → localized "no results" row, not a blank popup */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              empty options — immediate &quot;no results&quot; row, no crash; sheet/dropdown still
              opens and closes normally
            </Text>
            <ControlledInput
              options={[]}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 7 — long sq/uk/it label: wraps, never clips, no h-scroll at 320 (trigger + option row) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long label (§7) — long sq/uk/it option text wraps in the dropdown/sheet row; no clip,
              no h-scroll at 320
            </Text>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 8 — triggerWidth override (Task 551): trigger fills its wrapper on desktop too, not
              just content-width `sm:auto` (the default). Mobile stays full-width either way. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              triggerWidth override — `{'{ base: \'100%\', sm: \'100%\' }'}` keeps the trigger at
              the wrapper&apos;s full width on desktop too (default, when the prop is omitted, is
              content-width `sm:auto` — see block 3 above)
            </Text>
            <ControlledInput
              options={options}
              variant="button"
              placeholder={t('combobox_placeholder')}
              triggerAriaLabel={t('combobox_trigger_aria')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              triggerWidth={{ base: '100%', sm: '100%' }}
            />
          </Stack>

          {/* 9 — numeric typeahead (Task 552): onInputChange + inputMode="numeric" — typing a full
              valid year live-commits it (YearCombobox's contract), on BOTH the desktop trigger and
              the mobile sheet's own search field. Absent onInputChange, behavior is byte-identical
              to block 1 (see the primitive smoke test for that proof). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              numeric typeahead — `onInputChange` + `inputMode=&quot;numeric&quot;`; typing a full
              valid year live-commits it without opening the dropdown/sheet (mobile keypad is
              numeric); selecting from the list still works
            </Text>
            <NumericTypeaheadDemo
              options={Array.from({ length: 9 }, (_, i) => {
                const y = 2018 + i
                return { value: String(y), label: String(y) }
              })}
              placeholder={t('combobox_numeric_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </Stack>

          {/* 10 — onKeyDown Enter-to-search (Task 553): reaches the DESKTOP trigger only — press
              Enter in the field below to see the "fired" indicator; the mobile sheet's own search
              field does not get this handler (Enter there filters/commits, never navigates). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              onKeyDown Enter-to-search — desktop trigger only; press Enter to fire (mirrors
              HeroSearch/LocationCombobox); the mobile sheet&apos;s search field is untouched
            </Text>
            <EnterKeyDemo
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              firedLabel={t('combobox_enter_search_fired')}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
