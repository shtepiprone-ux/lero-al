'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { routing } from '@/i18n/routing'

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

  const supabase = await createClient()
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)

  if (error) {
    console.error('deleteListingAction failed', { error, listingId, userId: user.id })
    return { error: error.message }
  }

  revalidateTag('site-stats')
  // Removed listing must disappear from the public listings index immediately.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings`, 'page')
  }
  return {}
}
