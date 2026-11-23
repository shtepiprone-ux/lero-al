import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Stack } from '@mantine/core'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { DynamicFieldSection } from '@/modules/listings/components/form/DynamicFieldSection'
import { NumInputField } from '@/modules/listings/components/form/NumInputField'
import { NumberTextInput } from '@/modules/listings/components/form/NumberTextInput'
import { AreaPairField } from '@/modules/listings/components/form/AreaPairField'
import { BuildingFloorsField } from '@/modules/listings/components/form/BuildingFloorsField'
import { FloorGroupField } from '@/modules/listings/components/form/FloorGroupField'
import { RoomsSelectorField } from '@/modules/listings/components/form/RoomsSelectorField'
import { ButtonGroupField } from '@/modules/listings/components/form/ButtonGroupField'
import { EnumSelectorField } from '@/modules/listings/components/form/EnumSelectorField'
import { MultiToggleField } from '@/modules/listings/components/form/MultiToggleField'
import { YearComboboxField } from '@/modules/listings/components/form/YearComboboxField'
import { ParkingField } from '@/modules/listings/components/form/ParkingField'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { validateListingForm } from '@/modules/listings/lib/validateListingForm'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'

// Task 957 Revision 2 (R2-2; Task 905 R8 taken over): the ten fields of the listing form (Revision 3 added the parking field) and their section on canonical Mantine, proven by their own Story
// (Mantine `NumberInput` with its own up and down controls, shown on hover and on focus (Revision 7, O957-20), `Checkbox`, `FilterChoiceGroup` inside `Input.Wrapper`, `SimpleGrid`; one field per row below 640px, the Task 905 columns from 640px).
// The fields are rendered by `DynamicFieldSection` (the real production composition, imported with the ten components by name so that `check:story-coverage` sees each). The data is labelled
// fixture data in local state, so the controls work; every label is the product's own `listing.*` text. Viewport and locale come from the Storybook toolbar.
//
// Property types chosen (Task 905 R8, "pick the types from PROPERTY_TYPE_SCHEMA and name the choice"), each shown by `DynamicFieldSection` with `getSchema(<type>)`:
//   apartment — rooms-selector, num-input (bedrooms, bathrooms, toilets as the `num-grid` group), area-pair, floor-group with the companion total, year-combobox, enum-selector
//               (condition), button-group (heating, wall type, offer type), parking-group (the kind of parking, and the floor of an underground one), multi-toggle (purchase conditions);
//   house     — building-floors;
//   garage    — floor-group with the "multi-storey" checkbox (an underground-capable type: `getUndergroundFloorTypes()` includes it) and `multi_storey_building: true`;
//   land      — enum-selector with the three land fields.
// Every one of the ten field kinds appears in at least one export; `FieldKinds` renders each of the ten components on its own.
const BASE: FormValues = { listing_type: 'sale', property_type: 'apartment', title: '', currency: 'EUR', multi_storey_building: false, images: [] }

/** `errors` are the ones shown when the Story opens; a field that is changed loses its error, as in the form (`ListingFormShell` `patch`). */
function Section({ propertyType, initial = {}, errors = {} }: { propertyType: string; initial?: Partial<FormValues>; errors?: Partial<Record<keyof FormValues, string>> }) {
  const [values, setValues] = useState<FormValues>({ ...BASE, property_type: propertyType as FormValues['property_type'], ...initial })
  const [shown, setShown] = useState(errors)
  return (
    <StoryPageGutter>
      <Stack>
        <DynamicFieldSection
          schema={getSchema(propertyType)}
          formValues={values}
          errors={shown}
          onChange={(patch) => {
            setValues((v) => ({ ...v, ...patch }))
            setShown((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }))
          }}
        />
      </Stack>
    </StoryPageGutter>
  )
}

