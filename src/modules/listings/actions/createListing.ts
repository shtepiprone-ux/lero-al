'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { listingSchema } from '@/modules/listings/validations'
import type { ListingInput } from '@/modules/listings/validations'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import { computeExpiresAt } from '@/modules/listings/domain/listingConstants'

interface CreateListingPayload extends ListingInput {
  images: ListingImage[]
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${base}-${Date.now().toString(36)}`
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

  const data = parsed.data
  const slug = generateSlug(data.title)
  const expiresAt = computeExpiresAt()

  const { data: listing, error: insertError } = await supabase
    .from('listings')
    .insert({
      ...data,
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
    return { error: insertError?.message ?? 'insert_failed' }
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
    }
  }

  return { slug: listing.slug }
}
