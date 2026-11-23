/**
 * Task 957 Revision 2 (R2-2, AC18; Task 905 R9 taken over): the listing-form fields on canonical Mantine keep every `onChange` contract of the Task 905 kickoff §3.2,
 * through real clicks and typing, and each rendered label is associated with its control.
 *
 * Two deliberate breaks are proven red by hand and restored (the report): `RoomsSelectorField` sending the string instead of `Number(v)`, and `ButtonGroupField`
 * without `allowDeselect`; the cases "rooms" and "button group" below turn red for them.
 */
import React from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../../../messages/en.json'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FieldDefinition, ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import { NumInputField } from '../NumInputField'
import { AreaPairField } from '../AreaPairField'
import { BuildingFloorsField } from '../BuildingFloorsField'
import { FloorGroupField } from '../FloorGroupField'
import { ParkingField } from '../ParkingField'
import { RoomsSelectorField } from '../RoomsSelectorField'
import { ButtonGroupField } from '../ButtonGroupField'
import { EnumSelectorField } from '../EnumSelectorField'
import { MultiToggleField } from '../MultiToggleField'
import { YearComboboxField } from '../YearComboboxField'
import { DynamicFieldSection } from '../DynamicFieldSection'
import type { FieldRendererProps } from '../fieldRegistry'

const L = messages.listing
const BASE: FormValues = { listing_type: 'sale', property_type: 'apartment', title: '', currency: 'EUR', multi_storey_building: false, images: [] }

const fieldDef = (key: ListingField, schemaName = 'apartment'): FieldDefinition => {
  const found = getSchema(schemaName).ui.fields.find((f) => f.key === key)
  if (!found) throw new Error(`no field ${key} in ${schemaName}`)
  return found
}

function Harness({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

function mount(
  Field: React.ComponentType<FieldRendererProps>,
  key: ListingField,
  over: { values?: Partial<FormValues>; errors?: FieldRendererProps['errors']; schema?: string; disabled?: boolean } = {},
) {
  const onChange = vi.fn()
  const schemaName = over.schema ?? 'apartment'
  render(
    <Harness>
      <Field fieldDef={fieldDef(key, schemaName)} schema={getSchema(schemaName)} formValues={{ ...BASE, ...over.values }} errors={over.errors ?? {}} onChange={onChange} disabled={over.disabled} />
    </Harness>,
  )
  return onChange
}

beforeEach(() => { setViewport(1024) })
afterEach(cleanup)

const numberInput = (id: string) => document.getElementById(id) as HTMLInputElement

/** The native bounds of a number box: its `min` and `max` attributes (none when the field has none). Mounts its own field and clears the document first. */
function expectBounds(Field: React.ComponentType<FieldRendererProps>, key: ListingField, id: string, bounds: { min?: number; max?: number }, over: { schema?: string; values?: Partial<FormValues> } = {}) {
  cleanup()
  mount(Field, key, { schema: over.schema, values: over.values })
  expect(numberInput(id).getAttribute('min'), `${id}: min`).toBe(bounds.min === undefined ? null : String(bounds.min))
  expect(numberInput(id).getAttribute('max'), `${id}: max`).toBe(bounds.max === undefined ? null : String(bounds.max))
}

describe('number fields keep their parsing: "" and a non-number become undefined, "12" becomes 12', () => {
  it('[AC18] NumInputField: the label is associated with the input; "12" -> 12, "" -> undefined; the error shows under it', () => {
    const onChange = mount(NumInputField, 'bedrooms', { values: { bedrooms: 2 }, errors: { bedrooms: 'E-bedrooms' } })
    const input = screen.getByLabelText(L.bedrooms) as HTMLInputElement
    expect(input.id).toBe('bedrooms')
    expect(input.value).toBe('2')
    fireEvent.change(input, { target: { value: '12' } })
    expect(onChange).toHaveBeenLastCalledWith({ bedrooms: 12 })
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ bedrooms: undefined })
    expect(screen.getByText('E-bedrooms')).toBeTruthy()
    expectBounds(NumInputField, 'bedrooms', 'bedrooms', { min: 0, max: 50 })
  })

  it('[AC18] NumInputField: the floors_total label resolves through listing.floors_total (Task 320)', () => {
    mount(NumInputField, 'floors_total')
    expect((screen.getByLabelText(L.floors_total) as HTMLInputElement).id).toBe('floors_total')
  })

  it('[AC18] AreaPairField: both inputs are labelled, each patches its own key with the same parsing, min 1', () => {
    const onChange = mount(AreaPairField, 'area', { values: { area_gross: 85 } })
    const gross = screen.getByLabelText(L.area_gross_label) as HTMLInputElement
    const net = screen.getByLabelText(L.area_net) as HTMLInputElement
    expect([gross.id, net.id]).toEqual(['area_gross', 'area_net'])
    expect(gross.value).toBe('85')
    fireEvent.change(net, { target: { value: '70' } })
    expect(onChange).toHaveBeenLastCalledWith({ area_net: 70 })
    fireEvent.change(gross, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ area_gross: undefined })
    expectBounds(AreaPairField, 'area', 'area_net', { min: 1 })
    expectBounds(AreaPairField, 'area', 'area_gross', { min: 1 })
  })

  it('[AC18] BuildingFloorsField: the input is labelled, bounds 1-200, patches total_floors', () => {
    const onChange = mount(BuildingFloorsField, 'building_floors', { schema: 'house', values: { total_floors: 5 } })
    const input = screen.getByLabelText(L.building_floors) as HTMLInputElement
    expect(input.id).toBe('total_floors')
    fireEvent.change(input, { target: { value: '9' } })
    expect(onChange).toHaveBeenLastCalledWith({ total_floors: 9 })
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ total_floors: undefined })
    expectBounds(BuildingFloorsField, 'building_floors', 'total_floors', { min: 1, max: 200 }, { schema: 'house' })
  })
})

