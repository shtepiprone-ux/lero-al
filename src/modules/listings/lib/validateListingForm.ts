import { isListingPriceWithinCeiling } from '@/modules/listings/validations'
import type { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FormValues } from '@/modules/listings/types/form'

/** The errors of the listing form, keyed by field; a key with no message is not an error. */
export type ListingFormErrors = Partial<Record<keyof FormValues, string>>

/**
 * The checks the listing form makes before it saves (Task 957 Revision 3, R3-4; Review 3 F19). They are the checks `ListingFormShell.handleSubmit` made inline, moved here unchanged and
 * made pure, so that the container and the Story harness (`src/stories/fixtures/ListingFormHarness.tsx`) refuse exactly the same values. `t` is the `listing` translator: the messages are
 * its `error_title`, `error_property_type`, `error_price`, `error_images`, `error_floor_negative`, `error_floor_exceeds_building`, `error_parking_floor` (Revision 3, O1001-2; the one check that
 * did not exist on `main`) and `error_required`. The server actions check the same
 * values again (`createListing`, `updateListing`); this function only decides what the form shows.
 */
export function validateListingForm(data: FormValues, schema: ReturnType<typeof getSchema>, t: (key: string) => string): ListingFormErrors {
  const errors: ListingFormErrors = {}

  if (!data.title || data.title.trim().length < 5) {
    errors.title = t('error_title')
  }
  if (!data.property_type) {
    errors.property_type = t('error_property_type')
  }
  // a price above the ceiling of its currency is refused with the same message as an invalid price (Task 923 R101): the server and the database refuse it too
  if (!data.price || !isListingPriceWithinCeiling(data.price, data.currency)) {
    errors.price = t('error_price')
  }
  if (data.images.length === 0) {
    errors.images = t('error_images')
  }

  if (data.floor !== undefined && data.property_type) {
    const allowsNeg = schema.floor.allowNegative && data.multi_storey_building === true
    if (data.floor < 0 && !allowsNeg) {
      errors.floor = t('error_floor_negative')
    } else if (data.total_floors !== undefined && data.floor > data.total_floors) {
      errors.floor = t('error_floor_exceeds_building')
    }
  }

  // the floor of an underground parking: a whole number from -10 to -1, and only for an underground parking (O1001-2)
  if (data.parking_floor !== undefined && (data.parking_type !== 'underground' || !Number.isInteger(data.parking_floor) || data.parking_floor < -10 || data.parking_floor > -1)) {
    errors.parking_floor = t('error_parking_floor')
  }

  // Schema-declared required fields — derived from ui.fields.
  const dataRecord = data as unknown as Record<string, unknown>
  for (const fieldDef of schema.ui.fields.filter(f => f.required)) {
    if (!dataRecord[fieldDef.key]) {
      errors[fieldDef.key as keyof FormValues] = t('error_required')
    }
  }

  return errors
}
