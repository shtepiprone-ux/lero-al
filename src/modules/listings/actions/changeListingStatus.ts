/**
 * Cabinet/shared edit-form status-change action — Task 238 (Epic Y.3).
 *
 * Thin 'use server' bridge from the shared listing edit form's "Change status"
 * control to the transition gateway (`applyListingTransitionByStatus`). Resolves
 * the caller's identity + role server-side (never trusts a client-supplied role)
 * and tags the actor source as 'cabinet' since both owner and staff reach this
 * control through the same `/[locale]/listings/[slug]/edit` route.
 */

'use server'

import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { applyListingTransitionByStatus, type TransitionApplicationResult } from './applyListingTransition'
import type { ListingStatus } from '@/types/database'

export async function changeListingStatusAction(
  listingId: string,
  toStatus: ListingStatus,
): Promise<TransitionApplicationResult> {
  const user = await getUser()
  if (!user) return { ok: false, reason: 'forbidden' }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return applyListingTransitionByStatus(listingId, toStatus, {
    userId: user.id,
    role: profile?.role ?? null,
    source: 'cabinet',
  })
}