describe('FloorGroupField', () => {
  it('[AC18] an apartment: the floor and the companion total are labelled inputs (min 0, max 200), the floor error shows, no checkbox', () => {
    const onChange = mount(FloorGroupField, 'floor', { errors: { floor: 'E-floor' }, values: { floor: 3, total_floors: 8 } })
    const floor = screen.getByLabelText(L.floor) as HTMLInputElement
    const total = screen.getByLabelText(messages.common.floors_total_range) as HTMLInputElement
    expect([floor.id, total.id]).toEqual(['floor', 'total_floors'])
    expect(screen.queryByLabelText(L.multi_storey_building)).toBeNull()
    expect(screen.getByText('E-floor')).toBeTruthy()
    fireEvent.change(floor, { target: { value: '4' } })
    expect(onChange).toHaveBeenLastCalledWith({ floor: 4 })
    fireEvent.change(total, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ total_floors: undefined })
    expectBounds(FloorGroupField, 'floor', 'floor', { min: 0, max: 200 })
    expectBounds(FloorGroupField, 'floor', 'total_floors', { min: 1, max: 200 })
  })

  it('[AC18] an underground-capable type: the floor is hidden until the checkbox is on; "multi-storey" is associated with its checkbox (id multi_storey_building)', () => {
    mount(FloorGroupField, 'floor', { schema: 'garage', values: { multi_storey_building: false } })
    expect(screen.queryByLabelText(L.floor)).toBeNull()
    const box = screen.getByLabelText(L.multi_storey_building) as HTMLInputElement
    expect(box.id).toBe('multi_storey_building')
    expect(box.checked).toBe(false)
  })

  it('[AC18] checking the box patches multi_storey_building: true and keeps the floor; the floor then may go down to the type\'s minimum', () => {
    const onChange = mount(FloorGroupField, 'floor', { schema: 'garage', values: { multi_storey_building: false, floor: 2 } })
    fireEvent.click(screen.getByLabelText(L.multi_storey_building))
    expect(onChange).toHaveBeenLastCalledWith({ multi_storey_building: true, floor: 2 })
    cleanup()
    mount(FloorGroupField, 'floor', { schema: 'garage', values: { multi_storey_building: true, floor: -1 } })
    expect((screen.getByLabelText(L.floor) as HTMLInputElement).value).toBe('-1')
    expectBounds(FloorGroupField, 'floor', 'floor', { min: -10, max: 200 }, { schema: 'garage', values: { multi_storey_building: true } })
    // a type without the box has its floor from 0
    expectBounds(FloorGroupField, 'floor', 'floor', { min: 0, max: 200 }, { schema: 'apartment' })
  })

  it('[AC18] unchecking the box with floor -1 clears the floor (undefined); a non-negative floor is kept', () => {
    const onChange = mount(FloorGroupField, 'floor', { schema: 'garage', values: { multi_storey_building: true, floor: -1 } })
    fireEvent.click(screen.getByLabelText(L.multi_storey_building))
    expect(onChange).toHaveBeenLastCalledWith({ multi_storey_building: false, floor: undefined })
    cleanup()
    const keep = mount(FloorGroupField, 'floor', { schema: 'garage', values: { multi_storey_building: true, floor: 3 } })
    fireEvent.click(screen.getByLabelText(L.multi_storey_building))
    expect(keep).toHaveBeenLastCalledWith({ multi_storey_building: false, floor: 3 })
  })
})

