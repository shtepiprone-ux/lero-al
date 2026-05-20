'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import type { ReportReason } from '@/types/database'

const VALID_REASONS: ReportReason[] = [
  'spam', 'fraud', 'duplicate', 'wrong_category', 'offensive', 'other',
]

export async function reportListingAction(
  listingId: string,
  reason: string,
  comment: string,
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthorized' }

  if (!VALID_REASONS.includes(reason as ReportReason)) return { error: 'invalid_reason' }

  const trimmedComment = comment.trim().slice(0, 500) || null

  const supabase = await createClient()

  // Guard: one report per user per listing
  const { data: existing } = await supabase
    .from('listing_reports')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'already_reported' }

  const { error } = await supabase
    .from('listing_reports')
    .insert({
      listing_id: listingId,
      user_id: user.id,
      reason: reason as ReportReason,
      comment: trimmedComment,
      // eslint-disable-next-line no-restricted-syntax -- report status, not listing status transition
      status: 'pending',
    })

  if (error) {
    console.error('[reportListing] insert failed', error)
    return { error: 'save_failed' }
  }

  return {}
}