const meta: Meta<typeof DynamicFieldSection> = {
  title: 'Patterns/Mantine/ListingFormFields',
  component: DynamicFieldSection,
  tags: ['autodocs'],
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof DynamicFieldSection>

/** An apartment: every field kind but the building floors, the underground checkbox and the land fields. */
export const Apartment: Story = { render: () => <Section propertyType="apartment" /> }

/** A house: the standalone "building floors" input. */
export const House: Story = { render: () => <Section propertyType="house" /> }

/** An underground-capable type with the "multi-storey" checkbox on: the floor input appears and may go below zero. */
export const GarageMultiStorey: Story = { render: () => <Section propertyType="garage" initial={{ multi_storey_building: true, floor: -1 }} /> }

/** Land: the three vertical enum lists. */
export const Land: Story = { render: () => <Section propertyType="land" /> }

// Values selected and the errors the form itself gives for them (Revision 3, Review 3 F19): the errors are those of `validateListingForm`, the function `ListingFormShell` runs on Save, over these
// values. The floor 9 of a building of 8 floors is refused with `error_floor_exceeds_building` (shown under the floor); an apartment has no required field, so the selected condition shows none.
const WITH_ERRORS_VALUES: Partial<FormValues> = { rooms: 3, bedrooms: 2, bathrooms: 1, toilets: 1, area_gross: 85, area_net: 78, floor: 9, total_floors: 8, year_built: 2022, condition: 'good', heating: 'central', wall_type: 'brick', offer_type: 'owner', purchase_conditions: ['mortgage', 'negotiable'] }
function WithValuesAndErrorsDemo() {
  const t = useTranslations('listing')
  const values: FormValues = { ...BASE, property_type: 'apartment', ...WITH_ERRORS_VALUES }
  return <Section propertyType="apartment" initial={WITH_ERRORS_VALUES} errors={validateListingForm(values, getSchema('apartment'), t)} />
}
export const WithValuesAndErrors: Story = { render: () => <WithValuesAndErrorsDemo /> }

/** The form is being saved: every field is disabled. */
function SavingDemo() {
  const [values] = useState<FormValues>({ ...BASE, rooms: 2, condition: 'good', heating: 'gas', purchase_conditions: ['mortgage'], floor: 3, total_floors: 8 })
  return (
    <StoryPageGutter>
      <DynamicFieldSection schema={getSchema('apartment')} formValues={values} errors={{}} onChange={() => {}} disabled />
    </StoryPageGutter>
  )
}
export const Saving: Story = { render: () => <SavingDemo /> }

// Each of the ten components on its own, with the field definition its property type gives it: the direct proof of every field kind.
const fieldOf = (propertyType: string, key: ListingField) => {
  const field = getSchema(propertyType).ui.fields.find((f) => f.key === key)
  if (!field) throw new Error(`no field ${key} in ${propertyType}`)
  return field
}
function FieldKindsDemo() {
  const [values, setValues] = useState<FormValues>({ ...BASE, rooms: 2, condition: 'good', heating: 'gas', purchase_conditions: ['mortgage'], floor: 3, total_floors: 8 })
  const common = { formValues: values, errors: {}, onChange: (patch: Partial<FormValues>) => setValues((v) => ({ ...v, ...patch })) }
  const apartment = getSchema('apartment')
  return (
    <StoryPageGutter>
      <Stack>
        <RoomsSelectorField fieldDef={fieldOf('apartment', 'rooms')} schema={apartment} {...common} />
        <NumInputField fieldDef={fieldOf('apartment', 'bedrooms')} schema={apartment} {...common} />
        <AreaPairField fieldDef={fieldOf('apartment', 'area')} schema={apartment} {...common} />
        <FloorGroupField fieldDef={fieldOf('apartment', 'floor')} schema={apartment} {...common} />
        <BuildingFloorsField fieldDef={fieldOf('house', 'building_floors')} schema={getSchema('house')} {...common} />
        <YearComboboxField fieldDef={fieldOf('apartment', 'year_built')} schema={apartment} {...common} />
        <EnumSelectorField fieldDef={fieldOf('apartment', 'condition')} schema={apartment} {...common} />
        <ButtonGroupField fieldDef={fieldOf('apartment', 'heating')} schema={apartment} {...common} />
        <MultiToggleField fieldDef={fieldOf('apartment', 'purchase_conditions')} schema={apartment} {...common} />
        <ParkingField fieldDef={fieldOf('apartment', 'parking')} schema={apartment} {...common} />
      </Stack>
    </StoryPageGutter>
  )
}
export const FieldKinds: Story = { render: () => <FieldKindsDemo /> }

// The number input the number fields share (Mantine `NumberInput` with its own up and down controls, shown on hover where the device hovers and on focus): empty, with a value, with an error and disabled.
function NumberInputDemo() {
  const locale = useLocale()
  const [empty, setEmpty] = useState<number | undefined>(undefined)
  const [value, setValue] = useState<number | undefined>(4)
  const [refused, setRefused] = useState<number | undefined>(9)
  return (
    <StoryPageGutter>
      <Stack>
        <NumberTextInput id="story-number-empty" label={storyT(locale, 'listing.floor')} placeholder="—" value={empty} onChange={setEmpty} />
        <NumberTextInput id="story-number-value" label={storyT(locale, 'listing.floor')} placeholder="—" value={value} onChange={setValue} min={0} max={200} />
        <NumberTextInput id="story-number-error" label={storyT(locale, 'listing.floor')} placeholder="—" value={refused} onChange={setRefused} error={storyT(locale, 'listing.error_floor_exceeds_building')} />
        <NumberTextInput id="story-number-disabled" label={storyT(locale, 'listing.floor')} placeholder="—" value={3} onChange={() => {}} disabled />
      </Stack>
    </StoryPageGutter>
  )
}
export const NumberInput: Story = { render: () => <NumberInputDemo /> }