// ── Task 957 Revision 3 (R3-1, AC27; Review 3 F16): the number fields keep the browser's step arrows, as on `main` ──────────────────────────────────────────────────────────────────────────────
// `main` renders every number field as `<Input type="number">`, which shows the browser's own step arrows. Mantine's input CSS hides them, so the field is a `TextInput type="number"` (the chrome of the
// other text fields) that carries `data-native-steppers`, and `input-chrome.css` shows the arrows again for it. The stepping itself (click, ArrowUp, ArrowDown, `min`, `max`) is the browser's, jsdom has none.
interface NumberCase { name: string; Field: React.ComponentType<FieldRendererProps>; key: ListingField; schema: string; id: string; patchKey: keyof FormValues; min?: number; max?: number }
const NUMBER_CASES: NumberCase[] = [
  { name: 'bedrooms', Field: NumInputField, key: 'bedrooms', schema: 'apartment', id: 'bedrooms', patchKey: 'bedrooms', min: 0, max: 50 },
  { name: 'bathrooms', Field: NumInputField, key: 'bathrooms', schema: 'apartment', id: 'bathrooms', patchKey: 'bathrooms', min: 0, max: 20 },
  { name: 'toilets', Field: NumInputField, key: 'toilets', schema: 'apartment', id: 'toilets', patchKey: 'toilets', min: 0, max: 20 },
  { name: 'floors_total (no bounds)', Field: NumInputField, key: 'floors_total', schema: 'apartment', id: 'floors_total', patchKey: 'floors_total' as keyof FormValues },   // not a FormValues key: NumInputField reads and patches the schema key as given (the existing test above resolves its label)
  { name: 'area gross', Field: AreaPairField, key: 'area', schema: 'apartment', id: 'area_gross', patchKey: 'area_gross', min: 1 },
  { name: 'area net', Field: AreaPairField, key: 'area', schema: 'apartment', id: 'area_net', patchKey: 'area_net', min: 1 },
  { name: 'building floors', Field: BuildingFloorsField, key: 'building_floors', schema: 'house', id: 'total_floors', patchKey: 'total_floors', min: 1, max: 200 },
  { name: 'floor', Field: FloorGroupField, key: 'floor', schema: 'apartment', id: 'floor', patchKey: 'floor', min: 0, max: 200 },
  { name: 'floor companion total', Field: FloorGroupField, key: 'floor', schema: 'apartment', id: 'total_floors', patchKey: 'total_floors', min: 1, max: 200 },
]
const sent = (onChange: ReturnType<typeof vi.fn>, key: keyof FormValues) => onChange.mock.calls.map((c) => (c[0] as Record<string, unknown>)[key as string])

