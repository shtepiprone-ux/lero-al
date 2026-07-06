import { useLayoutEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { LocationCombobox, type LocationOption, type RegionOption } from '@/components/shared/LocationCombobox'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title deliberately placed under `Mantine/Primitives/` (Task 554, gate-phase decision): the
 * rendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing
 * enforcement to stories whose title matches this exact prefix (Phase 0, `discoverMantinePrimitiveStories`,
 * runs unconditionally incl. `--mantine-only`). `LocationCombobox` is a composite, not a primitive —
 * this title is a display-grouping choice for enforcement, not a taxonomy claim; noted here and in
 * the session log, not silently done.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/LocationComboboxSubPanel',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

/**
 * Renders the REAL `LocationCombobox` with its add-location sub-panel forced OPEN before first
 * paint (Task 554). `LocationCombobox` has no prop to force the panel open (by design — see Task
 * 553's kickoff, "do NOT add a force-open prop to the product component"), so this story-file-only
 * wrapper finds the real toggle `<Anchor component="button">` and clicks it inside `useLayoutEffect`.
 *
 * **Mechanism choice (story-file-only open, NOT the harness's generic openTrigger click) — why:**
 * Phase 0's existing overlay-open mechanism clicks `#storybook-root button, input` `.first()` — i.e.
 * whichever `<button>`/`<input>` is FIRST in DOM order. Verified empirically (Playwright DOM dump):
 * `LocationCombobox`'s OWN main-field trigger (`<input placeholder="All cities">`) always renders
 * BEFORE the "+ add_location" toggle `<button>` — this is a structural fact of the composite's JSX
 * (main field, then `{canAdd && <Anchor/>}`), unrelated to this story. Registering this story in the
 * generic overlay-open Set would make the harness click the MAIN FIELD's input, not the toggle —
 * opening the wrong thing and producing a false-green "sub-panel proof" that never actually clicked
 * the toggle. The Task 554 kickoff's gate-phase decision explicitly permits this fallback: "If a
 * story-file-only open... renders the panel open more cleanly than the openTrigger click, that is
 * acceptable too — but it MUST still be a Phase-0-discovered story." `useLayoutEffect` runs
 * synchronously after the DOM is mutated but BEFORE the browser paints the frame, so the closed-panel
 * state is never actually painted — deterministic, no race with the harness's readiness poll (see the
 * planted-violation transcript in the Task 554 session log for empirical proof this is load-bearing).
 * No `check-stories-rendered.mjs` edit was needed for this story (Phase-0 discovery is title-only;
 * `openTrigger` just resolves to `false` here since this component name is not in the overlay-open
 * Set, which is correct — the harness's generic click is skipped, and Layer 1+2+3 checks run against
 * whatever DOM state already exists, which is the sub-panel already open by then).
 */
function LocationComboboxOpenSubPanel({
  locations, regions, placeholder,
}: { locations: LocationOption[]; regions: RegionOption[]; placeholder: string }) {
  const [value, setValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    containerRef.current?.querySelector('button')?.click()
  }, [])

  return (
    <div ref={containerRef} style={{ maxWidth: 420 }}>
      <LocationCombobox
        locations={locations}
        value={value}
        onChange={(id) => setValue(id ?? '')}
        placeholder={placeholder}
        regions={regions}
        onAddLocation={async () => ({ id: 999 })}
      />
    </div>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const locations: LocationOption[] = [
      { id: 1, name_al: t('combobox_option_tirana'), type: 'city' },
      { id: 2, name_al: t('combobox_option_durres'), type: 'city' },
    ]
    const regions: RegionOption[] = [
      { id: 10, name_al: t('location_combobox_region_north') },
      { id: 11, name_al: t('location_combobox_region_south') },
    ]

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — add-location sub-panel forced OPEN (Task 554): toggle Anchor (§6s, compact
              fit-content exemption, ≥44px touch height) + TextInput + region MantineCombobox
              (variant="button", full-width) + Add/Cancel Buttons (full-width <640, row ≥640).
              Add stays disabled until both name + region are set (same guard as production). */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              add-location sub-panel — forced open (real `LocationCombobox`, real primitives); toggle
              is the ONE compact/fit-content exemption (§6s), everything else below it is full-width
              &lt;640
            </Text>
            <LocationComboboxOpenSubPanel
              locations={locations}
              regions={regions}
              placeholder={t('combobox_clear_label')}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
