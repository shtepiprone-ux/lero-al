import { z } from 'zod'
import { MIN_PROPERTY_YEAR } from '@/modules/listings/constants'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'

/**
 * The largest price a listing may carry, per currency (Task 923 R101, owner decision D71). The largest stored prices are 80 000 000 lek and 456 000 euro, and none has a fraction.
 * This map is the one source for the schema, the form and the server. Hardening v8b's per-currency CHECK on `listings.price` / `price_old` takes the same two numbers, so the
 * code refuses a value before the database would.
 */
export const MAX_LISTING_PRICE_BY_CURRENCY = { EUR: 10_000_000_000, ALL: 1_000_000_000_000 } as const

/** True for a price in `0 < price <= ceiling` of its currency. */
export function isListingPriceWithinCeiling(price: number, currency: keyof typeof MAX_LISTING_PRICE_BY_CURRENCY): boolean {
  return price > 0 && price <= MAX_LISTING_PRICE_BY_CURRENCY[currency]
}

const listingBaseSchema = z.object({
  // trim BEFORE the length rule (Task 923 Revision 7): five spaces used to pass `min(5)` and be stored as an empty title
  title:        z.string().trim().min(5).max(150),
  description:  z.string().max(5000).optional().transform(v => v?.trim() || undefined),
  // the base bound is the largest ceiling; the ceiling of the listing's own currency is checked in `listingSchema`'s superRefine below
  price:        z.number().positive().max(MAX_LISTING_PRICE_BY_CURRENCY.ALL),
  price_old:    z.number().positive().max(MAX_LISTING_PRICE_BY_CURRENCY.ALL).optional(),
  currency:     z.enum(['ALL', 'EUR']),
  listing_type: z.enum(['sale', 'rent']),
  property_type: z.enum(['apartment', 'house', 'room', 'land', 'commercial', 'office', 'garage', 'parking', 'warehouse', 'other']),
  condition:    z.enum(['new_build', 'good', 'needs_repair', 'needs_renovation', 'under_construction']).optional(),
  wall_type:    z.enum(['brick', 'concrete', 'panel', 'wood', 'other']).optional(),
  heating:      z.enum(['electric', 'wood', 'central', 'gas', 'none']).optional(),
  rooms:        z.number().int().min(0).max(50).optional(),
  bedrooms:     z.number().int().min(0).max(50).optional(),
  bathrooms:    z.number().int().min(0).max(20).optional(),
  toilets:      z.number().int().min(0).max(20).optional(),
  area_gross:   z.number().positive().max(100000).optional(),
  area_net:     z.number().positive().max(100000).optional(),
  // Technical floor range: -10 to 200. Business constraint enforced in superRefine below.
  floor:        z.number().int().min(-10).max(200).optional(),
  // total_floors serves as "building floors" for house and total floors for apartments.
  total_floors: z.number().int().min(1).max(200).optional(),
  year_built:   z.number().int().min(MIN_PROPERTY_YEAR).max(new Date().getFullYear() + 5).optional(),
  location_id:  z.number().int().positive().optional(),
  address:      z.string().max(300).optional().transform(v => v?.trim() || undefined),
  lat:          z.number().min(-90).max(90).optional(),
  lng:          z.number().min(-180).max(180).optional(),
  multi_storey_building: z.boolean().optional(),
  land_legal_status:          z.enum(['agricultural', 'urban', 'forest', 'pasture']).optional(),
  land_zoning:                z.enum(['residential', 'commercial', 'tourism', 'industrial', 'mixed_use']).optional(),
  land_development_potential: z.enum(['buildable', 'change_of_use_required', 'non_buildable']).optional(),
  offer_type:                 z.enum(['owner', 'agency', 'developer']).optional(),
  purchase_conditions:        z.array(z.enum(['installment', 'mortgage', 'assignment', 'negotiable', 'no_commission'])).optional(),
})

export const listingSchema = listingBaseSchema.superRefine((data, ctx) => {
  const schema = getSchema(data.property_type)

  // Rule 0: a price is bounded by the ceiling of its own currency (Task 923 R101, D71); `price_old` is set by the server, and the schema bounds it the same way.
  if (!isListingPriceWithinCeiling(data.price, data.currency)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'error_price' })
  }
  if (data.price_old !== undefined && !isListingPriceWithinCeiling(data.price_old, data.currency)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price_old'], message: 'error_price' })
  }

  // Rule 1: negative floors only when the type permits it AND checkbox is on.
  if (data.floor !== undefined && data.floor < 0) {
    const allowed = schema.floor.allowNegative && data.multi_storey_building === true
    if (!allowed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['floor'], message: 'error_floor_negative' })
    }
  }

  // Rule 2: floor cannot exceed the total number of building floors.
  if (data.floor !== undefined && data.total_floors !== undefined && data.floor > data.total_floors) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['floor'], message: 'error_floor_exceeds_building' })
  }

  // Rule 3: enforce schema-declared required fields (derived from ui.fields).
  for (const fieldDef of schema.ui.fields.filter(f => f.required)) {
    if (!(data as Record<string, unknown>)[fieldDef.key]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [fieldDef.key], message: 'error_required' })
    }
  }
})

export type ListingInput = z.infer<typeof listingSchema>

export const step1Schema = listingBaseSchema.pick({
  title: true, listing_type: true, property_type: true,
  description: true, price: true, price_old: true, currency: true,
})

export type Step1Input = z.infer<typeof step1Schema>
