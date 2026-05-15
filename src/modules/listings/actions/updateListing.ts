'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { listingSchema } from '@/modules/listings/validations'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import type { ListingInput } from '@/modules/listings/validations'
import { checkEditPermission } from '@/modules/listings/domain/listingPermissions'
import type { ListingStatus } from '@/types/database'
import { routing } from '@/i18n/routing'

interface UpdateListingPayload extends ListingInput {
  images: ListingImage[]
}

export async function updateListing(
  listingId: string,
  payload: UpdateListingPayload,
): Promise<{ slug: string } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' }

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

  // Invalidate the listing detail page for every active locale so that
  // navigating back (or using a cached router entry) shows the updated data.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings/${existing.slug}`, 'page')
  }

  return { slug: existing.slug }
}
