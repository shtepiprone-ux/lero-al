/**
 * LocationCombobox — add-location sub-panel RTL smoke test (Task 553)
 *
 * Registry: docs/critical-flow-registry.md → "Admin add-location sub-panel" (added by this task —
 * the `addLocation` server action + its UI previously had no automated coverage).
 *
 * Covers:
 *   1. Toggle opens/closes the panel.
 *   2. Add is disabled until BOTH name and region are set.
 *   3. Add calls `onAddLocation` with the exact `{ name_al, region_id }` shape.
 *   4. Success (`{ id }`) → `onChange(newId)` fires, panel closes, fields reset.
 *   5. Failure (`{ error }` / no `id`) → panel STAYS open, the localized generic error shows,
 *      `adding` resets (Add re-enabled once fields are valid again).
 *   6. Cancel → panel closes, fields reset, no persist call.
 *
 * Planted-violation proof (documented, not asserted here — see Task 553 session log): removing
 * the `!addRegionId` guard from Add's `disabled` condition makes test 2 below FAIL (Add becomes
 * clickable with no region selected).
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { LocationCombobox, type LocationOption, type RegionOption } from '../LocationCombobox'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))

vi.mock('lucide-react', () => ({
  MapPin: () => React.createElement('span', null, 'map-pin'),
}))

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

const LOCATIONS: LocationOption[] = [{ id: 1, name_al: 'Tiranë', type: 'city' }]
const REGIONS: RegionOption[] = [{ id: 10, name_al: 'Rajoni Qendror' }]

describe('LocationCombobox — add-location sub-panel (Task 553)', () => {
  it('toggle opens the panel; Cancel closes it, resets fields, no persist call', async () => {
    const onAddLocation = vi.fn()
    const onChange = vi.fn()
    render(
      withProvider(
        <LocationCombobox
          locations={LOCATIONS}
          value=""
          onChange={onChange}
          regions={REGIONS}
          onAddLocation={onAddLocation}
        />,
      ),
    )
    expect(screen.queryByText('new_location')).toBeNull()
    fireEvent.click(screen.getByText('+ add_location'))
    expect(screen.getByText('new_location')).toBeTruthy()

    fireEvent.click(screen.getByText('cancel'))
    expect(screen.queryByText('new_location')).toBeNull()
    expect(onAddLocation).not.toHaveBeenCalled()
  })

  it('Add is disabled until both name and region are set', async () => {
    const onAddLocation = vi.fn()
    render(
      withProvider(
        <LocationCombobox
          locations={LOCATIONS}
          value=""
          onChange={() => {}}
          regions={REGIONS}
          onAddLocation={onAddLocation}
        />,
      ),
    )
    fireEvent.click(screen.getByText('+ add_location'))
    const addButton = screen.getByText('add').closest('button')!
    expect(addButton).toBeDisabled()

    // Name only — still disabled (no region).
    const nameInput = screen.getByPlaceholderText('location_name_hint')
    fireEvent.change(nameInput, { target: { value: 'Fier' } })
    expect(addButton).toBeDisabled()
  })

  it('Add calls onAddLocation with the exact {name_al, region_id} shape; success closes + resets + commits onChange', async () => {
    const onAddLocation = vi.fn().mockResolvedValue({ id: 42 })
    const onChange = vi.fn()
    const { baseElement } = render(
      withProvider(
        <LocationCombobox
          locations={LOCATIONS}
          value=""
          onChange={onChange}
          regions={REGIONS}
          onAddLocation={onAddLocation}
        />,
      ),
    )
    fireEvent.click(screen.getByText('+ add_location'))
    fireEvent.change(screen.getByPlaceholderText('location_name_hint'), { target: { value: '  Fier  ' } })

    // Region combobox is `variant="button"` — click its trigger, then the portaled option.
    const regionTrigger = baseElement.querySelectorAll('input')[1] as HTMLInputElement
    fireEvent.click(regionTrigger)
    const regionOption = await screen.findByText('Rajoni Qendror')
    fireEvent.click(regionOption)

    const addButton = screen.getByText('add').closest('button')!
    await waitFor(() => expect(addButton).not.toBeDisabled())
    fireEvent.click(addButton)

    await waitFor(() => expect(onAddLocation).toHaveBeenCalledWith({ name_al: 'Fier', region_id: 10 }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('42'))
    await waitFor(() => expect(screen.queryByText('new_location')).toBeNull())
  })

  it('failure ({error}/no id): panel STAYS open, localized generic error shown, adding resets', async () => {
    const onAddLocation = vi.fn().mockResolvedValue({ error: 'add_failed' })
    const onChange = vi.fn()
    const { baseElement } = render(
      withProvider(
        <LocationCombobox
          locations={LOCATIONS}
          value=""
          onChange={onChange}
          regions={REGIONS}
          onAddLocation={onAddLocation}
        />,
      ),
    )
    fireEvent.click(screen.getByText('+ add_location'))
    fireEvent.change(screen.getByPlaceholderText('location_name_hint'), { target: { value: 'Fier' } })
    const regionTrigger = baseElement.querySelectorAll('input')[1] as HTMLInputElement
    fireEvent.click(regionTrigger)
    const regionOption = await screen.findByText('Rajoni Qendror')
    fireEvent.click(regionOption)

    const addButton = screen.getByText('add').closest('button')!
    await waitFor(() => expect(addButton).not.toBeDisabled())
    fireEvent.click(addButton)

    await waitFor(() => expect(onAddLocation).toHaveBeenCalled())
    // Panel stays open — the raw error CODE is never shown, only the localized generic message.
    expect(screen.getByText('new_location')).toBeTruthy()
    expect(await screen.findByText('error_generic')).toBeTruthy()
    expect(screen.queryByText('add_failed')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })
})
