'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { listingSchema } from '@/modules/listings/validations'
import type { ListingInput } from '@/modules/listings/validations'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import { computeExpiresAt } from '@/modules/listings/domain/listingConstants'
import { isValidImagePayload } from '@/lib/uploads/imageUrl'
import { generateSlug } from '@/modules/listings/lib/generateSlug'

interface CreateListingPayload extends ListingInput {
  images: ListingImage[]
}

/**
 * The property type and the currency of a listing must be ACTIVE rows of their catalogues (Task 923 R100), the way the cabinet checks the preferred currency
 * (`updateCabinetProfile`): hardening v8b's CHECKs accept nothing else, so a value the staff switched off is refused here with a fixed code, never with the database's own
 * message. Both catalogues are public tables, read with the person's own session. A catalogue that cannot be read refuses: nothing is written on a guess. A catalogue
 * with no active row at all has nothing to check against and lets the database decide. The same check, with the same answers, is in `updateListing`.
 */
async function catalogueRefusal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyType: string,
  currency: string,
): Promise<'invalid_property_type' | 'invalid_currency' | null> {
  const [types, currencies] = await Promise.all([
    supabase.from('property_types').select('slug').eq('is_active', true),
    supabase.from('currencies').select('code').eq('is_active', true),
  ])
  if (types.error) console.error('createListing: the property types could not be read', { code: types.error.code })
  if (currencies.error) console.error('createListing: the currencies could not be read', { code: currencies.error.code })
  if (types.error) return 'invalid_property_type'
  if (currencies.error) return 'invalid_currency'
  const activeTypes = new Set((types.data ?? []).map((r) => r.slug as string))
  if (activeTypes.size > 0 && !activeTypes.has(propertyType)) return 'invalid_property_type'
  const activeCurrencies = new Set((currencies.data ?? []).map((r) => r.code as string))
  if (activeCurrencies.size > 0 && !activeCurrencies.has(currency)) return 'invalid_currency'
  return null
}

export async function createListing(
  payload: CreateListingPayload
): Promise<{ slug: string } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' }

  const blockError = await getBlockedError(user.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()

  const parsed = listingSchema.safeParse(payload)
  if (!parsed.success) return { error: 'validation_failed' }
  // an image address from the browser is output in <img src> on public pages: only this project's Cloudinary cloud is accepted (Task 923 Revision 7, S21)
  if (!isValidImagePayload(payload.images)) return { error: 'invalid_image' }
  const refusal = await catalogueRefusal(supabase, parsed.data.property_type, parsed.data.currency)
  if (refusal) return { error: refusal }

  const data = parsed.data
  const slug = generateSlug(data.title)
  const expiresAt = computeExpiresAt()

  const { data: listing, error: insertError } = await supabase
    .from('listings')
    .insert({
      ...data,
      price_old: null, // server-owned (Sprint 88 D88-2): the payload cannot set it
      slug,
      user_id: user.id,
      status: 'pending',
      expires_at: expiresAt,
      views_count: 0,
    })
    .select('id, slug')
    .single()

  if (insertError || !listing) {
    console.error('Failed to create listing', { error: insertError, userId: user.id })
    return { error: 'insert_failed' }
  }

  if (payload.images.length > 0) {
    const imageRows = payload.images.map(img => ({
      listing_id: listing.id,
      url: img.url,
      is_cover: img.is_cover,
      order: img.order,
    }))

    const { error: imgError } = await supabase
      .from('listing_images')
      .insert(imageRows)

    if (imgError) {
      console.error('Failed to insert listing images', { error: imgError, listingId: listing.id })
      // Task 923 R67 (a): a listing whose pictures could not be saved is reported as a failure, not answered with a slug as if it were complete.
      return { error: 'images_failed' }
    }
  }

  return { slug: listing.slug }
}
