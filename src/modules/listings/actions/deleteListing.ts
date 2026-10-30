'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { hasPermission } from '@/lib/auth/permissions'
import { routing } from '@/i18n/routing'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'

/**
 * Deletes a listing owned by the authenticated user.
 * Ownership (or the `listings.delete` permission) is decided in this action, with the session's client; the DELETE itself runs with the service role and must
 * delete exactly one row (Task 923 R71 (l)): the session has no DELETE policy on listings, so a delete through it removed nothing and still answered success.
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

  if (typeof listingId !== 'string' || !listingId) return { error: 'not_found' }

  const supabase = await createClient()

  // Ownership is decided HERE, before anything is written (Task 923 Revision 7, finding S27). A refusal by row-level security deletes zero rows and is not an
  // error, so relying on it let the code below clean up the images and refresh the cache for a listing that was never deleted, and it let any signed-in person
  // delete any listing wherever the policy was missing or wrong. The owner may delete; anyone else needs the `listings.delete` permission.
  const { data: listing } = await supabase.from('listings').select('id, user_id').eq('id', listingId).maybeSingle()
  if (!listing) return { error: 'not_found' }
  if (listing.user_id !== user.id && !(await hasPermission('listings.delete').catch(() => false))) return { error: 'forbidden' }

  const db = createAdminClient()

  // Fetch images before cascade delete — listing_images are removed with the listing. A failed read refuses: without it the files could not be released.
  const { data: imagesToDelete, error: imagesError } = await db
    .from('listing_images')
    .select('url')
    .eq('listing_id', listingId)
  if (imagesError) {
    console.error('deleteListingAction: image read failed', { code: imagesError.code, listingId, userId: user.id })
    return { error: 'delete_failed' }
  }

  // Exactly one row must be deleted: any other answer is a failure, with no clean-up of files and no cache refresh. No database message reaches the browser (R71 (f)).
  const { data: deleted, error } = await db
    .from('listings')
    .delete()
    .eq('id', listingId)
    .select('id')

  if (error || deleted?.length !== 1) {
    console.error('deleteListingAction failed', { code: error?.code, rows: deleted?.length ?? 0, listingId, userId: user.id })
    return { error: 'delete_failed' }
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
