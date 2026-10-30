'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { requireViewer } from '@/lib/auth/requireViewer'
import { roleHasPermission } from '@/lib/auth/permissions'
import { listingSchema } from '@/modules/listings/validations'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import type { ListingInput } from '@/modules/listings/validations'
import { checkEditPermission } from '@/modules/listings/domain/listingPermissions'
import { computeNextPriceOld } from '@/modules/listings/domain/priceOld'
import { isListingVisible } from '@/modules/listings/domain/listingSemanticHelpers'
import type { ListingStatus } from '@/types/database'
import { routing } from '@/i18n/routing'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'
import { isValidImagePayload } from '@/lib/uploads/imageUrl'
import { applyListingTransitionByStatus } from '@/modules/listings/actions/applyListingTransition'

interface UpdateListingPayload extends ListingInput {
  images: ListingImage[]
}

/**
 * The property type and the currency of a listing must be ACTIVE rows of their catalogues (Task 923 R100), the way the cabinet checks the preferred currency
 * (`updateCabinetProfile`): hardening v8b's CHECKs accept nothing else, so a value the staff switched off is refused here with a fixed code, never with the database's own
 * message. Both catalogues are public tables, read with the caller's own session. A catalogue that cannot be read refuses: nothing is written on a guess. A catalogue
 * with no active row at all has nothing to check against and lets the database decide. The same check, with the same answers, is in `createListing`.
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
  if (types.error) console.error('updateListing: the property types could not be read', { code: types.error.code })
  if (currencies.error) console.error('updateListing: the currencies could not be read', { code: currencies.error.code })
  if (types.error) return 'invalid_property_type'
  if (currencies.error) return 'invalid_currency'
  const activeTypes = new Set((types.data ?? []).map((r) => r.slug as string))
  if (activeTypes.size > 0 && !activeTypes.has(propertyType)) return 'invalid_property_type'
  const activeCurrencies = new Set((currencies.data ?? []).map((r) => r.code as string))
  if (activeCurrencies.size > 0 && !activeCurrencies.has(currency)) return 'invalid_currency'
  return null
}

export async function updateListing(
  listingId: string,
  payload: UpdateListingPayload,
): Promise<{ slug: string; status: ListingStatus } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(user.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('listings')
    .select('id, slug, user_id, status, price, price_old, currency')
    .eq('id', listingId)
    .single()

  if (!existing) return { error: 'not_found' }

  // Fetch role only when the caller is not the owner (avoids unnecessary query for owners)
  // The role comes from requireViewer() (Task 923 R44); a failed lookup gives no role, so no staff right.
  let userRole: string | null = null
  if (existing.user_id !== user.id) {
    const viewer = await requireViewer()
    userRole = viewer.ok ? viewer.role : null
  }

  const check = checkEditPermission(user.id, {
    user_id: existing.user_id,
    status: existing.status as ListingStatus,
  }, userRole)

  if (!check.ok) return { error: check.reason }

  // Who writes (Task 923 R71 (e), R69 (a)): the owner keeps the session's client. A staff member editing ANOTHER person's listing writes with the service role,
  // here, after the permission check above: the row-level policies speak for the owner, so a staff edit through the session was refused silently (the images) and,
  // once the staff write policy on listings is narrowed to reading, would be refused for the listing row too.
  const isOwner = existing.user_id === user.id
  // Task 923 R75: a moderator editing ANOTHER person's listing needs the `listings.moderate` key (an administrator holds every key)
  if (!isOwner && !(await roleHasPermission(userRole ?? '', 'listings.moderate'))) return { error: 'forbidden' }
  const writer = isOwner ? supabase : createAdminClient()

  const parsed = listingSchema.safeParse(payload)
  if (!parsed.success) return { error: 'validation_failed' }
  // an image address from the browser is output in <img src> on public pages: only this project's Cloudinary cloud is accepted (Task 923 Revision 7, S21)
  if (!isValidImagePayload(payload.images)) return { error: 'invalid_image' }
  const refusal = await catalogueRefusal(supabase, parsed.data.property_type, parsed.data.currency)
  if (refusal) return { error: refusal }

  // Moderation of an edit (Task 923 R74, owner decision D53): the OWNER's edit of an ACTIVE listing is published only after staff approve it. The listing moves to
  // `pending` FIRST, through the one status gateway (its compare-and-set holds, R67 (e)), and only then is the content written, so no moment exists in which new content
  // is visible. A failed move writes nothing and returns `transition_failed`; a content write that fails afterwards leaves the listing `pending` (it never goes back to
  // `active` by itself). At any other status the edit is saved with the status unchanged and no transition; a staff edit keeps the status too.
  let resultingStatus = existing.status as ListingStatus
  if (isOwner && isListingVisible(existing.status as ListingStatus)) {
    const moved = await applyListingTransitionByStatus(listingId, 'pending', { userId: user.id, role: null, source: 'cabinet' })
    if (!moved.ok) {
      console.error('updateListing: the move to review failed, nothing was written', { listingId, reason: moved.reason })
      return { error: 'transition_failed' }
    }
    resultingStatus = moved.nextStatus
  }

  const { error: updateError } = await writer
    .from('listings')
    .update({
      ...parsed.data,
      // price_old is server-owned (Sprint 88 D88-2/D88-3): a client value never reaches the DB.
      price_old: computeNextPriceOld({
        prev: { price: existing.price, priceOld: existing.price_old, currency: existing.currency },
        next: { price: parsed.data.price, currency: parsed.data.currency },
      }),
    })
    .eq('id', listingId)

  if (updateError) {
    console.error('Failed to update listing', { error: updateError, listingId })
    return { error: 'update_failed' }
  }

  // Capture the old image rows before wiping: their URLs feed the H.5 Cloudinary cleanup below, and the whole rows restore the gallery if the new rows cannot be
  // written (Task 923 R67 (a)). A failed read refuses before anything is deleted: without the old rows a failure could not be undone.
  const { data: oldImages, error: oldImagesError } = await writer
    .from('listing_images')
    .select('*')
    .eq('listing_id', listingId)
  if (oldImagesError || !oldImages) {
    console.error('Failed to read listing images', { error: oldImagesError, listingId })
    return { error: 'images_failed' }
  }
  const oldUrls = oldImages.map(i => i.url)

  const { error: deleteError } = await writer.from('listing_images').delete().eq('listing_id', listingId)
  if (deleteError) {
    console.error('Failed to clear listing images', { error: deleteError, listingId })
    return { error: 'images_failed' }
  }

  if (payload.images.length > 0) {
    const imageRows = payload.images.map(img => ({
      listing_id: listingId,
      url: img.url,
      is_cover: img.is_cover,
      order: img.order,
    }))
    const { error: imgError } = await writer.from('listing_images').insert(imageRows)
    if (imgError) {
      console.error('Failed to update listing images', { error: imgError, listingId })
      // The gallery was emptied above: put the previous rows back, run NO Cloudinary cleanup (the files the old rows point at must stay), and report the failure.
      if (oldImages.length > 0) {
        const { error: restoreError } = await writer.from('listing_images').insert(oldImages)
        if (restoreError) console.error('Failed to restore listing images', { error: restoreError, listingId, rows: oldImages.length })
      }
      return { error: 'images_failed' }
    }
  }

  // H.5: delete Cloudinary assets for images that are no longer in the listing.
  // New images are now in DB — reference check in deleteAsset will skip any that are re-used.
  // DB update is fully committed before any delete (order enforced by await above).
  const newUrlSet = new Set(payload.images.map(i => i.url))
  const orphanedPublicIds = oldUrls
    .filter(url => !newUrlSet.has(url))
    .map(publicIdFromUrl)
    .filter((pid): pid is string => pid !== null)

  if (orphanedPublicIds.length > 0) {
    await Promise.allSettled(
      orphanedPublicIds.map(pid =>
        deleteAsset(pid, { reason: 'listing_image_removed' }).catch(err =>
          console.error('[updateListing] image cleanup failed:', err),
        ),
      ),
    )
  }

  // Invalidate the listing detail page AND the public listings index for every
  // active locale so that navigating back shows updated price/title immediately.
  // Also invalidate /cabinet so the SSR snapshot picks up the new cover image
  // (realtime UPDATE events only carry scalar fields, never joined relations).
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings/${existing.slug}`, 'page')
    revalidatePath(`/${locale}/listings`, 'page')
  }
  revalidatePath('/cabinet')

  return { slug: existing.slug, status: resultingStatus }
}
