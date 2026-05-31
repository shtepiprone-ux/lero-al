'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { listingSchema } from '@/modules/listings/validations'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import type { ListingInput } from '@/modules/listings/validations'
import { checkEditPermission } from '@/modules/listings/domain/listingPermissions'
import type { ListingStatus } from '@/types/database'
import { routing } from '@/i18n/routing'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'

interface UpdateListingPayload extends ListingInput {
  images: ListingImage[]
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
    .select('id, slug, user_id, status')
    .eq('id', listingId)
    .single()

  if (!existing) return { error: 'not_found' }

  // Fetch role only when the caller is not the owner (avoids unnecessary query for owners)
  let userRole: string | null = null
  if (existing.user_id !== user.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  const check = checkEditPermission(user.id, {
    user_id: existing.user_id,
    status: existing.status as ListingStatus,
  }, userRole)

  if (!check.ok) return { error: check.reason }

  const parsed = listingSchema.safeParse(payload)
  if (!parsed.success) return { error: 'validation_failed' }

  const { error: updateError } = await supabase
    .from('listings')
    .update(parsed.data)
    .eq('id', listingId)

  if (updateError) {
    console.error('Failed to update listing', { error: updateError, listingId })
    return { error: updateError.message ?? 'update_failed' }
  }

  // Capture old image URLs before wiping — needed for H.5 Cloudinary cleanup below.
  const { data: oldImages } = await supabase
    .from('listing_images')
    .select('url')
    .eq('listing_id', listingId)
  const oldUrls = oldImages?.map(i => i.url) ?? []

  await supabase.from('listing_images').delete().eq('listing_id', listingId)

  if (payload.images.length > 0) {
    const imageRows = payload.images.map(img => ({
      listing_id: listingId,
      url: img.url,
      is_cover: img.is_cover,
      order: img.order,
    }))
    const { error: imgError } = await supabase.from('listing_images').insert(imageRows)
    if (imgError) {
      console.error('Failed to update listing images', { error: imgError, listingId })
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

  return { slug: existing.slug, status: existing.status as ListingStatus }
}