describe('[AC27] the number fields keep the browser\'s step arrows (Review 3 F16)', () => {
  it.each(NUMBER_CASES)('$name: is a native number input that asks for the browser\'s arrows, with the native bounds and no step buttons of its own', ({ Field, key, schema, id, min, max }) => {
    mount(Field, key, { schema })
    const input = numberInput(id)
    expect(input.type).toBe('number')
    expect(input.hasAttribute('data-native-steppers')).toBe(true)
    expect(input.getAttribute('min')).toBe(min === undefined ? null : String(min))
    expect(input.getAttribute('max')).toBe(max === undefined ? null : String(max))
    expect(input.parentElement!.querySelector('[data-direction]'), 'no Mantine step buttons').toBeNull()
    expect(input.className, 'the chrome of the other text fields').toContain('mantine-TextInput-input')
  })

  it.each(NUMBER_CASES)('$name: a typed value outside the bounds is sent unchanged (the validation decides, as on main)', ({ Field, key, schema, id, patchKey, max }) => {
    const outside = (max ?? 100) + 40
    const onChange = mount(Field, key, { schema })
    fireEvent.change(numberInput(id), { target: { value: String(outside) } })
    fireEvent.blur(numberInput(id))
    expect(sent(onChange, patchKey)).toEqual([outside])
  })

  it.each(NUMBER_CASES)('$name: an emptied box sends undefined', ({ Field, key, schema, id, patchKey }) => {
    const onChange = mount(Field, key, { schema, values: { [patchKey]: 4 } as Partial<FormValues> })
    fireEvent.change(numberInput(id), { target: { value: '' } })
    expect(onChange).toHaveBeenCalled()
    expect(sent(onChange, patchKey).at(-1)).toBeUndefined()
  })

  it('the floor sends a typed -1 unchanged and the net area a typed decimal (the field refuses nothing: `validateListingForm` refuses a negative floor of a type without underground floors)', () => {
    const plain = mount(FloorGroupField, 'floor', { schema: 'apartment' })
    fireEvent.change(numberInput('floor'), { target: { value: '-1' } })
    expect(sent(plain, 'floor').at(-1)).toBe(-1)
    cleanup()
    const area = mount(AreaPairField, 'area', { schema: 'apartment' })
    fireEvent.change(numberInput('area_net'), { target: { value: '85.5' } })
    expect(sent(area, 'area_net').at(-1)).toBe(85.5)
  })

  it('input-chrome.css shows the browser\'s arrows again for a TextInput with data-native-steppers, and only for it', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/design-system/mantine/input-chrome.css'), 'utf8')
    expect(css).toMatch(/\.mantine-TextInput-input\[type='number'\]\[data-native-steppers\]::-webkit-inner-spin-button,\s*\.mantine-TextInput-input\[type='number'\]\[data-native-steppers\]::-webkit-outer-spin-button \{\s*appearance: auto;/)
    expect(css).toMatch(/\.mantine-TextInput-input\[type='number'\]\[data-native-steppers\] \{\s*-moz-appearance: number-input;/)
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]*spin-button[^{}]*\{/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(rule).toContain('[data-native-steppers]')
  })
})

const group = (name: string) => screen.getByRole('group', { name })
const choice = (name: string, label: string) => within(group(name)).getByRole('button', { name: label })

describe('choice fields', () => {
  it('[AC18] rooms: the group is labelled; a click sends a NUMBER, a re-click clears it, "5" is shown as "5+"', () => {
    const onChange = mount(RoomsSelectorField, 'rooms')
    fireEvent.click(choice(L.rooms, '3'))
    expect(onChange).toHaveBeenLastCalledWith({ rooms: 3 })
    expect(typeof onChange.mock.calls[0][0].rooms).toBe('number')
    expect(within(group(L.rooms)).getByRole('button', { name: '5+' })).toBeTruthy()
    fireEvent.click(choice(L.rooms, '5+'))
    expect(onChange).toHaveBeenLastCalledWith({ rooms: 5 })
    cleanup()
    const again = mount(RoomsSelectorField, 'rooms', { values: { rooms: 3 } })
    fireEvent.click(choice(L.rooms, '3'))
    expect(again).toHaveBeenLastCalledWith({ rooms: undefined })
  })

  it('[AC18] button group (heating): a click sets the value, a re-click clears it to undefined', () => {
    const onChange = mount(ButtonGroupField, 'heating')
    fireEvent.click(choice(L.heating_label, L.heating_gas))
    expect(onChange).toHaveBeenLastCalledWith({ heating: 'gas' })
    cleanup()
    const again = mount(ButtonGroupField, 'heating', { values: { heating: 'gas' } })
    fireEvent.click(choice(L.heating_label, L.heating_gas))
    expect(again).toHaveBeenLastCalledWith({ heating: undefined })
  })

  it('[AC18] button group: wall type and offer type are labelled with their own keys', () => {
    mount(ButtonGroupField, 'wall_type')
    expect(group(L.wall_type_label)).toBeTruthy()
    cleanup()
    mount(ButtonGroupField, 'offer_type')
    expect(group(L.offer_type)).toBeTruthy()
  })

  it('[AC18] enum selector (condition): a click sets, a re-click clears, the error shows', () => {
    const onChange = mount(EnumSelectorField, 'condition', { errors: { condition: 'E-condition' } })
    fireEvent.click(choice(L.condition_label, L.condition_good))
    expect(onChange).toHaveBeenLastCalledWith({ condition: 'good' })
    expect(screen.getByText('E-condition')).toBeTruthy()
    cleanup()
    const again = mount(EnumSelectorField, 'condition', { values: { condition: 'good' } })
    fireEvent.click(choice(L.condition_label, L.condition_good))
    expect(again).toHaveBeenLastCalledWith({ condition: undefined })
  })

  it('[AC18] enum selector on a land type is labelled with its own key', () => {
    mount(EnumSelectorField, 'land_legal_status', { schema: 'land' })
    expect(group(L.land_legal_status)).toBeTruthy()
  })

  it('[AC18] multi toggle (purchase conditions): add, add, remove one, remove the last -> undefined', () => {
    const onChange = mount(MultiToggleField, 'purchase_conditions', { values: { purchase_conditions: ['mortgage'] } })
    fireEvent.click(choice(L.purchase_conditions, L.purchase_negotiable))
    expect(onChange).toHaveBeenLastCalledWith({ purchase_conditions: ['mortgage', 'negotiable'] })
    fireEvent.click(choice(L.purchase_conditions, L.purchase_mortgage))
    expect(onChange).toHaveBeenLastCalledWith({ purchase_conditions: undefined })
    cleanup()
    const two = mount(MultiToggleField, 'purchase_conditions', { values: { purchase_conditions: ['mortgage', 'negotiable'] } })
    fireEvent.click(choice(L.purchase_conditions, L.purchase_mortgage))
    expect(two).toHaveBeenLastCalledWith({ purchase_conditions: ['negotiable'] })
  })
})

// Task 957 Revision 3 (owner decision O1001-2, 2026-11-21): the parking field
describe('parking', () => {
  it('the kinds are a labelled choice with nothing chosen by default; no floor shows until an underground parking is chosen', () => {
    mount(ParkingField, 'parking')
    const chips = within(group(L.parking_label))
    expect(chips.getAllByRole('button').map((b) => b.textContent)).toEqual([L.parking_underground, L.parking_private_street, L.parking_city])
    for (const b of chips.getAllByRole('button')) expect(b.getAttribute('data-variant')).toBe('default')
    expect(document.getElementById('parking_floor')).toBeNull()
  })

  it('a click sends the kind, a re-click clears it; the other kinds send no floor', () => {
    const onChange = mount(ParkingField, 'parking')
    fireEvent.click(choice(L.parking_label, L.parking_city))
    expect(onChange).toHaveBeenLastCalledWith({ parking_type: 'city', parking_floor: undefined })
    fireEvent.click(choice(L.parking_label, L.parking_underground))
    expect(onChange).toHaveBeenLastCalledWith({ parking_type: 'underground' })
    cleanup()
    const again = mount(ParkingField, 'parking', { values: { parking_type: 'city' } })
    fireEvent.click(choice(L.parking_label, L.parking_city))
    expect(again).toHaveBeenLastCalledWith({ parking_type: undefined, parking_floor: undefined })
  })

  it('an underground parking shows its floor (-10 to -1), with the error under it, and the typed floor is sent', () => {
    const onChange = mount(ParkingField, 'parking', { values: { parking_type: 'underground', parking_floor: -3 }, errors: { parking_floor: 'E-floor' } })
    const input = document.getElementById('parking_floor') as HTMLInputElement
    expect([input.type, input.getAttribute('min'), input.getAttribute('max')]).toEqual(['number', '-10', '-1'])
    expect(screen.getByLabelText(L.parking_floor)).toBe(input)
    expect(screen.getByText('E-floor')).toBeTruthy()
    fireEvent.change(input, { target: { value: '-2' } })
    expect(onChange).toHaveBeenLastCalledWith({ parking_floor: -2 })
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ parking_floor: undefined })
  })

  it('a form that is being saved disables the kinds and the floor', () => {
    mount(ParkingField, 'parking', { values: { parking_type: 'underground' }, disabled: true })
    for (const b of within(group(L.parking_label)).getAllByRole('button')) expect((b as HTMLButtonElement).disabled).toBe(true)
    expect((document.getElementById('parking_floor') as HTMLInputElement).disabled).toBe(true)
  })

  it('the section shows the field for an apartment and not for land', () => {
    render(<Harness><DynamicFieldSection schema={getSchema('apartment')} formValues={{ ...BASE, multi_storey_building: false }} errors={{}} onChange={vi.fn()} /></Harness>)
    expect(screen.getByRole('group', { name: L.parking_label })).toBeTruthy()
    cleanup()
    render(<Harness><DynamicFieldSection schema={getSchema('land')} formValues={{ ...BASE, property_type: 'land', multi_storey_building: false }} errors={{}} onChange={vi.fn()} /></Harness>)
    expect(screen.queryByRole('group', { name: L.parking_label })).toBeNull()
  })
})

