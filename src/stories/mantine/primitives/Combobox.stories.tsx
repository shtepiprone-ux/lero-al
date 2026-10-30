import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineCombobox, type MantineComboboxOption } from '@/design-system/mantine/patterns/MantineCombobox'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineStoryShell, MantineStorySection, MantineStoryStack } from '../_MantineStoryShell'

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
    <>
      <MantineCombobox
        options={options}
        value={value}
        onChange={setValue}
        onKeyDown={(e) => { if (e.key === 'Enter') setFired(true) }}
        {...rest}
      />
      {fired && <Text>{firedLabel}</Text>}
    </>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const options: MantineComboboxOption[] = [
      { value: 'tirana', label: t('combobox_option_tirana') },
      { value: 'durres', label: t('combobox_option_durres') },
      {
        value: 'vlore',
        label: t('combobox_option_vlore'),
        // Task 859 R27: `adornment` carries a status badge in the row (the support user picker's role and status).
        adornment: <MantineBadge variant="tone" tone="success" size="xs">{t('admin_status_active')}</MantineBadge>,
      },
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
        <MantineStoryStack>
          {/* 1 — variant="input" resting: §6d/§6e chrome (gray-3 border / shadow-xs / brand focus /
              gray-4 placeholder / 44px). Click/tap the field to open — ≥640 anchored dropdown,
              <640 full-width bottom sheet with its own search field. This is the gate's scripted
              open-trigger target (first input/button in DOM order). */}
          <MantineStorySection label={t('combobox_caption_input')}>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              clearLabel={t('combobox_clear_label')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </MantineStorySection>

          {/* 2 — variant="button" + searchable: compact trigger, search field lives INSIDE the
              dropdown/sheet (not on the trigger). §6x: search field reuses §6e input chrome
              verbatim (Task 537 STOP-and-ASK #4, option A). */}
          <MantineStorySection label={t('combobox_caption_button_searchable')}>
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
          </MantineStorySection>

          {/* 3 — variant="button" without searchable: compact trigger, static list, no search field */}
          <MantineStorySection label={t('combobox_caption_button')}>
            <ControlledInput
              options={options}
              variant="button"
              placeholder={t('combobox_placeholder')}
              triggerAriaLabel={t('combobox_trigger_aria')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </MantineStorySection>

          {/* 4 — error: red-6 border, no shadow, ring cleared; label stays gray (§6e) */}
          <MantineStorySection label={t('combobox_caption_error')}>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              error={t('combobox_error')}
            />
          </MantineStorySection>

          {/* 5 — disabled: whole control faded (§6e); tap/type does NOT open the dropdown/sheet */}
          <MantineStorySection label={t('combobox_caption_disabled')}>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              disabled
            />
          </MantineStorySection>

          {/* 6 — empty / no results: filter yields 0 → localized "no results" row, not a blank popup */}
          <MantineStorySection label={t('combobox_caption_empty')}>
            <ControlledInput
              options={[]}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </MantineStorySection>

          {/* 7 — long sq/uk/it label: wraps, never clips, no h-scroll at 320 (trigger + option row) */}
          <MantineStorySection label={t('combobox_caption_long_label')}>
            <ControlledInput
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </MantineStorySection>

          {/* 8 — triggerWidth override (Task 551): trigger fills its wrapper on desktop too, not
              just content-width `sm:auto` (the default). Mobile stays full-width either way. */}
          <MantineStorySection label={t('combobox_caption_trigger_width')}>
            <ControlledInput
              options={options}
              variant="button"
              placeholder={t('combobox_placeholder')}
              triggerAriaLabel={t('combobox_trigger_aria')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              triggerWidth={{ base: '100%', sm: '100%' }}
            />
          </MantineStorySection>

          {/* 9 — numeric typeahead (Task 552): onInputChange + inputMode="numeric" — typing a full
              valid year live-commits it (YearCombobox's contract), on BOTH the desktop trigger and
              the mobile sheet's own search field. Absent onInputChange, behavior is byte-identical
              to block 1 (see the primitive smoke test for that proof). */}
          <MantineStorySection label={t('combobox_caption_numeric')}>
            <NumericTypeaheadDemo
              options={Array.from({ length: 9 }, (_, i) => {
                const y = 2018 + i
                return { value: String(y), label: String(y) }
              })}
              placeholder={t('combobox_numeric_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
            />
          </MantineStorySection>

          {/* 10 — onKeyDown Enter-to-search (Task 553): reaches the DESKTOP trigger only — press
              Enter in the field below to see the "fired" indicator; the mobile sheet's own search
              field does not get this handler (Enter there filters/commits, never navigates). */}
          <MantineStorySection label={t('combobox_caption_enter_key')}>
            <EnterKeyDemo
              options={options}
              variant="input"
              placeholder={t('combobox_placeholder')}
              noResultsLabel={t('combobox_no_results')}
              sheetTitle={t('combobox_sheet_title')}
              firedLabel={t('combobox_enter_search_fired')}
            />
          </MantineStorySection>
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}
