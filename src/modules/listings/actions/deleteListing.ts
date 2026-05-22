'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { routing } from '@/i18n/routing'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'

/**
 * Deletes a listing owned by the authenticated user.
 * Uses the server Supabase client so RLS policies apply — only the listing
 * owner (or admin/moderator via RLS) can delete their own rows.
 *
 * Calls revalidateTag('site-stats') on success so the homepage active-listing
 * counter reflects the deletion immediately instead of waiting for the 1-hour
 * cache TTL.
 */
export async function deleteListingAction(
  listingId: string
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(user.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()

  // Fetch images before cascade delete — listing_images are removed with the listing.
  const { data: imagesToDelete } = await supabase
    .from('listing_images')
    .select('url')
    .eq('listing_id', listingId)

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)

  if (error) {
    console.error('deleteListingAction failed', { error, listingId, userId: user.id })
    return { error: error.message }
  }

  // H.5: clean up Cloudinary assets for all images that belonged to this listing.
  if (imagesToDelete?.length) {
    const publicIds = imagesToDelete
      .map(i => publicIdFromUrl(i.url))
      .filter((pid): pid is string => pid !== null)
    await Promise.allSettled(
      publicIds.map(pid =>
        deleteAsset(pid, { reason: 'listing_deleted' }).catch(err =>
          console.error('[deleteListingAction] image cleanup failed:', err),
        ),
      ),
    )
  }

  revalidateTag('site-stats')
  // Removed listing must disappear from the public listings index immediately.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings`, 'page')
  }
  return {}
}