describe('year built', () => {
  it('[AC18] the label shows and the combobox is named, and picking a year patches year_built', () => {
    const onChange = mount(YearComboboxField, 'year_built')
    expect(screen.getByText(L.year_built)).toBeTruthy()
    const input = screen.getByRole('textbox', { name: L.year_built_placeholder }) as HTMLInputElement
    fireEvent.change(input, { target: { value: '2020' } })
    expect(onChange).toHaveBeenLastCalledWith({ year_built: 2020 })
  })
})

describe('disabled while the form is saved (R2-7)', () => {
  it('[AC23] every field control is disabled when the section is disabled', () => {
    const onChange = vi.fn()
    const schema = getSchema('apartment')
    const { container } = render(
      <Harness>
        <DynamicFieldSection schema={schema} formValues={{ ...BASE, multi_storey_building: false }} errors={{}} onChange={onChange} disabled />
      </Harness>,
    )
    const controls = [...container.querySelectorAll<HTMLElement>('input, button, textarea, select')]
    expect(controls.length).toBeGreaterThan(20)
    const enabled = controls.filter((el) => !(el as HTMLInputElement).disabled && el.getAttribute('aria-disabled') !== 'true' && el.getAttribute('data-disabled') !== 'true')
    expect(enabled.map((el) => el.outerHTML.slice(0, 120))).toEqual([])
  })

  it('[AC23] an enabled section leaves them enabled (the check above is not vacuous)', () => {
    const { container } = render(
      <Harness>
        <DynamicFieldSection schema={getSchema('apartment')} formValues={{ ...BASE, multi_storey_building: false }} errors={{}} onChange={vi.fn()} />
      </Harness>,
    )
    const controls = [...container.querySelectorAll<HTMLElement>('input, button')]
    expect(controls.some((el) => !(el as HTMLInputElement).disabled)).toBe(true)
  })
})

describe('DynamicFieldSection layout', () => {
  it('[AC18] renders no filter-only field and no field owned by another; the grid group holds bedrooms, bathrooms and toilets', () => {
    render(
      <Harness>
        <DynamicFieldSection schema={getSchema('apartment')} formValues={{ ...BASE, multi_storey_building: false }} errors={{}} onChange={vi.fn()} />
      </Harness>,
    )
    for (const label of [L.bedrooms, L.bathrooms, L.toilets]) expect(screen.getByLabelText(label)).toBeTruthy()
    expect(screen.getAllByLabelText(messages.common.floors_total_range)).toHaveLength(1)
  })
})
